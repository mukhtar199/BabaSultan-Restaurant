import {
  Product,
  Ingredient,
  Employee,
  Supplier,
  Order,
  Expense,
  Purchase,
  SalaryPayment,
  Customer
} from '../types';
import { InitialSetupData } from './firebase';

export interface LocalStorageState {
  products: Product[];
  ingredients: Ingredient[];
  employees: Employee[];
  suppliers: Supplier[];
  customers: Customer[];
  recipes: any[];
  branches: any[];
  orders: Order[];
  expenses: Expense[];
  purchases: Purchase[];
  salaries: SalaryPayment[];
  taxes: any;
  payments: any;
  users: any[];
  systemConfig: any;
  isInitialSetupCompleted: boolean;
}

export const LOCAL_STORAGE_KEYS = {
  SETUP_COMPLETED: 'erp_initial_setup_completed',
  SETUP_DATA: 'erp_initial_setup_data',
  PRODUCTS: 'erp_products',
  INGREDIENTS: 'erp_ingredients',
  EMPLOYEES: 'erp_employees',
  SUPPLIERS: 'erp_suppliers',
  CUSTOMERS: 'erp_customers',
  RECIPES: 'erp_recipes',
  BRANCHES: 'erp_branches',
  ORDERS: 'erp_orders',
  EXPENSES: 'erp_expenses',
  PURCHASES: 'erp_purchases',
  SALARIES: 'erp_salaries',
  TAXES: 'erp_taxes',
  PAYMENTS: 'erp_payments',
  USERS: 'erp_users',
  ACTIVE_USER: 'erp_active_user',
  SYSTEM_CONFIG: 'erp_system_config'
};

export function parseSetupWizardData(setupData: InitialSetupData): LocalStorageState {
  const branchName = setupData.branch?.name || 'Main HQ Branch';
  const branchCode = setupData.branch?.code || 'HQ-MAIN';

  // 1. Map Products
  const products: Product[] = (setupData.products || []).map((prod, i) => {
    const prodId = `prod_wizard_${i + 1}`;
    const recipe = setupData.recipes?.find(r => r.productName === prod.name || r.productId === prodId);

    return {
      id: prodId,
      name: prod.name,
      nameEn: prod.name,
      nameAr: prod.nameAr || prod.name,
      nameSo: prod.nameSo || prod.name,
      category: prod.category || 'Main Courses',
      price: Number(prod.price) || 0,
      cost: Number(prod.cost) || 0,
      imageUrl: prod.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      prepTimeMinutes: Number(prod.prepTimeMinutes) || 15,
      stock: 120,
      minStockAlert: 10,
      unit: 'portion',
      salesCount: 15 + i * 5,
      availabilityStatus: 'enabled',
      ingredients: (recipe?.ingredients || []).map(ing => ({
        ingredientId: ing.ingredientId || `ing_${i + 1}`,
        ingredientName: ing.ingredientName,
        requiredQuantity: Number(ing.quantityRequired) || 1,
        unit: ing.unit || 'kg'
      })),
      createdAt: new Date().toISOString()
    };
  });

  // 2. Map Ingredients
  const ingredients: Ingredient[] = (setupData.inventory || []).map((item, i) => ({
    id: `ing_wizard_${i + 1}`,
    name: item.name,
    stock: Number(item.currentQuantity) || 50,
    unit: item.unit || 'kg',
    minStockAlert: Number(item.minAlertStock) || 10,
    costPerUnit: Number(item.costPerUnit) || 2.5,
    supplierId: `sup_wizard_1`,
    supplierName: setupData.suppliers?.[0]?.name || 'Primary Supplier'
  }));

  // 3. Map Employees
  const employees: Employee[] = (setupData.employees || []).map((emp, i) => ({
    id: `emp_wizard_${i + 1}`,
    employeeId: `EMP-${1000 + i + 1}`,
    fullName: emp.name,
    name: emp.name,
    role: (emp.role as any) || 'Cashier',
    jobTitle: emp.role || 'Cashier',
    email: emp.email,
    phone: emp.phone,
    salary: Number(emp.salary) || 500,
    status: 'active',
    employmentStatus: 'Active',
    hireDate: new Date().toISOString().split('T')[0],
    branch: branchName,
    department: 'Operations',
    gender: 'Male',
    nationality: 'Somali',
    nationalIdOrPassport: `NID-${88390 + i}`,
    address: `${branchName}, House #${10 + i}`,
    dateOfBirth: '1992-04-12',
    emergencyContact: {
      name: 'Emergency Contact',
      relationship: 'Family',
      phone: emp.phone || '+252 61 000 0000'
    },
    createdAt: new Date().toISOString()
  }));

  // Add Admin to employees list if missing
  if (setupData.admin?.name && !employees.some(e => e.email === setupData.admin.email)) {
    employees.unshift({
      id: `emp_admin_1`,
      employeeId: `EMP-1000`,
      fullName: setupData.admin.name,
      name: setupData.admin.name,
      role: 'Manager' as any,
      jobTitle: setupData.admin.role || 'General Manager',
      email: setupData.admin.email,
      phone: setupData.admin.phone || '+252 61 000 0000',
      salary: 1500,
      status: 'active',
      employmentStatus: 'Active',
      hireDate: new Date().toISOString().split('T')[0],
      branch: branchName,
      department: 'Management',
      gender: 'Male',
      nationality: 'Somali',
      nationalIdOrPassport: 'NID-10000',
      address: `${branchName}, Executive Office`,
      dateOfBirth: '1988-01-01',
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: setupData.admin.phone || '+252 61 000 0000'
      },
      createdAt: new Date().toISOString()
    });
  }

  // 4. Map Suppliers
  const suppliers: Supplier[] = (setupData.suppliers || []).map((sup, i) => ({
    id: `sup_wizard_${i + 1}`,
    name: sup.name,
    contactPerson: sup.contactName || sup.name,
    phone: sup.phone,
    itemsSupplied: sup.category || 'General Supplies',
    pendingAmount: 0,
    overdueAmount: 0
  }));

  // 5. Map Customers (Auto-populated if empty so no module is left empty)
  const defaultCustomers: Customer[] = [
    {
      id: 'cust_wizard_1',
      fullName: 'Amina Sheikh Duale',
      name: 'Amina Sheikh Duale',
      phone: '+252 61 555 7788',
      email: 'amina.duale@example.so',
      gender: 'female',
      dateOfBirth: '1990-05-14',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      preferredLanguage: 'so',
      address: 'KM4 Hodan District, House #42',
      city: setupData.branch?.city || 'Mogadishu',
      notes: 'Prefers mild spices in Suqaar and extra cardamom in Shaah.',
      registrationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastOrderDate: new Date().toISOString(),
      status: 'vip',
      membershipLevel: 'Gold',
      totalOrders: 18,
      totalSpending: 640.50,
      totalSpent: 640.50,
      averageOrderValue: 35.58,
      cancelledOrders: 0,
      refundHistoryCount: 0
    },
    {
      id: 'cust_wizard_2',
      fullName: 'Hassan Ali Al-Mansoor',
      name: 'Hassan Ali Al-Mansoor',
      phone: '+252 61 888 2211',
      email: 'hassan.mansoor@example.com',
      gender: 'male',
      dateOfBirth: '1985-11-20',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      preferredLanguage: 'ar',
      address: 'Central Market, Block B',
      city: setupData.branch?.city || 'Mogadishu',
      notes: 'Frequent corporate diner. Requests Mandi lamb on weekends.',
      registrationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastOrderDate: new Date().toISOString(),
      status: 'active',
      membershipLevel: 'Silver',
      totalOrders: 12,
      totalSpending: 420.00,
      totalSpent: 420.00,
      averageOrderValue: 35.00,
      cancelledOrders: 0,
      refundHistoryCount: 0
    }
  ];
  const customers: Customer[] = (setupData as any).customers?.length
    ? (setupData as any).customers
    : defaultCustomers;

  // 6. Map Recipes
  const recipes = (setupData.recipes || []).map((r, i) => ({
    id: `rec_wizard_${i + 1}`,
    productId: r.productId || products[i]?.id || `prod_wizard_${i + 1}`,
    productName: r.productName || products[i]?.name || 'Menu Item',
    ingredients: r.ingredients || [],
    yieldQuantity: 1,
    isActive: true,
    version: 1,
    createdAt: new Date().toISOString()
  }));

  // 7. Map Taxes
  const taxes = setupData.tax || {
    taxName: 'Standard Restaurant Sales Tax',
    taxRate: 0.05,
    serviceCharge: 0,
    trnNumber: 'TRN-100293',
    isInclusive: false
  };

  // 8. Map Payment Methods
  const payments = setupData.payments || {
    cashEnabled: true,
    cardEnabled: true,
    evcPlusEnabled: true,
    zaadEnabled: true,
    sahalEnabled: true,
    eDahabEnabled: true,
    paypalEnabled: false,
    bankTransferEnabled: true,
    defaultPosMethod: 'cash'
  };

  // 9. Map User Records
  const users = employees.map(emp => ({
    uid: `user_${emp.id}`,
    email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@restaurant.com`,
    displayName: emp.name,
    role: emp.role || 'Employee',
    phoneNumber: emp.phone || '+252 61 000 0000',
    securityPin: '1234',
    status: 'active',
    branch: branchName
  }));

  // 10. Map Branches
  const branches = [
    {
      id: branchCode,
      branchName: branchName,
      name: branchName,
      code: branchCode,
      city: setupData.branch?.city || 'Mogadishu',
      address: setupData.branch?.address || 'City Center',
      managerName: setupData.branch?.managerName || setupData.admin?.name || 'General Manager',
      managerPhone: setupData.branch?.managerPhone || setupData.admin?.phone || '+252 61 000 0000',
      tableCount: Number(setupData.branch?.tableCount) || 20,
      isPrimary: true,
      status: 'active',
      isHeadOffice: true,
      hierarchyType: 'flagship',
      activeTables: 4,
      maxTables: Number(setupData.branch?.tableCount) || 20,
      occupancyRate: 20,
      dailySales: 850,
      activeOrders: 2,
      createdAt: new Date().toISOString()
    }
  ];

  // Generate Initial Orders if products are available
  const sampleProduct1 = products[0] || { id: 'prod_1', name: 'Camel Milk Latte', price: 3.5, cost: 1.2 };
  const sampleProduct2 = products[1] || { id: 'prod_2', name: 'Somali Rice & Meat', price: 8.0, cost: 3.5 };

  const orders: Order[] = [
    {
      id: 'ord_wizard_101',
      orderNumber: 'ORD-1001',
      customerName: customers[0]?.fullName || 'Amina Sheikh Duale',
      customerPhone: customers[0]?.phone || '+252 61 555 7788',
      employeeId: employees[0]?.id || 'emp_wizard_1',
      employeeName: employees[0]?.name || 'Cashier',
      orderType: 'dine_in',
      tableNumber: 'Table 3',
      items: [
        {
          productId: sampleProduct1.id,
          productName: sampleProduct1.name,
          quantity: 2,
          unitPrice: sampleProduct1.price,
          unitCost: sampleProduct1.cost,
          totalPrice: sampleProduct1.price * 2
        },
        {
          productId: sampleProduct2.id,
          productName: sampleProduct2.name,
          quantity: 1,
          unitPrice: sampleProduct2.price,
          unitCost: sampleProduct2.cost,
          totalPrice: sampleProduct2.price
        }
      ],
      subtotal: sampleProduct1.price * 2 + sampleProduct2.price,
      discountAmount: 0,
      tax: 0,
      totalAmount: sampleProduct1.price * 2 + sampleProduct2.price,
      cogs: sampleProduct1.cost * 2 + sampleProduct2.cost,
      profit: (sampleProduct1.price - sampleProduct1.cost) * 2 + (sampleProduct2.price - sampleProduct2.cost),
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'completed',
      branch: branchName,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    {
      id: 'ord_wizard_102',
      orderNumber: 'ORD-1002',
      customerName: customers[1]?.fullName || 'Hassan Ali Al-Mansoor',
      customerPhone: customers[1]?.phone || '+252 61 888 2211',
      employeeId: employees[0]?.id || 'emp_wizard_1',
      employeeName: employees[0]?.name || 'Cashier',
      orderType: 'takeaway',
      items: [
        {
          productId: sampleProduct2.id,
          productName: sampleProduct2.name,
          quantity: 2,
          unitPrice: sampleProduct2.price,
          unitCost: sampleProduct2.cost,
          totalPrice: sampleProduct2.price * 2
        }
      ],
      subtotal: sampleProduct2.price * 2,
      discountAmount: 0,
      tax: 0,
      totalAmount: sampleProduct2.price * 2,
      cogs: sampleProduct2.cost * 2,
      profit: (sampleProduct2.price - sampleProduct2.cost) * 2,
      paymentMethod: 'mobile_money',
      paymentStatus: 'paid',
      status: 'in_preparation',
      branch: branchName,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  // Initial Purchases
  const purchases: Purchase[] = [
    {
      id: 'pur_wizard_1',
      supplierId: suppliers[0]?.id || 'sup_wizard_1',
      supplierName: suppliers[0]?.name || 'Primary Supplier',
      itemName: ingredients[0]?.name || 'Raw Meat & Fresh Milk Stock',
      quantity: 50,
      unit: ingredients[0]?.unit || 'kg',
      unitPrice: ingredients[0]?.costPerUnit || 3.0,
      totalCost: (ingredients[0]?.costPerUnit || 3.0) * 50,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  // Initial Expenses
  const expenses: Expense[] = [
    {
      id: 'exp_wizard_1',
      title: 'Branch Utility & Electricity',
      amount: 150,
      category: 'utilities',
      description: 'Electricity bill for primary branch',
      createdBy: setupData.admin?.name || 'Admin',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  // Initial Salaries
  const salaries: SalaryPayment[] = (employees || []).map((emp, i) => ({
    id: `sal_wizard_${i + 1}`,
    employeeId: emp.id,
    employeeName: emp.name,
    amount: emp.salary,
    period: 'Current Month',
    status: 'paid',
    paidDate: new Date(Date.now() - 86400000 * 5).toISOString()
  }));

  const systemConfig = {
    restaurant: setupData.restaurant,
    tax: setupData.tax,
    payments: setupData.payments,
    isInitialSetupCompleted: true,
    setupCompletedAt: new Date().toISOString()
  };

  return {
    products,
    ingredients,
    employees,
    suppliers,
    customers,
    recipes,
    branches,
    orders,
    expenses,
    purchases,
    salaries,
    taxes,
    payments,
    users,
    systemConfig,
    isInitialSetupCompleted: true
  };
}

export function saveSetupDataToLocalStorage(setupData: InitialSetupData): LocalStorageState {
  const parsed = parseSetupWizardData(setupData);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETUP_COMPLETED, 'true');
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETUP_DATA, JSON.stringify(setupData));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
    localStorage.setItem(LOCAL_STORAGE_KEYS.INGREDIENTS, JSON.stringify(parsed.ingredients));
    localStorage.setItem(LOCAL_STORAGE_KEYS.EMPLOYEES, JSON.stringify(parsed.employees));
    localStorage.setItem(LOCAL_STORAGE_KEYS.SUPPLIERS, JSON.stringify(parsed.suppliers));
    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.customers));
    localStorage.setItem(LOCAL_STORAGE_KEYS.RECIPES, JSON.stringify(parsed.recipes));
    localStorage.setItem(LOCAL_STORAGE_KEYS.BRANCHES, JSON.stringify(parsed.branches));
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(parsed.orders));
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXPENSES, JSON.stringify(parsed.expenses));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PURCHASES, JSON.stringify(parsed.purchases));
    localStorage.setItem(LOCAL_STORAGE_KEYS.SALARIES, JSON.stringify(parsed.salaries));
    localStorage.setItem(LOCAL_STORAGE_KEYS.TAXES, JSON.stringify(parsed.taxes));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PAYMENTS, JSON.stringify(parsed.payments));
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
    localStorage.setItem(LOCAL_STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(parsed.systemConfig));

    if (setupData.admin) {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.ACTIVE_USER,
        JSON.stringify({
          uid: 'user_admin_active',
          email: setupData.admin.email,
          displayName: setupData.admin.name,
          role: setupData.admin.role || 'Admin',
          phoneNumber: setupData.admin.phone,
          securityPin: setupData.admin.pin || '1234',
          branch: setupData.branch?.name || 'Main Flagship Branch'
        })
      );
    }
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  return parsed;
}

export function getLocalStorageState(): LocalStorageState {
  const isCompleted = localStorage.getItem(LOCAL_STORAGE_KEYS.SETUP_COMPLETED) === 'true';

  const readItem = <T>(key: string, defaultValue: T): T => {
    try {
      const val = localStorage.getItem(key);
      if (val) return JSON.parse(val);
    } catch (e) {}
    return defaultValue;
  };

  const products = readItem<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, []);
  const ingredients = readItem<Ingredient[]>(LOCAL_STORAGE_KEYS.INGREDIENTS, []);
  const employees = readItem<Employee[]>(LOCAL_STORAGE_KEYS.EMPLOYEES, []);
  const suppliers = readItem<Supplier[]>(LOCAL_STORAGE_KEYS.SUPPLIERS, []);
  const customers = readItem<Customer[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
  const recipes = readItem<any[]>(LOCAL_STORAGE_KEYS.RECIPES, []);
  const branches = readItem<any[]>(LOCAL_STORAGE_KEYS.BRANCHES, []);
  const orders = readItem<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const expenses = readItem<Expense[]>(LOCAL_STORAGE_KEYS.EXPENSES, []);
  const purchases = readItem<Purchase[]>(LOCAL_STORAGE_KEYS.PURCHASES, []);
  const salaries = readItem<SalaryPayment[]>(LOCAL_STORAGE_KEYS.SALARIES, []);
  const taxes = readItem<any>(LOCAL_STORAGE_KEYS.TAXES, null);
  const payments = readItem<any>(LOCAL_STORAGE_KEYS.PAYMENTS, null);
  const users = readItem<any[]>(LOCAL_STORAGE_KEYS.USERS, []);
  const systemConfig = readItem<any>(LOCAL_STORAGE_KEYS.SYSTEM_CONFIG, null);

  // If setup was completed, but individual keys are empty, try parsing setupData
  if (isCompleted && (products.length === 0 || customers.length === 0 || employees.length === 0)) {
    try {
      const rawSetup = localStorage.getItem(LOCAL_STORAGE_KEYS.SETUP_DATA);
      if (rawSetup) {
        const setupObj = JSON.parse(rawSetup);
        return saveSetupDataToLocalStorage(setupObj);
      }
    } catch (e) {}
  }

  return {
    products,
    ingredients,
    employees,
    suppliers,
    customers,
    recipes,
    branches,
    orders,
    expenses,
    purchases,
    salaries,
    taxes,
    payments,
    users,
    systemConfig,
    isInitialSetupCompleted: isCompleted
  };
}
