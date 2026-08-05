import { SupportedLanguage } from '../constants';

export interface TranslationDictionary {
  appName: string;
  appDescription: string;
  language: string;
  roles: {
    Owner: string;
    Admin: string;
    Manager: string;
    Accountant: string;
    Cashier: string;
    Kitchen: string;
    Waiter: string;
    DeliveryDriver: string;
  };
  navigation: {
    dashboard: string;
    products: string;
    adminPanel: string;
    pos: string;
    orders: string;
    kitchen: string;
    inventory: string;
    financials: string;
    staff: string;
    reports: string;
    aiAdvisor: string;
    aiOperations: string;
    aiCEO: string;
    settings: string;
    users: string;
    customers: string;
    profile: string;
    roleMatrix: string;
    branches?: string;
    recipeEngine?: string;
    delivery?: string;
  };
  status: {
    active: string;
    pending: string;
    completed: string;
    cancelled: string;
    preparing: string;
    ready: string;
    inTransit: string;
    lowStock: string;
    outOfStock: string;
    suspended: string;
  };
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    filter: string;
    exportPdf: string;
    exportExcel: string;
    refresh: string;
    switchRole: string;
    logout: string;
    login: string;
  };
  messages: {
    accessDenied: string;
    accessDeniedDesc: string;
    loading: string;
    syncSuccess: string;
    syncError: string;
  };
  auth: {
    welcomeBack: string;
    signInToAccount: string;
    emailAddress: string;
    password: string;
    rememberMe: string;
    forgotPassword: string;
    signInButton: string;
    signInWithGoogle: string;
    quickPresetLogin: string;
    quickPresetDesc: string;
    resetPasswordTitle: string;
    resetPasswordDesc: string;
    sendResetLink: string;
    resetEmailSent: string;
    invalidCredentials: string;
    logoutConfirm: string;
    sessionActive: string;
  };
  profile: {
    title: string;
    subtitle: string;
    personalDetails: string;
    displayName: string;
    email: string;
    role: string;
    branch: string;
    emailVerification: string;
    emailVerified: string;
    emailNotVerified: string;
    sendVerificationLink: string;
    verificationSent: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    updatePasswordBtn: string;
    passwordUpdated: string;
    passwordMismatch: string;
    updateProfileBtn: string;
    profileUpdated: string;
    recentActivity: string;
  };
  userManagement: {
    title: string;
    subtitle: string;
    addUser: string;
    editUser: string;
    userName: string;
    userEmail: string;
    assignedRole: string;
    branchOffice: string;
    accountStatus: string;
    lastLogin: string;
    actions: string;
    statusActive: string;
    statusSuspended: string;
    statusPending: string;
    triggerResetEmail: string;
    resetEmailTriggered: string;
    userCreated: string;
    userUpdated: string;
    searchUsers: string;
  };
  rolePermissions: {
    title: string;
    subtitle: string;
    capability: string;
    adminPanel: string;
    posTerminal: string;
    kitchenDisplay: string;
    rawInventory: string;
    financialLedger: string;
    staffManagement: string;
    auditReports: string;
    aiFinancialAdvisor: string;
    manageBranchSettings: string;
    manageUserAccounts: string;
  };
  activityLogs: {
    title: string;
    user: string;
    role: string;
    action: string;
    details: string;
    timestamp: string;
    noLogs: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'Commercial Restaurant ERP',
    appDescription: 'Enterprise Multi-Branch Restaurant ERP & AI Decision System',
    language: 'Language',
    roles: {
      Owner: 'Owner',
      Admin: 'Admin',
      Manager: 'Manager',
      Accountant: 'Accountant',
      Cashier: 'Cashier',
      Kitchen: 'Kitchen Staff',
      Waiter: 'Waiter',
      DeliveryDriver: 'Delivery Driver'
    },
    navigation: {
      dashboard: 'Executive Dashboard',
      products: 'Products & Menu',
      adminPanel: 'Admin Control Panel',
      pos: 'POS Terminal',
      orders: 'Order Pipeline',
      kitchen: 'Kitchen Display (KDS)',
      inventory: 'Raw Stock Inventory',
      financials: 'Financial Ledger & Expenses',
      staff: 'Staff & Suppliers',
      reports: 'Audit Reports & Export',
      aiAdvisor: 'AI Financial Advisor',
      aiOperations: 'AI Operations Manager',
      aiCEO: 'AI CEO Command',
      settings: 'Branch Settings',
      users: 'User Management',
      customers: 'CRM & Loyalty System',
      profile: 'User Profile & Security',
      roleMatrix: 'Role Permissions Matrix',
      branches: 'Multi-Branch HQ',
      recipeEngine: 'Recipe & Food Costing',
      delivery: 'Delivery & Logistics'
    },
    status: {
      active: 'Active',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      preparing: 'Preparing in Kitchen',
      ready: 'Ready for Pickup',
      inTransit: 'On Delivery',
      lowStock: 'Low Stock Alert',
      outOfStock: 'Out of Stock',
      suspended: 'Suspended'
    },
    actions: {
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit Item',
      create: 'Add New Record',
      search: 'Search records...',
      filter: 'Filter',
      exportPdf: 'Export PDF Audit',
      exportExcel: 'Export Excel Master',
      refresh: 'Sync Firebase',
      switchRole: 'Switch Role View',
      logout: 'Sign Out',
      login: 'Sign In'
    },
    messages: {
      accessDenied: 'Access Restricted',
      accessDeniedDesc: 'Your current role does not have administrative permission to view this module.',
      loading: 'Synchronizing enterprise live database...',
      syncSuccess: 'Firestore synchronization complete!',
      syncError: 'Database sync error encountered.'
    },
    auth: {
      welcomeBack: 'Welcome Back',
      signInToAccount: 'Sign in to access your ERP portal',
      emailAddress: 'Email Address',
      password: 'Password',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password?',
      signInButton: 'Sign In to ERP Portal',
      signInWithGoogle: 'Sign In with Google',
      quickPresetLogin: 'Phase 2 Test Preset Logins',
      quickPresetDesc: 'Select an authorized role account to immediately test RBAC access:',
      resetPasswordTitle: 'Reset Your Password',
      resetPasswordDesc: 'Enter your account email to receive a password reset link:',
      sendResetLink: 'Send Password Reset Link',
      resetEmailSent: 'Password reset link sent! Check your email inbox.',
      invalidCredentials: 'Invalid email or password. Please try again.',
      logoutConfirm: 'Are you sure you want to sign out?',
      sessionActive: 'Active Session'
    },
    profile: {
      title: 'User Profile & Security',
      subtitle: 'Manage your credentials, active session, and security preferences',
      personalDetails: 'Personal Profile Information',
      displayName: 'Display Name',
      email: 'Email Address',
      role: 'Assigned Role',
      branch: 'Primary Branch',
      emailVerification: 'Email Verification Status',
      emailVerified: 'Email Verified',
      emailNotVerified: 'Email Not Verified',
      sendVerificationLink: 'Send Verification Email',
      verificationSent: 'Verification link sent to your email!',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      updatePasswordBtn: 'Update Password',
      passwordUpdated: 'Password changed successfully!',
      passwordMismatch: 'New password and confirmation do not match.',
      updateProfileBtn: 'Save Profile Updates',
      profileUpdated: 'Profile updated successfully!',
      recentActivity: 'Your Recent Activity Logs'
    },
    userManagement: {
      title: 'User Management & Role Assignment',
      subtitle: 'Manage system users, roles, account statuses, and credentials',
      addUser: 'Provision New User',
      editUser: 'Edit User Role & Status',
      userName: 'Full Name',
      userEmail: 'Email Address',
      assignedRole: 'Assigned Role',
      branchOffice: 'Branch Office',
      accountStatus: 'Account Status',
      lastLogin: 'Last Active',
      actions: 'Actions',
      statusActive: 'Active',
      statusSuspended: 'Suspended',
      statusPending: 'Pending',
      triggerResetEmail: 'Trigger Password Reset',
      resetEmailTriggered: 'Reset link triggered successfully!',
      userCreated: 'New user provisioned successfully!',
      userUpdated: 'User profile updated!',
      searchUsers: 'Search users by name or email...'
    },
    rolePermissions: {
      title: 'Role Permissions Matrix',
      subtitle: 'Comprehensive Attribute-Based Access Control (ABAC) capabilities across all 8 roles',
      capability: 'Capability / System Access',
      adminPanel: 'Executive Admin Panel',
      posTerminal: 'POS Terminal Access',
      kitchenDisplay: 'Kitchen Display System (KDS)',
      rawInventory: 'Raw Inventory Management',
      financialLedger: 'Financial Ledger & Expenses',
      staffManagement: 'Staff & Suppliers Management',
      auditReports: 'Audit Reports & Exports',
      aiFinancialAdvisor: 'AI Financial Advisor & CEO Command',
      manageBranchSettings: 'Manage Branch Settings',
      manageUserAccounts: 'Manage User Accounts & Roles'
    },
    activityLogs: {
      title: 'Audit & Activity Logs',
      user: 'User',
      role: 'Role',
      action: 'Action',
      details: 'Details',
      timestamp: 'Timestamp',
      noLogs: 'No activity logs recorded yet.'
    }
  },
  ar: {
    appName: 'نظام إدارة المطاعم الشامل ERP',
    appDescription: 'نظام تخطيط موارد المطاعم متعدد الفروع والذكاء الاصطناعي',
    language: 'اللغة',
    roles: {
      Owner: 'المالك',
      Admin: 'مدير النظام',
      Manager: 'مدير الفرع',
      Accountant: 'المحاسب',
      Cashier: 'أمين الصندوق',
      Kitchen: 'طاقم المطبخ',
      Waiter: 'النادل',
      DeliveryDriver: 'سائق التوصيل'
    },
    navigation: {
      dashboard: 'لوحة التحكم التنفيذية',
      products: 'إدارة المنتجات وقائمة الطعام',
      adminPanel: 'لوحة الإدارة العليا',
      pos: 'نقطة البيع (POS)',
      orders: 'متابعة الطلبات',
      kitchen: 'شاشة المطبخ (KDS)',
      inventory: 'إدارة المخزون والمواد الخام',
      financials: 'السجل المالي والمصروفات',
      staff: 'الموظفون والموردون',
      reports: 'التقارير والتصدير',
      aiAdvisor: 'المستشار المالي الذكي',
      aiOperations: 'مدير العمليات الذكي',
      aiCEO: 'الرئيس التنفيذي الذكي',
      settings: 'إعدادات الفرع',
      users: 'إدارة المستخدمين',
      customers: 'إدارة العملاء والولاء (CRM)',
      profile: 'الملف الشخصي والأمان',
      roleMatrix: 'مصفوفة صلاحيات الأدوار',
      branches: 'إدارة الفروع المتعددة',
      recipeEngine: 'الوصفات وتكلفة الأطعمة',
      delivery: 'التوصيل واللوجستيات'
    },
    status: {
      active: 'نشط',
      pending: 'قيد الانتظار',
      completed: 'مكتمل',
      cancelled: 'ملغى',
      preparing: 'جاري التحضير بالمطبخ',
      ready: 'جاهز للتسليم',
      inTransit: 'جاري التوصيل',
      lowStock: 'تنبيه مخزون منخفض',
      outOfStock: 'نفد من المخزون',
      suspended: 'معلق'
    },
    actions: {
      save: 'حفظ التغييرات',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إضافة سجل جديد',
      search: 'البحث في السجلات...',
      filter: 'تصفية',
      exportPdf: 'تصدير تقرير PDF',
      exportExcel: 'تصدير ملف Excel',
      refresh: 'تحديث البيانات',
      switchRole: 'تبديل الدور الحسابي',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول'
    },
    messages: {
      accessDenied: 'الوصول محظور',
      accessDeniedDesc: 'الدور الحسابي الحالي لا يملك الصلاحية للوصول إلى هذه الشاشة.',
      loading: 'جاري مزامنة قاعدة البيانات التفاعلية...',
      syncSuccess: 'تمت المزامنة بنجاح!',
      syncError: 'حدث خطأ أثناء مزامنة البيانات.'
    },
    auth: {
      welcomeBack: 'مرحباً بك مجدداً',
      signInToAccount: 'سجل الدخول للوصول إلى نظام إدارة المطعم',
      emailAddress: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      rememberMe: 'تذكرني',
      forgotPassword: 'نسيت كلمة المرور؟',
      signInButton: 'تسجيل الدخول للنظام',
      signInWithGoogle: 'تسجيل الدخول عبر Google',
      quickPresetLogin: 'تسجيل الدخول السريع لاختبار المرحلة الثانية',
      quickPresetDesc: 'اختر حساباً معتمداً للتحقق من الصلاحيات فوراً:',
      resetPasswordTitle: 'إعادة تعيين كلمة المرور',
      resetPasswordDesc: 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين:',
      sendResetLink: 'إرسال رابط إعادة التعيين',
      resetEmailSent: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني!',
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      logoutConfirm: 'هل أنت تأكد من رغبتك في تسجيل الخروج؟',
      sessionActive: 'جلسة نشطة'
    },
    profile: {
      title: 'الملف الشخصي والأمان',
      subtitle: 'إدارة بياناتك الشخصية والجلسة النشطة وإعدادات الحماية',
      personalDetails: 'البيانات الشخصية',
      displayName: 'الاسم الظاهر',
      email: 'البريد الإلكتروني',
      role: 'الدور المخصص',
      branch: 'الفرع الرئيسي',
      emailVerification: 'حالة تأكيد البريد الإلكتروني',
      emailVerified: 'البريد مؤكد',
      emailNotVerified: 'البريد غير مؤكد',
      sendVerificationLink: 'إرسال رابط التأكيد',
      verificationSent: 'تم إرسال رابط التأكيد لبريدك الإلكتروني!',
      changePassword: 'تغيير كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
      updatePasswordBtn: 'تحديث كلمة المرور',
      passwordUpdated: 'تم تغيير كلمة المرور بنجاح!',
      passwordMismatch: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.',
      updateProfileBtn: 'حفظ التغييرات',
      profileUpdated: 'تم تحديث البيانات الشخصية بنجاح!',
      recentActivity: 'سجل نشاطاتك الأخيرة'
    },
    userManagement: {
      title: 'إدارة المستخدمين والأدوار',
      subtitle: 'إدارة حسابات النظام وتعيين الصلاحيات وإعادة ضبط الحسابات',
      addUser: 'إضافة مستخدم جديد',
      editUser: 'تعديل دور وحالة المستخدم',
      userName: 'الاسم الكامل',
      userEmail: 'البريد الإلكتروني',
      assignedRole: 'الدور المخصص',
      branchOffice: 'الفرع',
      accountStatus: 'حالة الحساب',
      lastLogin: 'آخر ظهور',
      actions: 'الإجراءات',
      statusActive: 'نشط',
      statusSuspended: 'معلق',
      statusPending: 'قيد الانتظار',
      triggerResetEmail: 'إرسال رابط إعادة كلمة المرور',
      resetEmailTriggered: 'تم إرسال رابط إعادة التعيين بنجاح!',
      userCreated: 'تم إضافة المستخدم بنجاح!',
      userUpdated: 'تم تحديث حساب المستخدم!',
      searchUsers: 'البحث عن مستخدمين بالاسم أو البريد...'
    },
    rolePermissions: {
      title: 'مصفوفة صلاحيات الأدوار',
      subtitle: 'جدول الصلاحيات الكامل لكافة الأدوار الثمانية في النظام',
      capability: 'الوظيفة / الصلاحية',
      adminPanel: 'لوحة الإدارة العليا',
      posTerminal: 'شاشة نقطة البيع (POS)',
      kitchenDisplay: 'شاشة المطبخ (KDS)',
      rawInventory: 'إدارة المخزون والمواد الخام',
      financialLedger: 'السجل المالي والمصروفات',
      staffManagement: 'إدارة الموظفين والموردين',
      auditReports: 'التقارير المالية وتصدير البيانات',
      aiFinancialAdvisor: 'المستشار المالي وقائد AI CEO',
      manageBranchSettings: 'إدارة إعدادات الفرع',
      manageUserAccounts: 'إدارة حسابات المستخدمين والأدوار'
    },
    activityLogs: {
      title: 'سجل النشاطات والمراجعة',
      user: 'المستخدم',
      role: 'الدور',
      action: 'الإجراء',
      details: 'التفاصيل',
      timestamp: 'الوقت والتاريخ',
      noLogs: 'لا توجد سجلات نشاط مسجلة حتى الآن.'
    }
  },
  so: {
    appName: 'Nidaamka ERP Maqaayadaha',
    appDescription: 'Maamulka Maqaayadaha Qeybaha Badan & Caawiyaha Garaadka Artificial-ka',
    language: 'Luuqadda',
    roles: {
      Owner: 'Mulkiilaha',
      Admin: 'Maamulaha Guud',
      Manager: 'Maamulaha Faraca',
      Accountant: 'Xisaabiyaha',
      Cashier: 'Kaashiyaha',
      Kitchen: 'Shaqaalaha Jikada',
      Waiter: 'Adeegaha (Waiter)',
      DeliveryDriver: 'Wadaha Gaadhiga'
    },
    navigation: {
      dashboard: 'Bogga Muhiimka Ah',
      products: 'Cuntada & Menu-ga',
      adminPanel: 'Xarunta Maamulka',
      pos: 'Kombuyuutarka Bixinta (POS)',
      orders: 'Dalabaadka',
      kitchen: 'Shaashada Jikada (KDS)',
      inventory: 'Moofada & Alaabta Raw-ga',
      financials: 'Xisaabaadka & Kharashyada',
      staff: 'Shaqaalaha & Alaab-bixiyeyaasha',
      reports: 'Warbixinada & Export-ka',
      aiAdvisor: 'Garaadka Xisaabaadka (AI)',
      aiOperations: 'Garaadka Hawlaha (AI)',
      aiCEO: 'Madaxa AI CEO',
      settings: 'Dhabarka Nidaamka',
      users: 'Maamulka Isticmaalayaasha',
      customers: 'Macaamiisha & Loyalty (CRM)',
      profile: 'Xogtaada & Amniga',
      roleMatrix: 'Shaxda Ogolaanshaha Rooshinka',
      branches: 'Maamulka Laamaha (Branches)',
      recipeEngine: 'Karinta & Cost-ka Cuntada',
      delivery: 'Gaarsiinta & Saadka (Delivery)'
    },
    status: {
      active: 'Aktiv',
      pending: 'Pratsiin',
      completed: 'Dhameystiran',
      cancelled: 'La baajiyay',
      preparing: 'Jikada ayaa lagu diyaarinayaa',
      ready: 'Waa diyaar',
      inTransit: 'Waddo ayaa lagu jiraa',
      lowStock: 'Digiino Alaab Guranasa',
      outOfStock: 'Waa Dhamaatay',
      suspended: 'La Hakiyay'
    },
    actions: {
      save: 'Keydi',
      cancel: 'Kansal',
      delete: 'Tirtir',
      edit: 'Wax ka beddel',
      create: 'Kudar Mp',
      search: 'Raadi...',
      filter: 'Kala Saar',
      exportPdf: 'Shub PDF',
      exportExcel: 'Shub Excel',
      refresh: 'Cusbooneysii Firebase',
      switchRole: 'Baddal Roll-ka',
      logout: 'Ka bax',
      login: 'Geli'
    },
    messages: {
      accessDenied: 'Ogolaansho Ma Hexistid',
      accessDeniedDesc: 'Roll-kaaga hadda ma laha awood uu ku galo qaybtan.',
      loading: 'Loodinta xogta Firebase...',
      syncSuccess: 'Waa la cusbooneysiiyay!',
      syncError: 'Kutalagal ma jirin xilliga loodinta.'
    },
    auth: {
      welcomeBack: 'Kuso dhowaaw markale',
      signInToAccount: 'Geli xogtaada si aad u gashid nidaamka ERP',
      emailAddress: 'Email-ka',
      password: 'Password-ka',
      rememberMe: 'I xasuuso',
      forgotPassword: 'Ma harowday Password-ka?',
      signInButton: 'Geli Nidaamka ERP',
      signInWithGoogle: 'Ku geli Google',
      quickPresetLogin: 'Xisaabaadka Tijaabada Phase 2',
      quickPresetDesc: 'Dooray roll kasta si aad u tijaabiso ogolaanshaha si degdeg ah:',
      resetPasswordTitle: 'Cusbooneysii Password-ka',
      resetPasswordDesc: 'Geli email-kaaga si aan kuugu soo dirno link-ga cusbooneysiinta:',
      sendResetLink: 'Soo dir Link-ga Reset-ka',
      resetEmailSent: 'Link-ga reset-ka waa loo soo diray email-kaaga!',
      invalidCredentials: 'Email ama Password ma habboona. Fadlan dib u tijaabi.',
      logoutConfirm: 'Ma ziid dooneysaa inaad ka baxdo nidaamka?',
      sessionActive: 'Session-ka Aktiv-ka ah'
    },
    profile: {
      title: 'Xogta Isticmaalaha & Amniga',
      subtitle: 'Maamul xogtaada, session-kaaga aktiv-ka ah iyo habaynta amniga',
      personalDetails: 'Xogta Shaqsiga ah',
      displayName: 'Magaca',
      email: 'Email-ka',
      role: 'Roll-ka aad leedahay',
      branch: 'Faraca Koowaad',
      emailVerification: 'Xaaladda Email Verification-ka',
      emailVerified: 'Email-ka Waa La Xaqiijiyay',
      emailNotVerified: 'Email-ka Ma La Xaqiijin',
      sendVerificationLink: 'Soo dir Email Verification',
      verificationSent: 'Link-ga verification-ka waa loo soo diray email-kaaga!',
      changePassword: 'Baddal Password-ka',
      currentPassword: 'Password-ka Hadda',
      newPassword: 'Password-ka Cusub',
      confirmNewPassword: 'Xaqiiji Password-ka Cusub',
      updatePasswordBtn: 'Baddal Password-ka',
      passwordUpdated: 'Password-kii waa la baddalay!',
      passwordMismatch: 'Password-ka cusub iyo xaqiijintiisa way kala duwan yihiin.',
      updateProfileBtn: 'Keydi Xogta',
      profileUpdated: 'Xogtaada waa la cusbooneysiiyay!',
      recentActivity: 'Dhaqdhaqaaqii Ugu Dambeeyay'
    },
    userManagement: {
      title: 'Maamulka Isticmaalayaasha & Rooshinka',
      subtitle: 'Maamul dadka nidaamka adeegsada, rooshinkooda iyo status-kooda',
      addUser: 'Kudar Isticmaale Cusub',
      editUser: 'Beddel Roll-ka & Status-ka',
      userName: 'Magaca Buuxa',
      userEmail: 'Email-ka',
      assignedRole: 'Roll-ka',
      branchOffice: 'Faraca',
      accountStatus: 'Status-ka Account-ka',
      lastLogin: 'Aktiv-nimadii Ugu Dambaysay',
      actions: 'Tallaabooyinka',
      statusActive: 'Aktiv',
      statusSuspended: 'La Hakiyay',
      statusPending: 'Pratsiin',
      triggerResetEmail: 'Soo dir Password Reset',
      resetEmailTriggered: 'Link-ga Reset-ka waa la diray!',
      userCreated: 'Isticmaalaha cusub waa la kaddiyay!',
      userUpdated: 'Xogta isticmaalaha waa la cusbooneysiiyay!',
      searchUsers: 'Raadi isticmaale magac ama email...'
    },
    rolePermissions: {
      title: 'Shaxda Ogolaanshaha Rooshinka',
      subtitle: 'Dhammaan awoodaha 8-da rooshin ee nidaamka ERP',
      capability: 'Awoodda Nidaamka',
      adminPanel: 'Xarunta Maamulka Guud',
      posTerminal: 'Kombuyuutarka Bixinta (POS)',
      kitchenDisplay: 'Shaashada Jikada (KDS)',
      rawInventory: 'Moofada & Inventory-ga Raw-ga',
      financialLedger: 'Xisaabaadka & Kharashyada',
      staffManagement: 'Maamulka Shaqaalaha & Suppliers',
      auditReports: 'Warbixinada Xisaabaadka & Export-ka',
      aiFinancialAdvisor: 'Garaadka Xisaabaadka & AI CEO',
      manageBranchSettings: 'Maamul Habaynta Faraca',
      manageUserAccounts: 'Maamul Isticmaalayaasha & Rooshinka'
    },
    activityLogs: {
      title: 'Log-yada Dhaqdhaqaaqa',
      user: 'Isticmaalaha',
      role: 'Roll-ka',
      action: 'Tallaabada',
      details: 'Faahfaahinta',
      timestamp: 'Waqtiga',
      noLogs: 'Weli ma jiraan log-yo dhaqdhaqaaq.'
    }
  }
};
