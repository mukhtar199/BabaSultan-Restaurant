import React, { useState } from 'react';
import { Order, Product, Ingredient, Expense, Supplier, Purchase, Language } from '../types';
import { translations } from '../lib/i18n';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Award,
  Bot,
  PlusCircle,
  FileText,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { downloadPDFReport, exportToExcel } from '../lib/reports';
import { getMogadishuDateString } from '../lib/dateUtils';

interface DashboardOverviewProps {
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  expenses: Expense[];
  suppliers: Supplier[];
  purchases: Purchase[];
  language: Language;
  onOpenAIQuery: (queryText: string) => void;
  onAddExpense: (data: any) => Promise<void>;
  onAddOrder: (data: any) => Promise<void>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  products,
  ingredients,
  expenses,
  suppliers,
  purchases,
  language,
  onOpenAIQuery,
  onAddExpense,
  onAddOrder
}) => {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // New Expense Form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'utilities' | 'supplies' | 'rent' | 'maintenance' | 'marketing' | 'other'>('utilities');
  const [expenseDesc, setExpenseDesc] = useState('');

  // New Quick Order Form state
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [orderQty, setOrderQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');

  const activeLang = language === 'auto' ? 'en' : language;
  const t = translations[activeLang];

  // 1. Calculate Today's Metrics
  const todayStr = getMogadishuDateString();

  const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const todayCogs = todayOrders.reduce((acc, o) => acc + (o.cogs || 0), 0);

  const todayExpenses = expenses.filter(e => e.createdAt && e.createdAt.startsWith(todayStr));
  const todayExpensesTotal = todayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const todayNetProfit = todayRevenue - todayCogs - todayExpensesTotal;

  // 2. Identify Top Product
  const sortedProducts = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  const topProduct = sortedProducts[0];

  // 3. Low stock count
  const lowIngredients = ingredients.filter(i => (i.stock || 0) <= (i.minStockAlert || 0));
  const lowProducts = products.filter(p => (p.stock || 0) <= (p.minStockAlert || 0));
  const totalLowStock = lowIngredients.length + lowProducts.length;

  // 4. Overdue payments
  const overduePurchases = purchases.filter(p => p.status === 'overdue');
  const totalOverdueAmount = overduePurchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    await onAddExpense({
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      description: expenseDesc,
      createdBy: 'Manager'
    });
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDesc('');
    setShowExpenseModal(false);
  };

  const handleQuickOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId) || products[0];
    if (!prod) return;

    const qty = parseInt(orderQty.toString()) || 1;
    const totalAmount = prod.price * qty;
    const cogs = prod.cost * qty;
    const profit = totalAmount - cogs;

    await onAddOrder({
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName || 'Walk-in Customer',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice: prod.price,
          unitCost: prod.cost,
          totalPrice: totalAmount
        }
      ],
      totalAmount,
      cogs,
      profit,
      employeeId: 'emp_2',
      employeeName: 'Fatima Omar',
      status: 'completed',
      paymentMethod
    });

    setCustomerName('');
    setOrderQty(1);
    setShowOrderModal(false);
  };

  const handleDownloadExecutiveReport = () => {
    downloadPDFReport(
      "Daily Restaurant Executive Report",
      `Date: ${new Date().toLocaleDateString()} | Real-Time Firestore Summary`,
      [
        {
          heading: "Financial KPI Overview",
          columns: ["Metric Name", "Amount ($USD)", "Status"],
          rows: [
            ["Today Sales Revenue", `$${(todayRevenue || 0).toFixed(2)}`, "Completed"],
            ["Cost of Goods Sold (COGS)", `$${(todayCogs || 0).toFixed(2)}`, "Deducted"],
            ["Today Operational Expenses", `$${(todayExpensesTotal || 0).toFixed(2)}`, "Deducted"],
            ["Net Profit Today", `$${(todayNetProfit || 0).toFixed(2)}`, (todayNetProfit || 0) >= 0 ? "Profitable" : "Deficit"]
          ]
        },
        {
          heading: "Low Stock Inventory Alert",
          columns: ["Item Name", "Current Stock", "Min Threshold"],
          rows: lowIngredients.map(i => [i.name, `${i.stock} ${i.unit}`, `${i.minStockAlert} ${i.unit}`])
        }
      ]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Real-time Warnings Banner */}
      {(totalLowStock > 0 || overduePurchases.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-300 text-sm">Real-Time Operational Alerts Detected</h3>
              <p className="text-xs text-amber-200/80">
                {totalLowStock > 0 && `${totalLowStock} items running low on kitchen inventory. `}
                {overduePurchases.length > 0 && `${overduePurchases.length} supplier invoices overdue ($${(totalOverdueAmount || 0).toFixed(2)}).`}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onOpenAIQuery(t.supplierReorderQuery)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition whitespace-nowrap cursor-pointer"
          >
            Ask AI Supplier Advice
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Profit Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t.todayProfit}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${(todayNetProfit || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">+Revenue: ${(todayRevenue || 0).toFixed(2)}</span>
          </p>
        </div>

        {/* Orders Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t.todayOrders}</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {todayOrders.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total Completed Orders Today
          </p>
        </div>

        {/* Expenses Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t.todayExpenses}</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${(todayExpensesTotal || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todayExpenses.length} expense entries recorded
          </p>
        </div>

        {/* Top Dish Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t.topProduct}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-base font-bold text-white truncate">
            {topProduct ? topProduct.name : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {topProduct ? `${topProduct.salesCount} Portions Sold` : 'No sales yet'}
          </p>
        </div>

      </div>

      {/* AI Daily Executive Advisory Briefing */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 relative shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Executive AI Business Advisor
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Calculated directly from live Firestore records
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onOpenAIQuery(t.profitToday)}
              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Analyze Profit Today
            </button>
            <button
              onClick={() => onOpenAIQuery(t.predictSalesQuery)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Predict Next Week's Sales
            </button>
            <button
              onClick={() => onOpenAIQuery(t.detectAbnormalExpenses)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Detect Expense Anomalies
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-3">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {t.actions.addExpense}
          </button>

          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Record Quick Food Order
          </button>

          <button
            onClick={handleDownloadExecutiveReport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            Download PDF Report
          </button>

          <button
            onClick={() => exportToExcel('Firestore_Restaurant_Orders', ['Order #', 'Total', 'Profit'], orders.map(o => [o.orderNumber, o.totalAmount, o.profit]))}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Export Excel Sheet
          </button>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Register New Expense to Firestore</h3>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator Diesel Refill"
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Amount ($USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="utilities">Utilities</option>
                    <option value="supplies">Kitchen Supplies</option>
                    <option value="rent">Rent</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Details..."
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Save to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Record Completed Food Order</h3>
            
            <form onSubmit={handleQuickOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Menu Item</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${(p.price || 0).toFixed(2)} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderQty}
                    onChange={e => setOrderQty(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit Card</option>
                    <option value="mobile_money">Mobile Money (ZAAD/Evc)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hassan Ahmed"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Complete Order & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
