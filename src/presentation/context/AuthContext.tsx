import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS, logActivityFirestore, upsertUserRecordFirestore } from '../../lib/firebase';
import { UserRole, ROLE_PERMISSIONS, RolePermission, SupportedLanguage, LANGUAGES } from '../../constants';
import { translations, TranslationDictionary } from '../../i18n/translations';
import { UserRecord, ActivityLog } from '../../types';
import { logger } from '../../infrastructure/logging/logger';

interface AuthContextType {
  user: User | null;
  userRecord: UserRecord | null;
  role: UserRole;
  language: SupportedLanguage;
  dir: 'ltr' | 'rtl';
  themeMode: 'dark' | 'light';
  permissions: RolePermission;
  t: TranslationDictionary;
  loading: boolean;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  sessionStartTime: Date | null;
  lastActivityTime: Date | null;
  loginWithEmail: (email: string, pass: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateProfileDetails: (displayName: string, photoURL?: string) => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleTheme: () => void;
  refreshUserRecord: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [role, setRole] = useState<UserRole>('Cashier');
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('app_language') as SupportedLanguage) || 'ar';
  });
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState<boolean>(true);
  const [rememberMe, setRememberMeState] = useState<boolean>(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<Date | null>(null);

  const langObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const dir = langObj.dir as 'ltr' | 'rtl';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [dir, language]);

  // Track activity timestamp for session management
  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(new Date());
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  const fetchOrCreateUserRecord = async (firebaseUser: User, overrideRole?: UserRole): Promise<UserRecord> => {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserRecord;
        const resolvedBranchId = data.branchId || (typeof data.branch === 'string' && (data.branch.startsWith('branch_') || data.branch.startsWith('main_branch_')) ? data.branch : (data.role === 'Owner' ? 'all' : ''));
        const updatedRecord: UserRecord = {
          ...data,
          branchId: resolvedBranchId,
          lastLoginAt: new Date().toISOString(),
          emailVerified: firebaseUser.emailVerified
        };
        await setDoc(userDocRef, updatedRecord, { merge: true });
        setUserRecord(updatedRecord);
        if (data.role) setRole(data.role);
        return updatedRecord;
      } else {
        const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
        const resolvedRole: UserRole = overrideRole || 'Cashier';
        const isOwner = resolvedRole === 'Owner';
        const newRecord: UserRecord = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || `${firebaseUser.uid.substring(0, 8)}@restaurant.internal`,
          displayName: firebaseUser.displayName || 'Enterprise User',
          role: resolvedRole,
          branch: isOwner ? 'All Branches (HQ)' : 'Unassigned Branch',
          branchId: isOwner ? 'all' : '',
          status: isDemo ? 'active' : 'pending',
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newRecord);
        setUserRecord(newRecord);
        setRole(newRecord.role);
        return newRecord;
      }
    } catch (err) {
      console.error('Error syncing user record from Firestore:', err);
      // Deny by default: Do not grant active status or default privileges upon lookup failure
      const fallbackRecord: UserRecord = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'user@restaurant.internal',
        displayName: firebaseUser.displayName || 'Unverified User',
        role: 'Cashier',
        branch: 'Unassigned Branch',
        branchId: '',
        status: 'pending',
        emailVerified: firebaseUser.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      setUserRecord(fallbackRecord);
      setRole('Cashier');
      return fallbackRecord;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        if (firebaseUser.isAnonymous && process.env.NODE_ENV !== 'development') {
          // In production, anonymous users must not have staff ERP user records
          setUserRecord(null);
          setSessionStartTime(null);
          setLoading(false);
          return;
        }
        setSessionStartTime(new Date());
        setLastActivityTime(new Date());
        await fetchOrCreateUserRecord(firebaseUser);
        logger.info(`User session active: ${firebaseUser.email || firebaseUser.uid}`, 'AuthContext');
      } else {
        setUserRecord(null);
        setSessionStartTime(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUserRecord = async () => {
    if (user) {
      await fetchOrCreateUserRecord(user);
    }
  };

  const setRememberMe = (remember: boolean) => {
    setRememberMeState(remember);
  };

  const loginWithEmail = async (email: string, pass: string, remember: boolean = true) => {
    setLoading(true);
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const rec = await fetchOrCreateUserRecord(cred.user);
      await logActivityFirestore({
        userId: cred.user.uid,
        userEmail: cred.user.email || email,
        userName: rec.displayName,
        userRole: rec.role,
        action: 'LOGIN',
        details: 'Signed in via Email & Password'
      });
      logger.info(`Email login successful: ${email}`, 'AuthContext');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        logger.warn(`Email login attempt failed (invalid credentials) for ${email}`, 'AuthContext');
      } else {
        logger.error('Email login failed', 'AuthContext', err);
      }
      let userFriendlyMessage = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        userFriendlyMessage = language === 'ar' 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.'
          : language === 'so'
          ? 'Email-ka ama furaha sirta ah waa ma saneeyn. Fadlan hubi oo dib u isku day.'
          : 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMessage = language === 'ar'
          ? 'صيغة البريد الإلكتروني غير صحيحة.'
          : 'Invalid email address format.';
      } else if (err.code === 'auth/too-many-requests') {
        userFriendlyMessage = language === 'ar'
          ? 'تم حظر المحاولة مؤقتاً بسبب كثرة المحاولات الفاشلة. يرجى المحاولة لاحقاً.'
          : 'Access temporarily disabled due to many failed login attempts.';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMessage = language === 'ar'
          ? 'تعذر الاتصال بخادم المصادقة. يرجى التحقق من اتصال الإنترنت.'
          : language === 'so'
          ? 'Xiriirinta server-ka ayaa guuldareysatay. Fadlan hubi internet-kaaga.'
          : 'Network connection error while communicating with authentication service. Please check your internet connection.';
      }
      throw new Error(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const rec = await fetchOrCreateUserRecord(cred.user);
      await logActivityFirestore({
        userId: cred.user.uid,
        userEmail: cred.user.email || 'google-user@internal',
        userName: rec.displayName,
        userRole: rec.role,
        action: 'LOGIN',
        details: 'Signed in via Google OAuth'
      });
      logger.info(`Google login successful: ${cred.user.email}`, 'AuthContext');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        logger.warn('Google login unauthorized domain error', 'AuthContext');
        const userFriendlyMessage = language === 'ar'
          ? 'نطاق هذا الموقع غير مصرح به في حساب Firebase لتسجيل الدخول بـ Google. يرجى استخدام البريد الإلكتروني وكلمة المرور.'
          : language === 'so'
          ? 'Shabadani looma ogola Google Sign-in. Fadlan adeegso Email iyo Password.'
          : 'Domain unauthorized for Google Sign-in in Firebase. Please log in using Email & Password.';
        throw new Error(userFriendlyMessage);
      }
      logger.error('Google login failed', 'AuthContext', err);
      let userFriendlyMessage = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = language === 'ar'
          ? 'تم إغلاق نافذة تسجيل الدخول من قبل المستخدم.'
          : 'Login popup was closed before completing authentication.';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMessage = language === 'ar'
          ? 'تعذر الاتصال بخادم المصادقة. يرجى التحقق من اتصال الإنترنت.'
          : 'Network error during Google login. Please check your connection.';
      }
      throw new Error(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const isDemoAllowed = () => {
    return import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE === 'development';
  };

  const quickDemoLogin = async (targetRole: UserRole) => {
    if (!isDemoAllowed()) {
      const msg = language === 'ar'
        ? 'تسجيل الدخول التجريبي معطل في بيئة الإنتاج. يرجى تسجيل الدخول بحساب Firebase مصرح به.'
        : 'Demo login is strictly disabled in production. Please sign in with a valid Firebase account.';
      logger.warn('Attempted quickDemoLogin in production mode - DENIED', 'AuthContext');
      throw new Error(msg);
    }
    setLoading(true);
    try {
      setRole(targetRole);
      if (user) {
        const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
        await setDoc(userDocRef, { role: targetRole }, { merge: true });
        setUserRecord(prev => prev ? { ...prev, role: targetRole } : null);
        await logActivityFirestore({
          userId: user.uid,
          userEmail: user.email || 'demo@restaurant-erp.internal',
          userName: user.displayName || `${targetRole} User`,
          userRole: targetRole,
          action: 'SWITCH_ROLE',
          details: `Switched demo role to ${targetRole}`
        });
      } else {
        // Set up synthetic demo user record for development testing mode only
        const safeRole = targetRole || 'Cashier';
        const isOwner = safeRole === 'Owner';
        const demoRecord: UserRecord = {
          uid: `demo_${safeRole.toLowerCase()}`,
          email: `${safeRole.toLowerCase()}@restaurant-erp.internal`,
          displayName: `Demo ${safeRole.toUpperCase()}`,
          role: targetRole,
          branch: isOwner ? 'All Branches (HQ)' : 'Headquarters - Mogadishu Main',
          branchId: isOwner ? 'all' : 'branch_hq_01',
          status: 'active',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        setUserRecord(demoRecord);
      }
      logger.info(`Demo preset role applied: ${targetRole}`, 'AuthContext');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user && userRecord) {
        await logActivityFirestore({
          userId: user.uid,
          userEmail: user.email || 'user@internal',
          userName: userRecord.displayName,
          userRole: role,
          action: 'LOGOUT',
          details: 'User logged out'
        });
      }
      await signOut(auth);
      setUser(null);
      setUserRecord(null);
      setSessionStartTime(null);
      logger.info('User logged out', 'AuthContext');
    } catch (err) {
      logger.error('Logout error', 'AuthContext', err);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    if (user) {
      await logActivityFirestore({
        userId: user.uid,
        userEmail: email,
        userName: userRecord?.displayName || 'User',
        userRole: role,
        action: 'FORGOT_PASSWORD',
        details: `Password reset link sent to ${email}`
      });
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user || !user.email) throw new Error('No authenticated user found');
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
    await logActivityFirestore({
      userId: user.uid,
      userEmail: user.email,
      userName: userRecord?.displayName || 'User',
      userRole: role,
      action: 'CHANGE_PASSWORD',
      details: 'Password updated successfully'
    });
  };

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in');
    await sendEmailVerification(user);
    await logActivityFirestore({
      userId: user.uid,
      userEmail: user.email || '',
      userName: userRecord?.displayName || 'User',
      userRole: role,
      action: 'SEND_EMAIL_VERIFICATION',
      details: 'Verification email sent'
    });
  };

  const updateProfileDetails = async (displayName: string, photoURL?: string) => {
    if (!user) throw new Error('No user logged in');
    await updateProfile(user, { displayName, photoURL });
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    await setDoc(userDocRef, { displayName, photoURL }, { merge: true });
    setUserRecord(prev => prev ? { ...prev, displayName, photoURL } : null);
    await logActivityFirestore({
      userId: user.uid,
      userEmail: user.email || '',
      userName: displayName,
      userRole: role,
      action: 'UPDATE_PROFILE',
      details: 'Profile details updated'
    });
  };

  const switchRole = (newRole: UserRole) => {
    if (!isDemoAllowed()) {
      logger.warn('Role switching is strictly disabled in production mode', 'AuthContext');
      return;
    }
    setRole(newRole);
    if (userRecord) {
      setUserRecord({ ...userRecord, role: newRole });
    }
    logger.audit(`User role switched to: ${newRole}`, 'AuthContext');
  };

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    logger.info(`Language updated to: ${lang}`, 'AuthContext');
  };

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const permissions = ROLE_PERMISSIONS[role];
  const t = translations[language];

  return (
    <AuthContext.Provider
      value={{
        user,
        userRecord,
        role,
        language,
        dir,
        themeMode,
        permissions,
        t,
        loading,
        rememberMe,
        setRememberMe,
        sessionStartTime,
        lastActivityTime,
        loginWithEmail,
        loginWithGoogle,
        quickDemoLogin,
        logout,
        sendPasswordReset,
        changePassword,
        sendVerificationEmail,
        updateProfileDetails,
        switchRole,
        setLanguage,
        toggleTheme,
        refreshUserRecord
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
