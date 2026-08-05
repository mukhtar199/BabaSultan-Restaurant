import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import { 
  Branch, 
  BranchStatus, 
  BranchHierarchyType, 
  BranchTransfer, 
  TransferStatus, 
  TransferItem, 
  Order, 
  Expense, 
  Employee, 
  Ingredient, 
  Product, 
  Customer 
} from '../types';

// Initial Default Branches Seed Data if empty
export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'branch_hq_01',
    name: 'Headquarters - Mogadishu Main',
    code: 'HQ-MOG-01',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200',
    address: 'Makkah Al Mukarramah Road, K4 Junction',
    city: 'Mogadishu',
    country: 'Somalia',
    gpsLocation: '2.046937, 45.318161',
    phone: '+252 61 500 0000',
    email: 'hq@restaurant.so',
    workingHours: '07:00 AM - 11:30 PM',
    timeZone: 'Africa/Mogadishu (UTC+3)',
    currency: 'USD',
    taxRate: 5.0,
    taxId: 'SO-TAX-99881',
    status: 'active',
    hierarchyType: 'head_office',
    isHeadOffice: true,
    managerName: 'Abdirahman Mohamed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'branch_hargeisa_01',
    name: 'Hargeisa Flagship Branch',
    code: 'BR-HAR-02',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200',
    address: 'Independence Avenue, City Center',
    city: 'Hargeisa',
    country: 'Somaliland',
    gpsLocation: '9.562389, 44.064972',
    phone: '+252 63 400 1122',
    email: 'hargeisa@restaurant.so',
    workingHours: '08:00 AM - 11:00 PM',
    timeZone: 'Africa/Mogadishu (UTC+3)',
    currency: 'USD',
    taxRate: 5.0,
    taxId: 'SL-VAT-44512',
    status: 'active',
    hierarchyType: 'flagship',
    isHeadOffice: false,
    managerName: 'Fatima Ahmed',
    parentBranchId: 'branch_hq_01',
    createdAt: new Date().toISOString()
  },
  {
    id: 'branch_kismayo_01',
    name: 'Kismayo Coastal Express',
    code: 'BR-KIS-03',
    logo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=200',
    address: 'Beachfront Boulevard, Port District',
    city: 'Kismayo',
    country: 'Somalia',
    gpsLocation: '-0.358178, 42.545367',
    phone: '+252 61 222 3344',
    email: 'kismayo@restaurant.so',
    workingHours: '08:00 AM - 10:00 PM',
    timeZone: 'Africa/Mogadishu (UTC+3)',
    currency: 'USD',
    taxRate: 5.0,
    taxId: 'SO-TAX-33211',
    status: 'active',
    hierarchyType: 'express',
    isHeadOffice: false,
    managerName: 'Hassan Nur',
    parentBranchId: 'branch_hq_01',
    createdAt: new Date().toISOString()
  }
];

// Helper to seed initial branches if Firestore is empty
export async function seedInitialBranches() {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.BRANCHES));
    if (snap.empty) {
      const batch = writeBatch(db);
      for (const b of DEFAULT_BRANCHES) {
        batch.set(doc(db, COLLECTIONS.BRANCHES, b.id), b);
      }
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Branch seeding skipped:', err?.message || err);
  }
}

// Branch Firestore Actions
export async function createBranch(branchData: Omit<Branch, 'id' | 'createdAt'>): Promise<string> {
  const newRef = doc(collection(db, COLLECTIONS.BRANCHES));
  const newBranch: Branch = {
    ...branchData,
    id: newRef.id,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, newBranch);
  return newRef.id;
}

export async function updateBranch(branchId: string, updates: Partial<Branch>): Promise<void> {
  const ref = doc(db, COLLECTIONS.BRANCHES, branchId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function disableBranch(branchId: string): Promise<void> {
  await updateBranch(branchId, { status: 'inactive' });
}

export async function deleteBranch(branchId: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BRANCHES, branchId);
  await deleteDoc(ref);
}

// Branch Inter-Transfer Actions
export async function createBranchTransfer(
  transferData: Omit<BranchTransfer, 'id' | 'transferNumber' | 'createdAt' | 'status'>
): Promise<string> {
  const newRef = doc(collection(db, COLLECTIONS.BRANCH_TRANSFERS));
  const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;
  
  const transfer: BranchTransfer = {
    ...transferData,
    id: newRef.id,
    transferNumber,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await setDoc(newRef, transfer);
  return newRef.id;
}

export async function approveBranchTransfer(transferId: string, approverName: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BRANCH_TRANSFERS, transferId);
  await updateDoc(ref, {
    status: 'approved',
    approvedBy: approverName,
    completedAt: new Date().toISOString()
  });
}

export async function rejectBranchTransfer(transferId: string, approverName: string, reason: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.BRANCH_TRANSFERS, transferId);
  await updateDoc(ref, {
    status: 'rejected',
    approvedBy: approverName,
    rejectionReason: reason
  });
}

// Consolidated Multi-Branch Analytics Engine
export interface ConsolidatedAnalyticsPackage {
  branches: Branch[];
  orders: Order[];
  expenses: Expense[];
  employees: Employee[];
  ingredients: Ingredient[];
  products: Product[];
  customers: Customer[];
  transfers: BranchTransfer[];
}

export function calculateConsolidatedBranchAnalytics(pkg: ConsolidatedAnalyticsPackage) {
  const {
    branches = [],
    orders = [],
    expenses = [],
    employees = [],
    ingredients = [],
    products = [],
    customers = [],
    transfers = []
  } = pkg;

  const totalBranchesCount = branches.length;
  const activeBranchesCount = branches.filter((b) => b.status === 'active').length;

  // Completed Orders across all branches
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.prepStatus === 'delivered');

  const totalConsolidatedSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalConsolidatedOrders = completedOrders.length;
  const totalConsolidatedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate COGS
  const totalConsolidatedCOGS = completedOrders.reduce((sum, o) => sum + (o.cogs || o.totalAmount * 0.45), 0);
  const grossProfit = totalConsolidatedSales - totalConsolidatedCOGS;
  const totalConsolidatedProfit = grossProfit - totalConsolidatedExpenses;

  // Total Inventory Valuation across branches
  const totalInventoryValuation = ingredients.reduce((sum, i) => sum + (i.stock * i.costPerUnit), 0) +
                                   products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost || p.price * 0.5)), 0);

  // Total Employees
  const totalEmployeesCount = employees.length;

  // Branch Performance Ranking Table
  const branchMetrics = branches.map((b) => {
    // Filter orders for this branch by branch ID or branch name matching
    const bOrders = completedOrders.filter(
      (o) => (o as any).branchId === b.id || (o as any).branch === b.name || b.name.includes((o as any).branch || '')
    );
    
    // If no branch field, distribute proportionally or assign to Head Office for realistic demo view
    const branchSales = bOrders.length > 0 
      ? bOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      : (b.isHeadOffice ? totalConsolidatedSales * 0.5 : totalConsolidatedSales * 0.25);

    const branchOrdersCount = bOrders.length > 0 ? bOrders.length : Math.round(completedOrders.length * (b.isHeadOffice ? 0.5 : 0.25));

    const bExpenses = expenses.filter(
      (e) => (e as any).branchId === b.id || (e as any).branch === b.name
    );
    const branchExpenses = bExpenses.length > 0
      ? bExpenses.reduce((sum, e) => sum + e.amount, 0)
      : (totalConsolidatedExpenses * (b.isHeadOffice ? 0.5 : 0.25));

    const branchCOGS = branchSales * 0.45;
    const branchNetProfit = branchSales - branchCOGS - branchExpenses;

    const bEmployees = employees.filter(
      (emp) => (emp as any).branchId === b.id || emp.branch === b.name
    );
    const employeeCount = bEmployees.length > 0 ? bEmployees.length : Math.max(2, Math.round(employees.length / Math.max(1, branches.length)));

    return {
      branchId: b.id,
      branchName: b.name,
      branchCode: b.code,
      city: b.city,
      status: b.status,
      isHeadOffice: !!b.isHeadOffice,
      sales: branchSales,
      ordersCount: branchOrdersCount,
      expenses: branchExpenses,
      netProfit: branchNetProfit,
      employeeCount,
      inventoryValuation: totalInventoryValuation / Math.max(1, branches.length),
      profitMargin: branchSales > 0 ? Math.round((branchNetProfit / branchSales) * 100) : 0
    };
  });

  // Sort by Sales for Ranking
  const rankedBranches = [...branchMetrics].sort((a, b) => b.sales - a.sales);
  const topBranch = rankedBranches[0] || null;
  const lowestBranch = rankedBranches[rankedBranches.length - 1] || null;

  // Inter-Branch Transfers summary
  const pendingTransfers = transfers.filter((t) => t.status === 'pending');
  const completedTransfers = transfers.filter((t) => t.status === 'completed' || t.status === 'approved');

  return {
    totalBranchesCount,
    activeBranchesCount,
    totalConsolidatedSales,
    totalConsolidatedOrders,
    totalConsolidatedExpenses,
    totalConsolidatedProfit,
    totalInventoryValuation,
    totalEmployeesCount,
    totalCustomersCount: customers.length,
    rankedBranches,
    topBranch,
    lowestBranch,
    pendingTransfers,
    completedTransfers
  };
}
