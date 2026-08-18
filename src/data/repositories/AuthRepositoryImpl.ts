import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../lib/firebase';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { UserProfile, UserRole } from '../../domain/entities/user';

export class AuthRepositoryImpl implements IAuthRepository {
  async getCurrentUser(): Promise<UserProfile | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      const isDemoAllowed = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE === 'development';
      if (isDemoAllowed) {
        const cached = localStorage.getItem('erp_active_user');
        if (cached) {
          try {
            return JSON.parse(cached) as UserProfile;
          } catch {
            // ignore
          }
        }
      }
      return null;
    }

    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const newUser: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || 'user@restaurant.com',
      displayName: firebaseUser.displayName || 'Restaurant Staff',
      role: 'cashier',
      createdAt: new Date().toISOString()
    };

    await setDoc(userRef, newUser);
    localStorage.setItem('erp_active_user', JSON.stringify(newUser));
    return newUser;
  }

  async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const u = result.user;

    const userRef = doc(db, COLLECTIONS.USERS, u.uid);
    const snap = await getDoc(userRef);

    let profile: UserProfile;
    if (snap.exists()) {
      profile = snap.data() as UserProfile;
    } else {
      profile = {
        uid: u.uid,
        email: u.email || 'cashier@restaurant.com',
        displayName: u.displayName || 'Restaurant Cashier',
        role: 'cashier',
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
    }

    localStorage.setItem('erp_active_user', JSON.stringify(profile));
    return profile;
  }

  async loginWithDemoRole(role: UserRole): Promise<UserProfile> {
    const isDemoAllowed = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE === 'development';
    if (!isDemoAllowed) {
      throw new Error('Demo login is strictly disabled in production mode.');
    }

    const roleNames: Record<UserRole, string> = {
      admin: 'Executive Admin',
      manager: 'Restaurant Branch Manager',
      cashier: 'POS Senior Cashier',
      chef: 'Head Chef (Kitchen)',
      driver: 'Delivery Dispatch Driver',
      accountant: 'Senior Accountant (CPA)'
    };

    const demoProfile: UserProfile = {
      uid: `demo_${role}_user`,
      email: `${role}@restaurant-erp.com`,
      displayName: roleNames[role],
      role,
      createdAt: new Date().toISOString()
    };

    try {
      const userRef = doc(db, COLLECTIONS.USERS, demoProfile.uid);
      await setDoc(userRef, demoProfile, { merge: true });
    } catch {
      // Offline or permission fallback
    }

    localStorage.setItem('erp_active_user', JSON.stringify(demoProfile));
    return demoProfile;
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem('erp_active_user');
  }

  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(userRef, { role });
    const cached = localStorage.getItem('erp_active_user');
    if (cached) {
      const parsed = JSON.parse(cached) as UserProfile;
      if (parsed.uid === uid) {
        parsed.role = role;
        localStorage.setItem('erp_active_user', JSON.stringify(parsed));
      }
    }
  }
}
