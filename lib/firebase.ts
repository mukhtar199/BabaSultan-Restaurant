import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Order,
  OrderStatus,
  Product,
  Category,
  ProductOption,
  ProductOptionChoice,
  RecipeIngredient,
  Ingredient,
  Expense,
  Purchase,
  Employee,
  SalaryPayment,
  Supplier,
  InventoryMovement,
  CustomerRefund,
  BankTransaction,
  FinancialAccount,
  UserRecord,
  ActivityLog,
  Customer,
  DiningTable,
  Payment,
  HoldOrder
} from '../types';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore using named database ID from firebase-applet-config.json if provided
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);

// Collection References
export const COLLECTIONS = {
  USERS: 'users',
  ACTIVITY_LOGS: 'activity_logs',
  ORDERS: 'orders',
  PRODUCTS: 'products',
  INGREDIENTS: 'ingredients',
  EXPENSES: 'expenses',
  PURCHASES: 'purchases',
  EMPLOYEES: 'employees',
  SALARIES: 'salaries',
  SUPPLIERS: 'suppliers',
  MOVEMENTS: 'inventory_movements',
  INVENTORY_MOVEMENTS: 'inventory_movements',
  REFUNDS: 'refunds',
  BANK_TRANSACTIONS: 'bank_transactions',
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  BRANCHES: 'branches',
  REVENUES: 'revenues',
  AI_SETTINGS: 'ai_settings',
  PERMISSIONS: 'permissions',

  // Operations Manager Collections
  DELIVERY_DRIVERS: 'delivery_drivers',
  STATIONS: 'kitchen_stations',
  ATTENDANCE: 'employee_attendance',
  RESERVATIONS: 'reservations',
  FEEDBACKS: 'customer_feedbacks',
  EQUIPMENT: 'equipment_items',

  // Phase 5 Collections
  PAYMENTS: 'payments',
  TABLES: 'dining_tables',
  HOLD_ORDERS: 'hold_orders',

  // Phase 6 Collections
  KITCHEN_ORDERS: 'kitchen_orders',
  KITCHEN_WASTE: 'kitchen_waste',

  // Phase 7 Collections
  INVENTORY: 'inventory',
  PURCHASE_ORDERS: 'purchase_orders',
  PURCHASE_ITEMS: 'purchase_items',
  SUPPLIER_PAYMENTS: 'supplier_payments',

  // Phase 8 CRM Collections
  CUSTOMER_WALLETS: 'customer_wallets',
  WALLET_TRANSACTIONS: 'wallet_transactions',
  CUSTOMER_POINTS: 'customer_points',
  CUSTOMER_REWARDS: 'customer_rewards',
  CUSTOMER_COUPONS: 'customer_coupons',
  CUSTOMER_NOTIFICATIONS: 'customer_notifications',

  // Phase 9 HRM Collections
  HRM_EMPLOYEES: 'employees',
  HRM_ATTENDANCE: 'attendance',
  HRM_SHIFTS: 'shifts',
  HRM_PAYROLL: 'payroll',
  HRM_LEAVE_REQUESTS: 'leave_requests',
  HRM_EMPLOYEE_DOCUMENTS: 'employee_documents',
  HRM_PERFORMANCE: 'performance',
  HRM_EMPLOYEE_NOTIFICATIONS: 'employee_notifications',

  // Phase 10 Accounting Collections
  JOURNAL_ENTRIES: 'journal_entries',
  JOURNAL_LINES: 'journal_lines',
  LEDGER: 'ledger',
  CASH_REGISTERS: 'cash_registers',
  BANK_ACCOUNTS: 'bank_accounts',
  RECEIVABLES: 'receivables',
  PAYABLES: 'payables',
  TAXES: 'taxes',
  FINANCIAL_REPORTS: 'financial_reports',

  // Phase 13 Multi-Branch Collections
  BRANCH_SETTINGS: 'branch_settings',
  BRANCH_TRANSFERS: 'branch_transfers',
  BRANCH_INVENTORY: 'branch_inventory',
  BRANCH_REPORTS: 'branch_reports',
  EMPLOYEE_TRANSFERS: 'employee_transfers',
  CASH_TRANSFERS: 'cash_transfers',

  // Phase 14 Delivery Management & Logistics Collections
  DRIVERS: 'drivers',
  DELIVERIES: 'deliveries',
  DELIVERY_TRACKING: 'delivery_tracking',
  DELIVERY_ZONES: 'delivery_zones',
  DELIVERY_REPORTS: 'delivery_reports',
  DELIVERY_NOTIFICATIONS: 'delivery_notifications'
};

// Seed Realistic Restaurant Data to Firestore if collections are empty
export async function seedInitialFirestoreData() {
  const batch = writeBatch(db);

  const todayIso = new Date().toISOString();
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
  const threeDaysAgoIso = new Date(Date.now() - 86400000 * 3).toISOString();

  // 0. Categories
  const sampleCategories: Category[] = [
    {
      id: 'cat_main',
      name: 'Main Course',
      nameEn: 'Main Course',
      nameAr: 'الأطباق الرئيسية',
      nameSo: 'Cuntada Waaweyn',
      description: 'Traditional Somali, Arabic, and international hearty dishes',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      order: 1,
      isActive: true,
      productCount: 3
    },
    {
      id: 'cat_burgers',
      name: 'Burgers & Sandwiches',
      nameEn: 'Burgers & Sandwiches',
      nameAr: 'البرجر والساندويتشات',
      nameSo: 'Burgeryada & Sandwijka',
      description: 'Flame-grilled burgers and artisan wraps',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      order: 2,
      isActive: true,
      productCount: 1
    },
    {
      id: 'cat_pizza',
      name: 'Pizza & Pastas',
      nameEn: 'Pizza & Pastas',
      nameAr: 'البيتزا والمعكرونة',
      nameSo: 'Pizzada & Baastada',
      description: 'Wood-fired pizzas and homemade sauces',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      order: 3,
      isActive: true,
      productCount: 1
    },
    {
      id: 'cat_seafood',
      name: 'Seafood',
      nameEn: 'Seafood',
      nameAr: 'المأكولات البحرية',
      nameSo: 'Kalluunka & Badda',
      description: 'Fresh Indian Ocean catch grilled with spiced butter',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      order: 4,
      isActive: true,
      productCount: 1
    },
    {
      id: 'cat_drinks',
      name: 'Beverages',
      nameEn: 'Beverages',
      nameAr: 'المشروبات والعصائر',
      nameSo: 'Cabitaannada & Shaaha',
      description: 'Fresh squeezed juices, spiced tea, and espresso drinks',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      order: 5,
      isActive: true,
      productCount: 2
    },
    {
      id: 'cat_offers',
      name: 'Special Offers',
      nameEn: 'Special Offers',
      nameAr: 'العروض الخاصة',
      nameSo: 'Codyada Gaarka Ah',
      description: 'Discounted family meal deals and combo packages',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      order: 6,
      isActive: true,
      productCount: 1
    }
  ];

  sampleCategories.forEach(c => {
    batch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), c);
  });

  // 1. Products (Menu Dishes)
  const sampleProducts: Product[] = [
    {
      id: 'prod_1',
      name: 'Somali Chicken Suqaar with Canjeero',
      nameEn: 'Somali Chicken Suqaar with Canjeero',
      nameAr: 'صقار دجاج صومالي مع عنجيرو',
      nameSo: 'Suqaar Gallay ah iyo Canjeero',
      description: 'Pan-seared tender chicken cubes cooked with fresh bell peppers, onions, and traditional Xawaash spices, served with fresh warm Canjeero flatbread.',
      shortDescription: 'Sautéed chicken suqaar served with soft Canjeero',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      category: 'Main Course',
      categoryId: 'cat_main',
      price: 14.50,
      cost: 4.80,
      discountPrice: 12.99,
      tax: 0.05,
      prepTimeMinutes: 15,
      availabilityStatus: 'enabled',
      isFeatured: true,
      sku: 'SKU-SUQ-001',
      barcode: '600123456001',
      stock: 45,
      minStockAlert: 10,
      unit: 'Portion',
      salesCount: 128,
      calories: 520,
      ingredients: [
        { ingredientId: 'ing_5', ingredientName: 'Arabic Spice Blend (Xawaash)', requiredQuantity: 0.05, unit: 'kg' }
      ],
      options: [
        {
          id: 'opt_size_1',
          nameEn: 'Portion Size',
          nameAr: 'حجم الوجبة',
          nameSo: 'Cabbirka Cuntada',
          type: 'size',
          selectionType: 'single',
          isRequired: true,
          choices: [
            { id: 'c_regular', nameEn: 'Regular', nameAr: 'عادي', nameSo: 'Caadi', priceModifier: 0, isDefault: true },
            { id: 'c_large', nameEn: 'Large (Extra Chicken)', nameAr: 'كبير (دجاج إضافي)', nameSo: 'Laba Jaar', priceModifier: 3.50 }
          ]
        },
        {
          id: 'opt_addon_1',
          nameEn: 'Extra Add-ons',
          nameAr: 'إضافات ممتازة',
          nameSo: 'Ku Darsiga',
          type: 'addon',
          selectionType: 'multiple',
          isRequired: false,
          choices: [
            { id: 'c_extra_canjeero', nameEn: 'Extra Canjeero Bread (2 pcs)', nameAr: 'عنجيرو إضافي (2 قطع)', nameSo: 'Canjeero Dheeraad ah', priceModifier: 1.50 },
            { id: 'c_banana', nameEn: 'Fresh Somali Banana', nameAr: 'موز صومالي طازج', nameSo: 'Moos Fershi ah', priceModifier: 0.80 }
          ]
        }
      ]
    },
    {
      id: 'prod_2',
      name: 'Camel Meat Rice Special (Bariis Iskukaris)',
      nameEn: 'Camel Meat Rice Special (Bariis Iskukaris)',
      nameAr: 'أرز باللحم الإبل الصومالي (بريس إسكوكريس)',
      nameSo: 'Bariis Iskukaris oo Geel ah',
      description: 'Fragrant basmati rice infused with cardamom, cinnamon, raisins, and roasted potatoes, served with slow-cooked tender camel meat marinated in Xawaash.',
      shortDescription: 'Cardamom basmati rice served with slow-roasted camel meat',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      category: 'Main Course',
      categoryId: 'cat_main',
      price: 18.00,
      cost: 6.20,
      tax: 0.05,
      prepTimeMinutes: 20,
      availabilityStatus: 'enabled',
      isFeatured: true,
      sku: 'SKU-BAR-002',
      barcode: '600123456002',
      stock: 30,
      minStockAlert: 8,
      unit: 'Portion',
      salesCount: 194,
      calories: 780,
      ingredients: [
        { ingredientId: 'ing_1', ingredientName: 'Premium Basmati Rice', requiredQuantity: 0.25, unit: 'kg' },
        { ingredientId: 'ing_2', ingredientName: 'Fresh Camel Meat Cubes', requiredQuantity: 0.30, unit: 'kg' }
      ]
    },
    {
      id: 'prod_3',
      name: 'Grilled Salmon with Basmati Rice',
      nameEn: 'Grilled Salmon with Basmati Rice',
      nameAr: 'سلمون مشوي مع أرز بسمتي',
      nameSo: 'Kalluun Salmon ah iyo Bariis',
      description: 'Pan-seared Atlantic salmon fillet seasoned with lemon herb butter, served alongside aromatic Basmati rice and fresh grilled asparagus.',
      shortDescription: 'Herb butter grilled salmon served with rice',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      category: 'Seafood',
      categoryId: 'cat_seafood',
      price: 22.00,
      cost: 8.50,
      tax: 0.05,
      prepTimeMinutes: 18,
      availabilityStatus: 'enabled',
      isFeatured: false,
      sku: 'SKU-SAL-003',
      barcode: '600123456003',
      stock: 12,
      minStockAlert: 15,
      unit: 'Portion',
      salesCount: 86,
      calories: 610
    },
    {
      id: 'prod_4',
      name: 'Spiced Arabic Mandi Lamb',
      nameEn: 'Spiced Arabic Mandi Lamb',
      nameAr: 'مندي لحم ضأن عربي مع الأرز المعطر',
      nameSo: 'Mandi Ari ah oo Carabi ah',
      description: 'Traditional slow-smoked tender lamb shank served over saffron smoked Mandi rice with spicy Tomato Dakhoos dip and roasted nuts.',
      shortDescription: 'Slow smoked lamb shank with saffron Mandi rice',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      category: 'Main Course',
      categoryId: 'cat_main',
      price: 24.00,
      cost: 9.00,
      tax: 0.05,
      prepTimeMinutes: 25,
      availabilityStatus: 'enabled',
      isFeatured: true,
      sku: 'SKU-MAN-004',
      barcode: '600123456004',
      stock: 25,
      minStockAlert: 10,
      unit: 'Portion',
      salesCount: 152,
      calories: 890
    },
    {
      id: 'prod_5',
      name: 'Cardamom Somali Milk Tea (Shaah Cadde)',
      nameEn: 'Cardamom Somali Milk Tea (Shaah Cadde)',
      nameAr: 'شاي عدني/صومالي بالهيل والحليب',
      nameSo: 'Shaah Cadde oo Xawaash & Caano leh',
      description: 'Freshly brewed black tea simmered with fresh whole milk, crushed green cardamom pods, cinnamon, and cloves.',
      shortDescription: 'Traditional spiced cardamom milk tea',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      category: 'Beverages',
      categoryId: 'cat_drinks',
      price: 3.50,
      cost: 0.60,
      tax: 0.05,
      prepTimeMinutes: 5,
      availabilityStatus: 'enabled',
      isFeatured: false,
      sku: 'SKU-TEA-005',
      barcode: '600123456005',
      stock: 150,
      minStockAlert: 20,
      unit: 'Cup',
      salesCount: 340,
      calories: 140,
      ingredients: [
        { ingredientId: 'ing_4', ingredientName: 'Organic Whole Milk', requiredQuantity: 0.20, unit: 'Liters' }
      ]
    },
    {
      id: 'prod_6',
      name: 'Fresh Mango & Passion Juice',
      nameEn: 'Fresh Mango & Passion Juice',
      nameAr: 'عصير مانجو مع الفاكهة الاستوائية الطازجة',
      nameSo: 'Casiir Cambe & Passhiyo Fershi ah',
      description: '100% natural cold-pressed fresh Somali mango blended with aromatic passion fruit nectar.',
      shortDescription: 'Fresh cold-pressed mango & passionfruit juice',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      category: 'Beverages',
      categoryId: 'cat_drinks',
      price: 5.00,
      cost: 1.20,
      tax: 0.05,
      prepTimeMinutes: 5,
      availabilityStatus: 'enabled',
      isFeatured: false,
      sku: 'SKU-JUI-006',
      barcode: '600123456006',
      stock: 8,
      minStockAlert: 15,
      unit: 'Glass',
      salesCount: 210,
      calories: 180,
      ingredients: [
        { ingredientId: 'ing_3', ingredientName: 'Fresh Mango Fruit Batch', requiredQuantity: 0.25, unit: 'kg' }
      ]
    }
  ];

  sampleProducts.forEach(p => {
    batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), p);
  });

  // 2. Kitchen Raw Ingredients
  const sampleIngredients: Ingredient[] = [
    {
      id: 'ing_1',
      name: 'Premium Basmati Rice',
      stock: 120,
      unit: 'kg',
      minStockAlert: 30,
      costPerUnit: 2.10,
      supplierId: 'sup_1',
      supplierName: 'Horn of Africa Grain Co.'
    },
    {
      id: 'ing_2',
      name: 'Fresh Camel Meat Cubes',
      stock: 15, // Running Low!
      unit: 'kg',
      minStockAlert: 25,
      costPerUnit: 11.50,
      supplierId: 'sup_2',
      supplierName: 'Mogadishu Livestock & Meat Ltd.'
    },
    {
      id: 'ing_3',
      name: 'Fresh Mango Fruit Batch',
      stock: 8, // Running Low!
      unit: 'kg',
      minStockAlert: 20,
      costPerUnit: 3.20,
      supplierId: 'sup_3',
      supplierName: 'Tropical Fresh Produce'
    },
    {
      id: 'ing_4',
      name: 'Organic Whole Milk',
      stock: 40,
      unit: 'Liters',
      minStockAlert: 15,
      costPerUnit: 1.10,
      supplierId: 'sup_4',
      supplierName: 'Sunrise Dairy Farms'
    },
    {
      id: 'ing_5',
      name: 'Arabic Spice Blend (Xawaash)',
      stock: 5, // Running Low!
      unit: 'kg',
      minStockAlert: 10,
      costPerUnit: 14.00,
      supplierId: 'sup_1',
      supplierName: 'Horn of Africa Grain Co.'
    }
  ];

  sampleIngredients.forEach(i => {
    batch.set(doc(db, COLLECTIONS.INGREDIENTS, i.id), i);
  });

  // 3. Employees
  const sampleEmployees: Employee[] = [
    {
      id: 'emp_1',
      employeeId: 'EMP-1001',
      fullName: 'Ahmed Farah',
      name: 'Ahmed Farah',
      photo: '',
      nationalIdOrPassport: 'SOM-7788101',
      phone: '+252 61 555 1122',
      email: 'ahmed.farah@restaurant.com',
      address: 'Mogadishu, Hodan District',
      dateOfBirth: '1988-04-12',
      gender: 'Male',
      nationality: 'Somali',
      hireDate: '2023-01-15',
      jobTitle: 'General Operations Manager',
      department: 'General Management',
      branch: 'Main Flagship Branch',
      employmentStatus: 'Active',
      status: 'active',
      role: 'Manager',
      salary: 2200,
      totalSales: 4850,
      ordersCount: 165,
      emergencyContact: { name: 'Amina Farah', relationship: 'Spouse', phone: '+252 61 555 1133' },
      createdAt: todayIso
    },
    {
      id: 'emp_2',
      employeeId: 'EMP-1002',
      fullName: 'Fatima Omar',
      name: 'Fatima Omar',
      photo: '',
      nationalIdOrPassport: 'SOM-7788102',
      phone: '+252 61 555 2233',
      email: 'fatima.omar@restaurant.com',
      address: 'Mogadishu, Waberi District',
      dateOfBirth: '1993-08-20',
      gender: 'Female',
      nationality: 'Somali',
      hireDate: '2023-05-10',
      jobTitle: 'Head Cashier',
      department: 'Service & Dining',
      branch: 'Main Flagship Branch',
      employmentStatus: 'Active',
      status: 'active',
      role: 'Cashier',
      salary: 1400,
      totalSales: 6120,
      ordersCount: 240,
      emergencyContact: { name: 'Omar Ali', relationship: 'Parent', phone: '+252 61 555 2244' },
      createdAt: todayIso
    },
    {
      id: 'emp_3',
      employeeId: 'EMP-1003',
      fullName: 'Youssef Hassan',
      name: 'Youssef Hassan',
      photo: '',
      nationalIdOrPassport: 'SOM-7788103',
      phone: '+252 61 555 3344',
      email: 'youssef.hassan@restaurant.com',
      address: 'Mogadishu, Hamar Weyne District',
      dateOfBirth: '1985-11-05',
      gender: 'Male',
      nationality: 'Somali',
      hireDate: '2022-11-01',
      jobTitle: 'Executive Head Chef',
      department: 'Kitchen & Culinary',
      branch: 'Main Flagship Branch',
      employmentStatus: 'Active',
      status: 'active',
      role: 'Chef',
      salary: 2600,
      totalSales: 0,
      ordersCount: 0,
      emergencyContact: { name: 'Hassan Youssef', relationship: 'Parent', phone: '+252 61 555 3355' },
      createdAt: todayIso
    },
    {
      id: 'emp_4',
      employeeId: 'EMP-1004',
      fullName: 'Bilal Jama',
      name: 'Bilal Jama',
      photo: '',
      nationalIdOrPassport: 'SOM-7788104',
      phone: '+252 61 555 4455',
      email: 'bilal.jama@restaurant.com',
      address: 'Mogadishu, Yaqshid District',
      dateOfBirth: '1997-02-14',
      gender: 'Male',
      nationality: 'Somali',
      hireDate: '2024-02-01',
      jobTitle: 'Senior Dining Waiter',
      department: 'Service & Dining',
      branch: 'Main Flagship Branch',
      employmentStatus: 'Active',
      status: 'active',
      role: 'Waiter',
      salary: 1100,
      totalSales: 3240,
      ordersCount: 112,
      emergencyContact: { name: 'Jama Bilal', relationship: 'Sibling', phone: '+252 61 555 4466' },
      createdAt: todayIso
    }
  ];

  sampleEmployees.forEach(e => {
    batch.set(doc(db, COLLECTIONS.EMPLOYEES, e.id), e);
  });

  // 4. Suppliers
  const sampleSuppliers: Supplier[] = [
    {
      id: 'sup_1',
      name: 'Horn of Africa Grain Co.',
      contactPerson: 'Mohamed Ali',
      phone: '+252 61 555 1234',
      itemsSupplied: 'Basmati Rice, Spices, Flour',
      pendingAmount: 350,
      overdueAmount: 0
    },
    {
      id: 'sup_2',
      name: 'Mogadishu Livestock & Meat Ltd.',
      contactPerson: 'Abdi Hassan',
      phone: '+252 61 888 9900',
      itemsSupplied: 'Camel Meat, Goat Meat, Beef',
      pendingAmount: 1250,
      overdueAmount: 850 // Overdue alert!
    },
    {
      id: 'sup_3',
      name: 'Tropical Fresh Produce',
      contactPerson: 'Layla Osman',
      phone: '+252 61 333 4411',
      itemsSupplied: 'Mangoes, Passionfruit, Bananas, Vegetables',
      pendingAmount: 220,
      overdueAmount: 0
    },
    {
      id: 'sup_4',
      name: 'Sunrise Dairy Farms',
      contactPerson: 'Tariq Al-Mansoor',
      phone: '+252 61 777 2233',
      itemsSupplied: 'Fresh Milk, Butter, Cheese',
      pendingAmount: 180,
      overdueAmount: 0
    }
  ];

  sampleSuppliers.forEach(s => {
    batch.set(doc(db, COLLECTIONS.SUPPLIERS, s.id), s);
  });

  // 5. Today & Recent Orders
  const sampleOrders: Order[] = [
    {
      id: 'ord_101',
      orderNumber: 'ORD-101',
      customerName: 'Khadija Said',
      orderType: 'dine_in',
      tableNumber: 'T-01',
      items: [
        { productId: 'prod_2', productName: 'Camel Meat Rice Special (Bariis Iskukaris)', quantity: 2, unitPrice: 18.00, unitCost: 6.20, totalPrice: 36.00 },
        { productId: 'prod_5', productName: 'Cardamom Somali Milk Tea (Shaah Cadde)', quantity: 2, unitPrice: 3.50, unitCost: 0.60, totalPrice: 7.00 }
      ],
      subtotal: 41.00,
      tax: 2.00,
      discountAmount: 0,
      totalAmount: 43.00,
      cogs: 13.60,
      profit: 29.40,
      employeeId: 'emp_2',
      employeeName: 'Fatima Omar',
      status: 'completed',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      createdAt: todayIso
    },
    {
      id: 'ord_102',
      orderNumber: 'ORD-102',
      customerName: 'Ibrahim Khalid',
      orderType: 'dine_in',
      tableNumber: 'T-02',
      items: [
        { productId: 'prod_4', productName: 'Spiced Arabic Mandi Lamb', quantity: 3, unitPrice: 24.00, unitCost: 9.00, totalPrice: 72.00 },
        { productId: 'prod_6', productName: 'Fresh Mango & Passion Juice', quantity: 3, unitPrice: 5.00, unitCost: 1.20, totalPrice: 15.00 }
      ],
      subtotal: 83.00,
      tax: 4.00,
      discountAmount: 0,
      totalAmount: 87.00,
      cogs: 30.60,
      profit: 56.40,
      employeeId: 'emp_1',
      employeeName: 'Ahmed Farah',
      status: 'completed',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: todayIso
    },
    {
      id: 'ord_103',
      orderNumber: 'ORD-103',
      customerName: 'Nasra Hussein',
      orderType: 'takeaway',
      items: [
        { productId: 'prod_1', productName: 'Somali Chicken Suqaar with Canjeero', quantity: 4, unitPrice: 14.50, unitCost: 4.80, totalPrice: 58.00 },
        { productId: 'prod_5', productName: 'Cardamom Somali Milk Tea (Shaah Cadde)', quantity: 4, unitPrice: 3.50, unitCost: 0.60, totalPrice: 14.00 }
      ],
      subtotal: 68.50,
      tax: 3.50,
      discountAmount: 0,
      totalAmount: 72.00,
      cogs: 21.60,
      profit: 50.40,
      employeeId: 'emp_2',
      employeeName: 'Fatima Omar',
      status: 'completed',
      paymentMethod: 'mobile_money',
      paymentStatus: 'paid',
      createdAt: todayIso
    },
    {
      id: 'ord_104',
      orderNumber: 'ORD-104',
      customerName: 'Mahad Roble',
      orderType: 'delivery',
      items: [
        { productId: 'prod_3', productName: 'Grilled Salmon with Basmati Rice', quantity: 2, unitPrice: 22.00, unitCost: 8.50, totalPrice: 44.00 }
      ],
      subtotal: 42.00,
      tax: 2.00,
      discountAmount: 0,
      totalAmount: 44.00,
      cogs: 17.00,
      profit: 27.00,
      employeeId: 'emp_1',
      employeeName: 'Ahmed Farah',
      status: 'in_preparation',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      createdAt: todayIso
    }
  ];

  sampleOrders.forEach(o => {
    batch.set(doc(db, COLLECTIONS.ORDERS, o.id), o);
  });

  // 6. Expenses
  const sampleExpenses: Expense[] = [
    {
      id: 'exp_1',
      title: 'Generator Fuel & Electricity Bill',
      amount: 120.00,
      category: 'utilities',
      description: 'Daily generator diesel and city grid electricity',
      createdBy: 'Ahmed Farah',
      createdAt: todayIso
    },
    {
      id: 'exp_2',
      title: 'Kitchen Cleaning & Sanitation Supplies',
      amount: 45.00,
      category: 'supplies',
      description: 'Detergent, paper towels, sanitizer',
      createdBy: 'Youssef Hassan',
      createdAt: todayIso
    },
    {
      id: 'exp_3',
      title: 'Emergency Plumbing Repair (Abnormal)',
      amount: 380.00, // Spike abnormal expense!
      category: 'maintenance',
      description: 'Kitchen drainage pipe burst repair emergency service',
      createdBy: 'Ahmed Farah',
      createdAt: yesterdayIso
    }
  ];

  sampleExpenses.forEach(ex => {
    batch.set(doc(db, COLLECTIONS.EXPENSES, ex.id), ex);
  });

  // 7. Purchases
  const samplePurchases: Purchase[] = [
    {
      id: 'pur_1',
      supplierId: 'sup_2',
      supplierName: 'Mogadishu Livestock & Meat Ltd.',
      itemName: 'Camel Meat & Lamb Carcasses',
      quantity: 50,
      unit: 'kg',
      unitPrice: 11.50,
      totalCost: 575.00,
      status: 'overdue',
      dueDate: threeDaysAgoIso.split('T')[0],
      createdAt: threeDaysAgoIso
    },
    {
      id: 'pur_2',
      supplierId: 'sup_1',
      supplierName: 'Horn of Africa Grain Co.',
      itemName: 'Basmati Rice 50kg Bags x 3',
      quantity: 150,
      unit: 'kg',
      unitPrice: 2.10,
      totalCost: 315.00,
      status: 'completed',
      dueDate: todayIso.split('T')[0],
      createdAt: yesterdayIso
    }
  ];

  samplePurchases.forEach(pu => {
    batch.set(doc(db, COLLECTIONS.PURCHASES, pu.id), pu);
  });

  // 8. Salaries
  const sampleSalaries: SalaryPayment[] = [
    {
      id: 'sal_1',
      employeeId: 'emp_1',
      employeeName: 'Ahmed Farah',
      amount: 2200,
      period: 'July 2026',
      status: 'paid',
      paidDate: todayIso
    },
    {
      id: 'sal_2',
      employeeId: 'emp_2',
      employeeName: 'Fatima Omar',
      amount: 1400,
      period: 'July 2026',
      status: 'paid',
      paidDate: todayIso
    }
  ];

  sampleSalaries.forEach(sa => {
    batch.set(doc(db, COLLECTIONS.SALARIES, sa.id), sa);
  });

  // 9. Inventory Movements
  const sampleMovements: InventoryMovement[] = [
    {
      id: 'mov_1',
      type: 'in',
      itemType: 'ingredient',
      itemId: 'ing_1',
      itemName: 'Premium Basmati Rice',
      quantity: 150,
      reason: 'Purchase order pur_2 received from supplier',
      createdBy: 'Ahmed Farah',
      createdAt: yesterdayIso
    },
    {
      id: 'mov_2',
      type: 'out',
      itemType: 'ingredient',
      itemId: 'ing_2',
      itemName: 'Fresh Camel Meat Cubes',
      quantity: 10,
      reason: 'Kitchen preparation for lunch buffet',
      createdBy: 'Youssef Hassan',
      createdAt: todayIso
    }
  ];

  sampleMovements.forEach(m => {
    batch.set(doc(db, COLLECTIONS.MOVEMENTS, m.id), m);
  });

  // 10. Financial Accounts
  const sampleAccounts: FinancialAccount[] = [
    {
      id: 'acc_cash',
      name: 'Restaurant Cash Drawer & Safe',
      type: 'cash',
      balance: 1850.00,
      updatedAt: todayIso
    },
    {
      id: 'acc_bank',
      name: 'Premier Commercial Bank (Corporate Operating)',
      type: 'bank',
      balance: 12450.00,
      accountNumber: 'PCB-8839201-9',
      updatedAt: todayIso
    }
  ];

  sampleAccounts.forEach(acc => {
    batch.set(doc(db, COLLECTIONS.ACCOUNTS, acc.id), acc);
  });

  // 11. Customer Refunds
  const sampleRefunds: CustomerRefund[] = [
    {
      id: 'ref_1',
      orderId: 'ord_99',
      customerName: 'Hassan Aden',
      amount: 18.00,
      reason: 'Incorrect order delivered (substituted dish refunded)',
      paymentMethod: 'cash',
      createdAt: yesterdayIso
    }
  ];

  sampleRefunds.forEach(rf => {
    batch.set(doc(db, COLLECTIONS.REFUNDS, rf.id), rf);
  });

  // 12. Bank Transactions
  const sampleBankTransactions: BankTransaction[] = [
    {
      id: 'bt_1',
      type: 'deposit',
      amount: 1500.00,
      reference: 'DEP-884920',
      description: 'Daily cash sales vault deposit to bank',
      accountName: 'Premier Commercial Bank (Corporate Operating)',
      createdAt: yesterdayIso
    },
    {
      id: 'bt_2',
      type: 'transfer',
      amount: 575.00,
      reference: 'WIRE-SUP-29',
      description: 'Supplier payment to Mogadishu Livestock',
      accountName: 'Premier Commercial Bank (Corporate Operating)',
      createdAt: threeDaysAgoIso
    }
  ];

  sampleBankTransactions.forEach(bt => {
    batch.set(doc(db, COLLECTIONS.BANK_TRANSACTIONS, bt.id), bt);
  });

  // 13. Delivery Drivers
  const sampleDrivers = [
    {
      id: 'drv_1',
      name: 'Jabril Dahir',
      phone: '+252 61 111 2233',
      status: 'in_transit',
      activeDeliveries: 1,
      completedDeliveries: 18,
      avgDeliveryTimeMinutes: 19,
      rating: 4.8,
      vehicle: 'Honda Motorcycle (MOG-482)'
    },
    {
      id: 'drv_2',
      name: 'Omar Abdi',
      phone: '+252 61 222 3344',
      status: 'available',
      activeDeliveries: 0,
      completedDeliveries: 24,
      avgDeliveryTimeMinutes: 21,
      rating: 4.9,
      vehicle: 'Tuk-Tuk Auto (MOG-109)'
    },
    {
      id: 'drv_3',
      name: 'Guled Warsame',
      phone: '+252 61 444 5566',
      status: 'available',
      activeDeliveries: 0,
      completedDeliveries: 15,
      avgDeliveryTimeMinutes: 24,
      rating: 4.6,
      vehicle: 'Yamaha Motorcycle (MOG-773)'
    }
  ];
  sampleDrivers.forEach(d => batch.set(doc(db, COLLECTIONS.DRIVERS, d.id), d));

  // 14. Kitchen Stations
  const sampleStations = [
    {
      id: 'st_1',
      name: 'Grill Station',
      stationType: 'grill',
      assignedChef: 'Chef Youssef Hassan',
      activeOrdersCount: 2,
      completedOrdersToday: 38,
      avgPrepTimeMinutes: 14,
      status: 'normal',
      supportedCategories: ['Grill', 'Suqaar', 'Mandi', 'Lamb', 'Chicken']
    },
    {
      id: 'st_2',
      name: 'Pizza & Oven Station',
      stationType: 'pizza',
      assignedChef: 'Chef Abdirahman Nur',
      activeOrdersCount: 1,
      completedOrdersToday: 24,
      avgPrepTimeMinutes: 12,
      status: 'normal',
      supportedCategories: ['Pizza', 'Bakery', 'Pies', 'Pastry', 'Canjeero']
    },
    {
      id: 'st_3',
      name: 'Drinks & Shaah Bar',
      stationType: 'drinks',
      assignedChef: 'Barista Saeed Jama',
      activeOrdersCount: 1,
      completedOrdersToday: 52,
      avgPrepTimeMinutes: 4,
      status: 'normal',
      supportedCategories: ['Tea', 'Shaah', 'Juice', 'Coffee', 'Beverages', 'Soda']
    },
    {
      id: 'st_4',
      name: 'Dessert Station',
      stationType: 'dessert',
      assignedChef: 'Pastry Chef Layla Osman',
      activeOrdersCount: 0,
      completedOrdersToday: 18,
      avgPrepTimeMinutes: 6,
      status: 'normal',
      supportedCategories: ['Desserts', 'Halwa', 'Cake', 'Ice Cream', 'Sweets']
    },
    {
      id: 'st_5',
      name: 'Packing & Main Expo Station',
      stationType: 'packing',
      assignedChef: 'Expeditor Bilal Jama',
      activeOrdersCount: 2,
      completedOrdersToday: 64,
      avgPrepTimeMinutes: 3,
      status: 'busy',
      supportedCategories: ['Mains', 'Takeaway', 'Sides', 'Packaging']
    }
  ];
  sampleStations.forEach(s => batch.set(doc(db, COLLECTIONS.STATIONS, s.id), s));

  // 15. Employee Attendance
  const sampleAttendance = [
    {
      id: 'att_1',
      employeeId: 'emp_1',
      employeeName: 'Ahmed Farah',
      date: todayIso.split('T')[0],
      status: 'present',
      checkInTime: '08:00 AM',
      lateMinutes: 0,
      overtimeHours: 1,
      shift: 'Morning Manager'
    },
    {
      id: 'att_2',
      employeeId: 'emp_2',
      employeeName: 'Fatima Omar',
      date: todayIso.split('T')[0],
      status: 'present',
      checkInTime: '08:15 AM',
      lateMinutes: 0,
      overtimeHours: 0,
      shift: 'Cashier Shift A'
    },
    {
      id: 'att_3',
      employeeId: 'emp_3',
      employeeName: 'Youssef Hassan',
      date: todayIso.split('T')[0],
      status: 'present',
      checkInTime: '07:45 AM',
      lateMinutes: 0,
      overtimeHours: 2,
      shift: 'Head Chef'
    },
    {
      id: 'att_4',
      employeeId: 'emp_4',
      employeeName: 'Bilal Jama',
      date: todayIso.split('T')[0],
      status: 'late',
      checkInTime: '09:25 AM',
      lateMinutes: 25,
      overtimeHours: 0,
      shift: 'Waiter Morning'
    }
  ];
  sampleAttendance.forEach(a => batch.set(doc(db, COLLECTIONS.ATTENDANCE, a.id), a));

  // 16. Reservations
  const sampleReservations = [
    {
      id: 'res_1',
      customerName: 'Sheikh Mohamed',
      phone: '+252 61 999 0011',
      partySize: 6,
      reservationTime: '07:30 PM Today',
      status: 'confirmed',
      tableNumber: 'Table 12 (VIP)',
      branch: 'Main Branch'
    },
    {
      id: 'res_2',
      customerName: 'Amina Warsame',
      phone: '+252 61 777 4455',
      partySize: 4,
      reservationTime: '08:00 PM Today',
      status: 'confirmed',
      tableNumber: 'Table 5',
      branch: 'Main Branch'
    }
  ];
  sampleReservations.forEach(r => batch.set(doc(db, COLLECTIONS.RESERVATIONS, r.id), r));

  // 17. Branch Operations
  const sampleBranches = [
    {
      id: 'br_1',
      branchName: 'Main Downtown Branch',
      managerName: 'Ahmed Farah',
      status: 'busy',
      activeTables: 18,
      maxTables: 24,
      occupancyRate: 75,
      dailySales: 1840.00,
      activeOrders: 6
    }
  ];
  sampleBranches.forEach(b => batch.set(doc(db, COLLECTIONS.BRANCHES, b.id), b));

  // 18. Customer Feedbacks
  const sampleFeedbacks = [
    {
      id: 'fb_1',
      orderId: 'ord_106',
      customerName: 'Zahra Ali',
      rating: 2,
      complaint: 'Preparation took over 20 minutes for camel meat rice dish.',
      category: 'speed',
      status: 'open',
      createdAt: todayIso
    },
    {
      id: 'fb_2',
      orderId: 'ord_101',
      customerName: 'Khadija Said',
      rating: 5,
      compliments: 'Food was hot, delicious and tea had the perfect cardamom blend!',
      category: 'food_quality',
      status: 'resolved',
      createdAt: todayIso
    }
  ];
  sampleFeedbacks.forEach(f => batch.set(doc(db, COLLECTIONS.FEEDBACKS, f.id), f));

  // 19. Equipment Items
  const sampleEquipment = [
    {
      id: 'eq_1',
      name: 'Commercial Espresso & Tea Steamer',
      department: 'beverage',
      status: 'operational',
      lastServiced: '2026-06-15',
      nextServiceDue: '2026-08-15'
    },
    {
      id: 'eq_2',
      name: 'Main Kitchen Heavy Duty Gas Grill',
      department: 'kitchen',
      status: 'needs_maintenance',
      lastServiced: '2026-05-10',
      nextServiceDue: '2026-07-20'
    },
    {
      id: 'eq_3',
      name: 'POS Cashier Register 01',
      department: 'cashier',
      status: 'operational',
      lastServiced: '2026-07-01',
      nextServiceDue: '2026-10-01'
    }
  ];
  // 20. CRM Customers, Wallets, Points, Rewards & Coupons
  const sampleCRMCustomers: Customer[] = [
    {
      id: 'cust_1',
      fullName: 'Amina Sheikh Duale',
      name: 'Amina Sheikh Duale',
      phone: '+252 61 555 7788',
      email: 'amina.duale@example.so',
      gender: 'female',
      dateOfBirth: '1990-05-14',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      preferredLanguage: 'so',
      address: 'KM4 Hodan District, House #42',
      city: 'Mogadishu',
      notes: 'Prefers mild spices in Suqaar and extra cardamom in Shaah.',
      registrationDate: threeDaysAgoIso,
      createdAt: threeDaysAgoIso,
      lastOrderDate: todayIso,
      status: 'vip',
      membershipLevel: 'Gold',
      totalOrders: 32,
      totalSpending: 1240.50,
      totalSpent: 1240.50,
      averageOrderValue: 38.76,
      cancelledOrders: 1,
      refundHistoryCount: 0,
      orderFrequencyDays: 4
    },
    {
      id: 'cust_2',
      fullName: 'Hassan Ali Al-Mansoor',
      name: 'Hassan Ali Al-Mansoor',
      phone: '+252 61 888 2211',
      email: 'hassan.mansoor@example.com',
      gender: 'male',
      dateOfBirth: '1985-11-20',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      preferredLanguage: 'ar',
      address: '21 June Street, Block B',
      city: 'Hargeisa',
      notes: 'Frequent corporate diner. Requests Mandi lamb on weekends.',
      registrationDate: threeDaysAgoIso,
      createdAt: threeDaysAgoIso,
      lastOrderDate: yesterdayIso,
      status: 'active',
      membershipLevel: 'Silver',
      totalOrders: 14,
      totalSpending: 480.00,
      totalSpent: 480.00,
      averageOrderValue: 34.28,
      cancelledOrders: 0,
      refundHistoryCount: 0,
      orderFrequencyDays: 7
    },
    {
      id: 'cust_3',
      fullName: 'Farah Mohamed Dahir',
      name: 'Farah Mohamed Dahir',
      phone: '+252 61 333 9900',
      email: 'farah.dahir@example.com',
      gender: 'male',
      dateOfBirth: '1994-03-08',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      preferredLanguage: 'en',
      address: 'Airport Road Plaza, Office 302',
      city: 'Mogadishu',
      notes: 'Prefers takeaway delivery.',
      registrationDate: yesterdayIso,
      createdAt: yesterdayIso,
      lastOrderDate: yesterdayIso,
      status: 'active',
      membershipLevel: 'Bronze',
      totalOrders: 6,
      totalSpending: 185.00,
      totalSpent: 185.00,
      averageOrderValue: 30.83,
      cancelledOrders: 0,
      refundHistoryCount: 0
    },
    {
      id: 'cust_4',
      fullName: 'Safia Ahmed Warsame',
      name: 'Safia Ahmed Warsame',
      phone: '+252 61 777 6655',
      email: 'safia.warsame@example.so',
      gender: 'female',
      dateOfBirth: '1998-09-25',
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      preferredLanguage: 'so',
      address: 'Waberi District, Villa 18',
      city: 'Garowe',
      notes: 'Top online order customer.',
      registrationDate: threeDaysAgoIso,
      createdAt: threeDaysAgoIso,
      lastOrderDate: todayIso,
      status: 'vip',
      membershipLevel: 'Platinum',
      totalOrders: 45,
      totalSpending: 2150.00,
      totalSpent: 2150.00,
      averageOrderValue: 47.77,
      cancelledOrders: 2,
      refundHistoryCount: 1,
      orderFrequencyDays: 3
    }
  ];
  sampleCRMCustomers.forEach(c => batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), c));

  // Customer Wallets
  const sampleWallets = [
    { id: 'w_cust_1', customerId: 'cust_1', customerName: 'Amina Sheikh Duale', balance: 120.00, currency: 'USD', createdAt: threeDaysAgoIso, updatedAt: todayIso },
    { id: 'w_cust_2', customerId: 'cust_2', customerName: 'Hassan Ali Al-Mansoor', balance: 45.00, currency: 'USD', createdAt: threeDaysAgoIso, updatedAt: yesterdayIso },
    { id: 'w_cust_4', customerId: 'cust_4', customerName: 'Safia Ahmed Warsame', balance: 250.00, currency: 'USD', createdAt: threeDaysAgoIso, updatedAt: todayIso }
  ];
  sampleWallets.forEach(w => batch.set(doc(db, COLLECTIONS.CUSTOMER_WALLETS, w.id), w));

  // Customer Loyalty Points
  const samplePoints = [
    { id: 'p_cust_1', customerId: 'cust_1', customerName: 'Amina Sheikh Duale', currentPointsBalance: 850, lifetimePoints: 1240, membershipLevel: 'Gold', nextLevelPointsThreshold: 1200, updatedAt: todayIso },
    { id: 'p_cust_2', customerId: 'cust_2', customerName: 'Hassan Ali Al-Mansoor', currentPointsBalance: 320, lifetimePoints: 480, membershipLevel: 'Silver', nextLevelPointsThreshold: 500, updatedAt: yesterdayIso },
    { id: 'p_cust_4', customerId: 'cust_4', customerName: 'Safia Ahmed Warsame', currentPointsBalance: 1850, lifetimePoints: 2150, membershipLevel: 'Platinum', nextLevelPointsThreshold: 3000, updatedAt: todayIso }
  ];
  samplePoints.forEach(p => batch.set(doc(db, COLLECTIONS.CUSTOMER_POINTS, p.id), p));

  // Redeemable Rewards
  const sampleRewards = [
    { id: 'rew_1', rewardName: 'Free Cardamom Milk Tea', rewardNameAr: 'شاي صومالي مجاني بالهيل', rewardNameSo: 'Shaah Cadde Bilaash ah', description: 'Complimentary traditional Shaah Cadde tea cup', pointsRequired: 100, discountType: 'fixed_amount', discountValue: 3.50, isActive: true, currentRedemptions: 24, createdAt: threeDaysAgoIso },
    { id: 'rew_2', rewardName: '$10 Off Meal Voucher', rewardNameAr: 'قسيمة خصم بقيمة 10 دولار', rewardNameSo: 'Qoupon 10 Dollar ah', description: 'Get $10 instant discount on orders above $30', pointsRequired: 250, discountType: 'fixed_amount', discountValue: 10.00, isActive: true, currentRedemptions: 18, createdAt: threeDaysAgoIso },
    { id: 'rew_3', rewardName: 'Free Somali Chicken Suqaar', rewardNameAr: 'وجبة صقار دجاج صومالي مجانية', rewardNameSo: 'Suqaar Gallay Bilaash ah', description: 'One full portion of fresh chicken suqaar with Canjeero', pointsRequired: 450, discountType: 'fixed_amount', discountValue: 14.50, isActive: true, currentRedemptions: 9, createdAt: threeDaysAgoIso },
    { id: 'rew_4', rewardName: '20% VIP Family Feast Discount', rewardNameAr: 'خصم 20% لوجبات العائلة كبار الشخصيات', rewardNameSo: 'Dhimis 20% Cuntada Qoyska', description: '20% off on large family platter orders', pointsRequired: 800, discountType: 'percentage', discountValue: 20, isActive: true, currentRedemptions: 5, createdAt: threeDaysAgoIso }
  ];
  sampleRewards.forEach(r => batch.set(doc(db, COLLECTIONS.CUSTOMER_REWARDS, r.id), r));

  // Promotional Coupons
  const sampleCoupons = [
    { id: 'coup_1', code: 'WELCOME10', title: '10% Welcome Offer', titleAr: 'خصم 10% للعملاء الجدد', titleSo: 'Dhimis 10% Kusoo Dhowaow', description: 'Enjoy 10% off your next order over $20', discountType: 'percentage', discountValue: 10, minOrderAmount: 20, maxDiscountAmount: 15, expiryDate: '2026-12-31', usageLimit: 500, usageCount: 42, isActive: true, createdAt: threeDaysAgoIso },
    { id: 'coup_2', code: 'VIPSPECIAL', title: '$15 Off VIP Special', titleAr: 'خصم 15 دولار للعملاء المميزين', titleSo: 'Dhimis $15 Macaamiisha VIP-ka', description: 'Special $15 voucher for VIP members on orders over $50', discountType: 'fixed_amount', discountValue: 15.00, minOrderAmount: 50, expiryDate: '2026-12-31', targetLevel: 'VIP', usageLimit: 100, usageCount: 12, isActive: true, createdAt: threeDaysAgoIso },
    { id: 'coup_3', code: 'BDAY2026', title: 'Happy Birthday $20 Gift', titleAr: 'هدية عيد الميلاد 20 دولار', titleSo: 'Hadyada Dhalashada $20', description: 'Celebrate your special day with a $20 meal credit', discountType: 'fixed_amount', discountValue: 20.00, minOrderAmount: 30, expiryDate: '2026-12-31', isBirthdayOffer: true, usageLimit: 50, usageCount: 8, isActive: true, createdAt: threeDaysAgoIso }
  ];
  sampleCoupons.forEach(cp => batch.set(doc(db, COLLECTIONS.CUSTOMER_COUPONS, cp.id), cp));

  await batch.commit();
}

// Clear all data helper
export async function clearFirestoreData() {
  const collectionNames = Object.values(COLLECTIONS);
  for (const colName of collectionNames) {
    const snapshot = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
    await batch.commit();
  }
}

// Firestore Action Helpers required by user request:
export async function addExpenseFirestore(data: Omit<Expense, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.EXPENSES), {
    ...data,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function addPurchaseFirestore(data: Omit<Purchase, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.PURCHASES), {
    ...data,
    createdAt
  });

  // Automatically record inventory movement
  await addDoc(collection(db, COLLECTIONS.MOVEMENTS), {
    type: 'in',
    itemType: 'ingredient',
    itemId: data.itemName.toLowerCase().replace(/\s+/g, '_'),
    itemName: data.itemName,
    quantity: data.quantity,
    reason: `Registered purchase from ${data.supplierName}`,
    createdBy: 'AI Assistant / Manager',
    createdAt
  });

  return docRef.id;
}

export async function addSalaryFirestore(data: Omit<SalaryPayment, 'id' | 'paidDate'>) {
  const paidDate = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.SALARIES), {
    ...data,
    paidDate
  });
  return docRef.id;
}

export async function recordInventoryMovementFirestore(data: Omit<InventoryMovement, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.MOVEMENTS), {
    ...data,
    createdAt
  });
  return docRef.id;
}

export async function updateProductStockFirestore(productId: string, newStock: number) {
  const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
  await updateDoc(productRef, { stock: newStock });
}

export async function addOrderFirestore(data: Omit<Order, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
    ...data,
    createdAt
  });
  return docRef.id;
}

export async function addRefundFirestore(data: Omit<CustomerRefund, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.REFUNDS), {
    ...data,
    createdAt
  });
  return docRef.id;
}

export async function addBankTransactionFirestore(data: Omit<BankTransaction, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.BANK_TRANSACTIONS), {
    ...data,
    createdAt
  });
  return docRef.id;
}

export async function updateAccountBalanceFirestore(accountId: string, newBalance: number) {
  const accRef = doc(db, COLLECTIONS.ACCOUNTS, accountId);
  await updateDoc(accRef, { balance: newBalance, updatedAt: new Date().toISOString() });
}

// Operational Actions
export async function updateStationStatusFirestore(stationId: string, status: 'normal' | 'busy' | 'overloaded', assignedChef?: string) {
  const stationRef = doc(db, COLLECTIONS.STATIONS, stationId);
  const updates: any = { status };
  if (assignedChef) updates.assignedChef = assignedChef;
  await updateDoc(stationRef, updates);
}

export async function assignDriverToOrderFirestore(orderId: string, driverId: string, driverName: string) {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  await updateDoc(orderRef, {
    assignedDriver: driverName,
    deliveryStatus: 'in_transit'
  });

  const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
  await updateDoc(driverRef, {
    status: 'in_transit',
    activeDeliveries: 1
  });
}

export async function resolveCustomerFeedbackFirestore(feedbackId: string) {
  const feedbackRef = doc(db, COLLECTIONS.FEEDBACKS, feedbackId);
  await updateDoc(feedbackRef, { status: 'resolved' });
}

// ==========================================
// Phase 2: User Management & Activity Logs
// ==========================================

export async function logActivityFirestore(logData: Omit<ActivityLog, 'id' | 'timestamp'>) {
  try {
    const newLogRef = doc(collection(db, COLLECTIONS.ACTIVITY_LOGS));
    const log: ActivityLog = {
      ...logData,
      id: newLogRef.id,
      timestamp: new Date().toISOString()
    };
    await setDoc(newLogRef, log);
    return log;
  } catch (err) {
    console.warn('Failed to record activity log in Firestore:', err);
    return null;
  }
}

export async function upsertUserRecordFirestore(userRecord: UserRecord) {
  const userRef = doc(db, COLLECTIONS.USERS, userRecord.uid);
  await setDoc(userRef, userRecord, { merge: true });
}

export async function updateUserRoleFirestore(uid: string, role: any, updatedBy: string) {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, { role });
  await logActivityFirestore({
    userId: updatedBy,
    userEmail: 'admin@restaurant-erp.internal',
    userName: 'Admin User',
    userRole: 'Owner',
    action: 'UPDATE_ROLE',
    details: `Updated role for user ${uid} to ${role}`
  });
}

export async function updateUserStatusFirestore(uid: string, status: 'active' | 'suspended' | 'pending', updatedBy: string) {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, { status });
  await logActivityFirestore({
    userId: updatedBy,
    userEmail: 'admin@restaurant-erp.internal',
    userName: 'Admin User',
    userRole: 'Owner',
    action: 'UPDATE_STATUS',
    details: `Updated status for user ${uid} to ${status}`
  });
}

// ==========================================
// Phase 4: Product & Restaurant Menu Management
// ==========================================

export async function addProductFirestore(data: Omit<Product, 'id'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
    ...data,
    availabilityStatus: data.availabilityStatus || 'enabled',
    createdAt,
    updatedAt: createdAt
  });
  return docRef.id;
}

export async function updateProductFirestore(productId: string, data: Partial<Product>) {
  const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
  await updateDoc(productRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteProductFirestore(productId: string) {
  const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
  await deleteDoc(productRef);
}

export async function toggleProductAvailabilityFirestore(productId: string, status: 'enabled' | 'disabled' | 'out_of_stock') {
  const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
  await updateDoc(productRef, {
    availabilityStatus: status,
    updatedAt: new Date().toISOString()
  });
}

// Category Operations
export async function addCategoryFirestore(data: Omit<Category, 'id'>) {
  const createdAt = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
    ...data,
    createdAt
  });
  return docRef.id;
}

export async function updateCategoryFirestore(categoryId: string, data: Partial<Category>) {
  const catRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await updateDoc(catRef, data);
}

export async function deleteCategoryFirestore(categoryId: string) {
  const catRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await deleteDoc(catRef);
}

export async function reorderCategoriesFirestore(categories: { id: string; order: number }[]) {
  const batch = writeBatch(db);
  categories.forEach(item => {
    const catRef = doc(db, COLLECTIONS.CATEGORIES, item.id);
    batch.update(catRef, { order: item.order });
  });
  await batch.commit();
}

// Product Options Operations
export async function addProductOptionFirestore(data: Omit<ProductOption, 'id'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.PERMISSIONS /* or product_options collection */), data);
  return docRef.id;
}

export async function updateProductOptionFirestore(optionId: string, data: Partial<ProductOption>) {
  const optRef = doc(db, 'product_options', optionId);
  await updateDoc(optRef, data);
}

export async function deleteProductOptionFirestore(optionId: string) {
  const optRef = doc(db, 'product_options', optionId);
  await deleteDoc(optRef);
}

/**
 * Automatic stock deduction for linked ingredients upon order completion
 */
export async function deductProductIngredientsStockFirestore(productId: string, soldQuantity: number, orderId?: string) {
  try {
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    const productSnap = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS)));
    const targetDoc = productSnap.docs.find(d => d.id === productId);
    if (!targetDoc) return;

    const productData = targetDoc.data() as Product;
    if (!productData.ingredients || productData.ingredients.length === 0) return;

    const batch = writeBatch(db);

    for (const item of productData.ingredients) {
      const ingRef = doc(db, COLLECTIONS.INGREDIENTS, item.ingredientId);
      const ingDocs = await getDocs(query(collection(db, COLLECTIONS.INGREDIENTS)));
      const ingDoc = ingDocs.docs.find(d => d.id === item.ingredientId);
      if (ingDoc) {
        const currentData = ingDoc.data() as Ingredient;
        const totalDeduction = item.requiredQuantity * soldQuantity;
        const newStock = Math.max(0, currentData.stock - totalDeduction);

        batch.update(ingRef, { stock: newStock });

        // Record Inventory Movement
        const movementRef = doc(collection(db, COLLECTIONS.MOVEMENTS));
        batch.set(movementRef, {
          id: movementRef.id,
          type: 'out',
          itemType: 'ingredient',
          itemId: item.ingredientId,
          itemName: item.ingredientName,
          quantity: totalDeduction,
          reason: `Auto stock deduction from sale of ${productData.name} (Qty: ${soldQuantity})${orderId ? ` - Order #${orderId}` : ''}`,
          createdBy: 'POS System',
          createdAt: new Date().toISOString()
        });
      }
    }

    await batch.commit();
  } catch (err) {
    console.warn('Automatic ingredient stock deduction warning:', err);
  }
}

/**
 * Automatic stock restoration for linked ingredients upon order cancellation/refund
 */
export async function restoreProductIngredientsStockFirestore(productId: string, returnedQuantity: number, orderId?: string) {
  try {
    const productSnap = await getDocs(query(collection(db, COLLECTIONS.PRODUCTS)));
    const targetDoc = productSnap.docs.find(d => d.id === productId);
    if (!targetDoc) return;

    const productData = targetDoc.data() as Product;
    if (!productData.ingredients || productData.ingredients.length === 0) return;

    const batch = writeBatch(db);

    for (const item of productData.ingredients) {
      const ingRef = doc(db, COLLECTIONS.INGREDIENTS, item.ingredientId);
      const ingDocs = await getDocs(query(collection(db, COLLECTIONS.INGREDIENTS)));
      const ingDoc = ingDocs.docs.find(d => d.id === item.ingredientId);
      if (ingDoc) {
        const currentData = ingDoc.data() as Ingredient;
        const totalRestoration = item.requiredQuantity * returnedQuantity;
        const newStock = currentData.stock + totalRestoration;

        batch.update(ingRef, { stock: newStock });

        // Record Inventory Movement
        const movementRef = doc(collection(db, COLLECTIONS.MOVEMENTS));
        batch.set(movementRef, {
          id: movementRef.id,
          type: 'in',
          itemType: 'ingredient',
          itemId: item.ingredientId,
          itemName: item.ingredientName,
          quantity: totalRestoration,
          reason: `Auto stock restoration from cancelled order of ${productData.name} (Qty: ${returnedQuantity})${orderId ? ` - Order #${orderId}` : ''}`,
          createdBy: 'POS System',
          createdAt: new Date().toISOString()
        });
      }
    }

    await batch.commit();
  } catch (err) {
    console.warn('Automatic ingredient stock restoration warning:', err);
  }
}

// ==========================================
// PHASE 5: ORDER & POS FIRESTORE HELPERS
// ==========================================

export async function createOrderFirestore(orderData: Omit<Order, 'id'>): Promise<Order> {
  const newRef = doc(collection(db, COLLECTIONS.ORDERS));
  const fullOrder: Order = {
    ...orderData,
    id: newRef.id
  };
  await setDoc(newRef, fullOrder);

  // If order linked to a dining table, mark table occupied
  if (fullOrder.tableNumber && fullOrder.orderType === 'dine_in') {
    await updateTableStatusFirestore(fullOrder.tableNumber, 'occupied', fullOrder.id, fullOrder.orderNumber);
  }

  // Record payment in payments collection if paid
  if (fullOrder.paymentStatus === 'paid') {
    await addPaymentFirestore({
      orderId: fullOrder.id,
      orderNumber: fullOrder.orderNumber,
      amount: fullOrder.totalAmount,
      method: fullOrder.paymentMethod,
      status: 'paid',
      processedBy: fullOrder.employeeName || 'Cashier',
      createdAt: fullOrder.createdAt
    });
  }

  // Deduct ingredient stock automatically
  for (const item of fullOrder.items) {
    await deductProductIngredientsStockFirestore(item.productId, item.quantity, fullOrder.orderNumber);
  }

  return fullOrder;
}

export async function updateOrderFirestore(orderId: string, data: Partial<Order>): Promise<void> {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const updatePayload = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(orderRef, updatePayload as any);
}

export async function updateOrderStatusFirestore(orderId: string, status: OrderStatus): Promise<void> {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const updatePayload: any = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (status === 'completed') {
    updatePayload.completedAt = new Date().toISOString();
    updatePayload.paymentStatus = 'paid';
  }
  await updateDoc(orderRef, updatePayload);

  if (status === 'cancelled') {
    try {
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            await restoreProductIngredientsStockFirestore(item.productId, item.quantity, orderData.orderNumber || orderId);
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore stock on cancellation:', e);
    }
  }
}

export async function deleteOrderFirestore(orderId: string): Promise<void> {
  const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
  await deleteDoc(orderRef);
}

// Hold Orders
export async function holdOrderFirestore(holdData: Omit<HoldOrder, 'id'>): Promise<HoldOrder> {
  const newRef = doc(collection(db, COLLECTIONS.HOLD_ORDERS));
  const fullHold: HoldOrder = {
    ...holdData,
    id: newRef.id
  };
  await setDoc(newRef, fullHold);
  return fullHold;
}

export async function fetchHoldOrdersFirestore(): Promise<HoldOrder[]> {
  const q = query(collection(db, COLLECTIONS.HOLD_ORDERS), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HoldOrder));
}

export async function deleteHoldOrderFirestore(holdId: string): Promise<void> {
  const holdRef = doc(db, COLLECTIONS.HOLD_ORDERS, holdId);
  await deleteDoc(holdRef);
}

// Customers
export async function addCustomerFirestore(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  const newRef = doc(collection(db, COLLECTIONS.CUSTOMERS));
  const fullCustomer: Customer = {
    ...customerData,
    id: newRef.id
  };
  await setDoc(newRef, fullCustomer);
  return fullCustomer;
}

export async function fetchCustomersFirestore(): Promise<Customer[]> {
  const q = query(collection(db, COLLECTIONS.CUSTOMERS), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
}

export async function updateCustomerFirestore(customerId: string, data: Partial<Customer>): Promise<void> {
  const custRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
  await updateDoc(custRef, data as any);
}

// Payments
export async function addPaymentFirestore(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
  const newRef = doc(collection(db, COLLECTIONS.PAYMENTS));
  const fullPayment: Payment = {
    ...paymentData,
    id: newRef.id
  };
  await setDoc(newRef, fullPayment);
  return fullPayment;
}

export async function fetchPaymentsFirestore(): Promise<Payment[]> {
  const q = query(collection(db, COLLECTIONS.PAYMENTS), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
}

// Tables
export async function fetchTablesFirestore(): Promise<DiningTable[]> {
  const q = query(collection(db, COLLECTIONS.TABLES));
  const snap = await getDocs(q);
  if (snap.empty) {
    // Return sample defaults if not yet seeded
    return [
      { id: 'tbl_1', tableNumber: 'T-01', section: 'indoor', capacity: 4, status: 'available' },
      { id: 'tbl_2', tableNumber: 'T-02', section: 'indoor', capacity: 2, status: 'available' },
      { id: 'tbl_3', tableNumber: 'T-03', section: 'indoor', capacity: 6, status: 'available' },
      { id: 'tbl_4', tableNumber: 'T-04', section: 'terrace', capacity: 4, status: 'available' },
      { id: 'tbl_5', tableNumber: 'T-05', section: 'terrace', capacity: 4, status: 'available' },
      { id: 'tbl_6', tableNumber: 'VIP-1', section: 'vip', capacity: 8, status: 'available' },
      { id: 'tbl_7', tableNumber: 'VIP-2', section: 'vip', capacity: 10, status: 'available' }
    ];
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DiningTable));
}

export async function updateTableStatusFirestore(
  tableNumber: string,
  status: 'available' | 'occupied' | 'reserved',
  orderId?: string,
  orderNumber?: string
): Promise<void> {
  try {
    const q = query(collection(db, COLLECTIONS.TABLES));
    const snap = await getDocs(q);
    const targetDoc = snap.docs.find(d => d.data().tableNumber === tableNumber);
    if (targetDoc) {
      const tableRef = doc(db, COLLECTIONS.TABLES, targetDoc.id);
      await updateDoc(tableRef, {
        status,
        currentOrderId: orderId || null,
        currentOrderNumber: orderNumber || null,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create table document
      const newRef = doc(collection(db, COLLECTIONS.TABLES));
      await setDoc(newRef, {
        id: newRef.id,
        tableNumber,
        section: tableNumber.startsWith('VIP') ? 'vip' : 'indoor',
        capacity: 4,
        status,
        currentOrderId: orderId || null,
        currentOrderNumber: orderNumber || null,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Error updating table status in Firestore:', err);
  }
}



