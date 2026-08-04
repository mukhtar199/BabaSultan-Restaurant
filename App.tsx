import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  db,
  COLLECTIONS,
  seedInitialFirestoreData,
  addExpenseFirestore,
  addPurchaseFirestore,
  addSalaryFirestore,
  recordInventoryMovementFirestore,
  updateProductStockFirestore,
  addRefundFirestore,
  addBankTransactionFirestore
} from './lib/firebase';
import {
  Order,
  Product,
  Ingredient,
  Expense,
  Purchase,
  Employee,
  SalaryPayment,
  Supplier,
  InventoryMovement,
  CustomerRefund,
  BankTransaction,
  FinancialAccount
} from './types';

// Auth & Foundation Architecture
import { AuthProvider, useAuth } from './presentation/context/AuthContext';
import { Layout } from './presentation/layout/Layout';
import { ProtectedRoute } from './presentation/components/common/ProtectedRoute';
import { RoleGuard } from './presentation/components/common/RoleGuard';
import { handleFirestoreError, OperationType } from './infrastructure/firebase/errorHandler';

// Phase 2 Auth Components
import { UserManagementView } from './presentation/components/auth/UserManagementView';
import { ProfilePage } from './presentation/components/auth/ProfilePage';
import { RolePermissionsView } from './presentation/components/auth/RolePermissionsView';

// Phase 4 Product Management Components
import { ProductManagementView } from './presentation/components/products/ProductManagementView';

// Modules & Views
import { DashboardView } from './presentation/components/DashboardView';
import { POSView } from './presentation/components/POSView';
import { OrdersView } from './presentation/components/OrdersView';
import { InventoryView } from './presentation/components/InventoryView';
import { InventoryManagementSystem } from './presentation/components/inventory/InventoryManagementSystem';
import { RecipeEngineMainView } from './presentation/components/recipe/RecipeEngineMainView';
import { CustomerManagementView } from './presentation/components/crm/CustomerManagementView';
import { FinancialsView } from './presentation/components/FinancialsView';
import { AccountingManagementView } from './presentation/components/accounting/AccountingManagementView';
import { StaffAndSuppliersView } from './presentation/components/StaffAndSuppliersView';
import { HRMManagementView } from './presentation/components/hrm/HRMManagementView';
import { ReportsView } from './presentation/components/ReportsView';
import { AdminPanelView } from './presentation/components/AdminPanelView';
import { BranchManagementView } from './presentation/components/branch/BranchManagementView';
import { DeliveryManagementView } from './presentation/components/delivery/DeliveryManagementView';
import { SystemSettingsView } from './presentation/components/SystemSettingsView';
import { AIBusinessPlatformView } from './presentation/components/AIBusinessPlatformView';
import { AIFinancialAdvisorView } from './components/AIFinancialAdvisorView';
import { AIOperationsManagerView } from './components/AIOperationsManagerView';
import { AICEOView } from './components/AICEOView';
import { AIAssistantModal } from './components/AIAssistantModal';

import { Bot, Sparkles, Database, CheckCircle2, ShieldCheck } from 'lucide-react';

function ERPAppContent() {
  const { language, t } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  // Live Firestore State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [refunds, setRefunds] = useState<CustomerRefund[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  // 1. Subscribe to Firestore Collections in Real-Time
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, COLLECTIONS.ORDERS), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ORDERS));

    const unsubProducts = onSnapshot(collection(db, COLLECTIONS.PRODUCTS), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PRODUCTS));

    const unsubIngredients = onSnapshot(collection(db, COLLECTIONS.INGREDIENTS), (snapshot) => {
      setIngredients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.INGREDIENTS));

    const unsubExpenses = onSnapshot(collection(db, COLLECTIONS.EXPENSES), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setExpenses(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.EXPENSES));

    const unsubPurchases = onSnapshot(collection(db, COLLECTIONS.PURCHASES), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPurchases(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PURCHASES));

    const unsubEmployees = onSnapshot(collection(db, COLLECTIONS.EMPLOYEES), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.EMPLOYEES));

    const unsubSalaries = onSnapshot(collection(db, COLLECTIONS.SALARIES), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalaryPayment));
      docs.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
      setSalaries(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.SALARIES));

    const unsubSuppliers = onSnapshot(collection(db, COLLECTIONS.SUPPLIERS), (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.SUPPLIERS));

    const unsubMovements = onSnapshot(collection(db, COLLECTIONS.MOVEMENTS), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryMovement));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMovements(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.MOVEMENTS));

    const unsubRefunds = onSnapshot(collection(db, COLLECTIONS.REFUNDS), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerRefund));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRefunds(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.REFUNDS));

    const unsubBankTx = onSnapshot(collection(db, COLLECTIONS.BANK_TRANSACTIONS), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankTransaction));
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBankTransactions(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BANK_TRANSACTIONS));

    const unsubAccounts = onSnapshot(collection(db, COLLECTIONS.ACCOUNTS), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ACCOUNTS));

    return () => {
      unsubOrders();
      unsubProducts();
      unsubIngredients();
      unsubExpenses();
      unsubPurchases();
      unsubEmployees();
      unsubSalaries();
      unsubSuppliers();
      unsubMovements();
      unsubRefunds();
      unsubBankTx();
      unsubAccounts();
    };
  }, []);

  // Seed Data Handler
  const handleSeedData = async () => {
    try {
      await seedInitialFirestoreData();
      setSeedSuccessMsg('Firestore database populated with realistic restaurant ERP operational records!');
      setTimeout(() => setSeedSuccessMsg(null), 5000);
    } catch (e: any) {
      alert(`Error seeding Firestore: ${e.message}`);
    }
  };

  // AI Assistant Automated Action Handler
  const handleExecuteAIAction = async (actionType: string, payload: any) => {
    switch (actionType) {
      case 'ADD_EXPENSE':
        await addExpenseFirestore({
          title: payload.title || 'AI Logged Expense',
          amount: Number(payload.amount) || 0,
          category: payload.category || 'other',
          description: payload.description || 'Logged via AI Assistant',
          createdBy: 'AI Manager'
        });
        break;

      case 'REGISTER_PURCHASE':
        await addPurchaseFirestore({
          supplierId: payload.supplierId || 'sup_1',
          supplierName: payload.supplierName || 'Supplier',
          itemName: payload.itemName || 'Raw Supplies',
          quantity: Number(payload.quantity) || 1,
          unit: payload.unit || 'kg',
          unitPrice: Number(payload.unitPrice) || 0,
          totalCost: Number(payload.totalCost) || 0,
          status: payload.status || 'completed'
        });
        break;

      case 'REGISTER_SALARY':
        await addSalaryFirestore({
          employeeId: payload.employeeId || `emp_${Date.now()}`,
          employeeName: payload.employeeName || 'Employee',
          amount: Number(payload.amount) || 0,
          period: payload.period || 'Current Month',
          status: 'paid'
        });
        break;

      case 'RECORD_MOVEMENT':
        await recordInventoryMovementFirestore({
          type: payload.type || 'adjustment',
          itemType: payload.itemType || 'ingredient',
          itemId: payload.itemId || 'item_1',
          itemName: payload.itemName || 'Inventory Item',
          quantity: Number(payload.quantity) || 1,
          reason: payload.reason || 'AI Inventory Adjustment',
          createdBy: 'AI Manager'
        });
        break;

      case 'UPDATE_STOCK':
        if (payload.productId) {
          await updateProductStockFirestore(payload.productId, Number(payload.newStock) || 0);
        }
        break;

      case 'RECORD_REFUND':
        await addRefundFirestore({
          orderId: payload.orderId || 'ord_1',
          amount: Number(payload.amount) || 0,
          reason: payload.reason || 'Customer refund',
          customerName: payload.customerName || 'Customer',
          createdBy: 'AI Manager'
        });
        break;

      case 'RECORD_BANK_TRANSACTION':
        await addBankTransactionFirestore({
          accountName: payload.accountName || 'Primary Operating Account',
          type: payload.type || 'deposit',
          amount: Number(payload.amount) || 0,
          description: payload.description || 'Bank transaction',
          referenceNumber: payload.referenceNumber || `TX-${Date.now()}`,
          createdBy: 'AI Manager'
        });
        break;

      default:
        console.log('Action type not recognized:', actionType);
    }
  };

  const firestoreStateBundle = {
    orders,
    products,
    ingredients,
    expenses,
    purchases,
    employees,
    salaries,
    suppliers,
    inventory_movements: movements,
    refunds,
    bank_transactions: bankTransactions,
    accounts
  };

  return (
    <ProtectedRoute>
      <Layout currentView={currentView} onSelectView={setCurrentView}>
        {/* Seed Success Toast */}
        {seedSuccessMsg && (
          <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-lg mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{seedSuccessMsg}</span>
            </div>
          </div>
        )}

        {/* Auto Seed Prompt if database is empty */}
        {products.length === 0 && orders.length === 0 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center shadow-xl mb-6">
            <Database className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-1">Firestore Database Connected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Your Firebase Firestore database is initialized. Click below to populate sample restaurant records for testing.
            </p>
            <button
              onClick={handleSeedData}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Seed Commercial ERP Sample Data
            </button>
          </div>
        )}

        {/* View Router */}
        {currentView === 'dashboard' && (
          <DashboardView
            orders={orders}
            products={products}
            ingredients={ingredients}
            expenses={expenses}
            purchases={purchases}
            employees={employees}
            salaries={salaries}
            suppliers={suppliers}
            movements={movements}
            refunds={refunds}
            bankTransactions={bankTransactions}
            accounts={accounts}
            onNavigateToTab={(v) => setCurrentView(v)}
            onOpenAIQuery={() => setIsAIAssistantOpen(true)}
          />
        )}

        {currentView === 'products' && (
          <ProductManagementView />
        )}

        {currentView === 'admin' && (
          <RoleGuard permissionKey="canAccessAdminPanel">
            <AdminPanelView
              products={products}
              orders={orders}
              expenses={expenses}
              employees={employees}
              suppliers={suppliers}
              ingredients={ingredients}
            />
          </RoleGuard>
        )}

        {currentView === 'users' && (
          <RoleGuard permissionKey="canManageUsers">
            <UserManagementView />
          </RoleGuard>
        )}

        {currentView === 'profile' && (
          <ProfilePage />
        )}

        {currentView === 'roleMatrix' && (
          <RolePermissionsView />
        )}

        {currentView === 'branches' && (
          <BranchManagementView
            initialOrders={orders}
            initialExpenses={expenses}
            initialEmployees={employees}
            initialIngredients={ingredients}
            initialProducts={products}
            initialCustomers={[]}
            language={language === 'ar' ? 'ar' : language === 'so' ? 'so' : 'en'}
          />
        )}

        {currentView === 'delivery' && (
          <DeliveryManagementView
            language={language === 'ar' ? 'ar' : language === 'so' ? 'so' : 'en'}
          />
        )}

        {currentView === 'pos' && (
          <RoleGuard permissionKey="canAccessPOS">
            <POSView products={products} onOrderCompleted={() => setCurrentView('orders')} />
          </RoleGuard>
        )}

        {currentView === 'orders' && (
          <OrdersView orders={orders} />
        )}

        {currentView === 'kitchen' && (
          <RoleGuard permissionKey="canAccessKitchen">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Kitchen Display System (KDS)</h2>
                  <p className="text-xs text-slate-400">Live order queue for line chefs and station prep</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                  ACTIVE QUEUE: {orders.filter(o => o.status === 'in_preparation' || o.status === 'pending').length}
                </span>
              </div>
              <OrdersView orders={orders.filter(o => o.status === 'in_preparation' || o.status === 'pending' || o.status === 'ready_for_pickup')} />
            </div>
          </RoleGuard>
        )}

        {currentView === 'recipeEngine' && (
          <RecipeEngineMainView
            products={products}
            defaultLang={language === 'ar' ? 'ar' : language === 'so' ? 'so' : 'en'}
          />
        )}

        {currentView === 'inventory' && (
          <RoleGuard permissionKey="canAccessInventory">
            <InventoryManagementSystem />
          </RoleGuard>
        )}

        {currentView === 'customers' && (
          <RoleGuard permissionKey="canAccessCustomers">
            <CustomerManagementView />
          </RoleGuard>
        )}

        {currentView === 'financials' && (
          <RoleGuard permissionKey="canAccessFinancials">
            <AccountingManagementView />
          </RoleGuard>
        )}

        {currentView === 'staff' && (
          <RoleGuard permissionKey="canAccessStaff">
            <HRMManagementView />
          </RoleGuard>
        )}

        {currentView === 'reports' && (
          <RoleGuard permissionKey="canAccessReports">
            <ReportsView
              orders={orders}
              products={products}
              ingredients={ingredients}
              expenses={expenses}
              employees={employees}
              suppliers={suppliers}
              purchases={purchases}
            />
          </RoleGuard>
        )}

        {currentView === 'ai-advisor' && (
          <RoleGuard permissionKey="canAccessAIAdvisor">
            <AIBusinessPlatformView
              initialOrders={orders}
              initialProducts={products}
              initialIngredients={ingredients}
              initialExpenses={expenses}
              initialEmployees={employees}
              initialSuppliers={suppliers}
              initialPurchases={purchases}
              language={language === 'ar' ? 'ar' : language === 'so' ? 'so' : 'en'}
            />
          </RoleGuard>
        )}

        {currentView === 'ai-operations' && (
          <RoleGuard permissionKey="canAccessAIAdvisor">
            <AIOperationsManagerView language={language} />
          </RoleGuard>
        )}

        {currentView === 'ai-ceo' && (
          <RoleGuard permissionKey="canAccessAIAdvisor">
            <AICEOView language={language} />
          </RoleGuard>
        )}

        {currentView === 'settings' && (
          <RoleGuard permissionKey="canManageBranchSettings">
            <SystemSettingsView language={language} />
          </RoleGuard>
        )}

        {/* Floating AI Assistant Trigger */}
        <button
          onClick={() => setIsAIAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold p-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-2 border border-emerald-300/40 cursor-pointer"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="hidden sm:inline text-sm">
            {language === 'ar' ? 'مساعد الذكاء الاصطناعي' : language === 'so' ? 'Garaadka AI CEO' : 'Ask AI Manager'}
          </span>
          <Sparkles className="w-4 h-4 text-slate-950" />
        </button>

        {/* AI Assistant Modal */}
        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          language={language}
          firestoreData={firestoreStateBundle}
          onExecuteAction={handleExecuteAIAction}
        />
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ERPAppContent />
    </AuthProvider>
  );
}
