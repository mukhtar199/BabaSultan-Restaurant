import React, { useState } from 'react';
import { Expense, Purchase, SalaryPayment, Supplier } from '../types';
import { DollarSign, AlertCircle, PlusCircle, CreditCard, Receipt, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../lib/reports';

interface FinancialsViewProps {
  expenses: Expense[];
  purchases: Purchase[];
  salaries: SalaryPayment[];
  suppliers: Supplier[];
  onAddExpense: (data: any) => Promise<void>;
  onAddPurchase: (data: any) => Promise<void>;
  onAddSalary: (data: any) => Promise<void>;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({
  expenses,
  purchases,
  salaries,
  suppliers,
  onAddExpense,
  onAddPurchase,
  onAddSalary
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'purchases' | 'salaries'>('expenses');

  // New Purchase Form
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState(suppliers[0]?.id || '');
  const [purchaseStatus, setPurchaseStatus] = useState<'completed' | 'pending' | 'overdue'>('completed');

  // New Salary Form
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryEmpName, setSalaryEmpName] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('July 2026');

  // Calculate totals
  const totalExpensesAmount = expenses.reduce((a, b) => a + b.amount, 0);
  const totalPurchasesAmount = purchases.reduce((a, b) => a + b.totalCost, 0);
  const totalSalariesAmount = salaries.reduce((a, b) => a + b.amount, 0);

  // Abnormal Expense Anomaly Detector
  const avgExpense = expenses.length > 0 ? totalExpensesAmount / expenses.length : 0;
  const abnormalExpenses = expenses.filter(e => e.amount > Math.max(250, avgExpense * 2));

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === purchaseSupplier) || suppliers[0];
    const qty = parseFloat(purchaseQty) || 1;
    const price = parseFloat(purchaseUnitPrice) || 0;
    const totalCost = qty * price;

    await onAddPurchase({
      supplierId: sup?.id || 'sup_1',
      supplierName: sup?.name || 'Local Supplier',
      itemName: purchaseItem,
      quantity: qty,
      unit: 'kg',
      unitPrice: price,
      totalCost,
      status: purchaseStatus
    });

    setPurchaseItem('');
    setPurchaseQty('');
    setPurchaseUnitPrice('');
    setShowPurchaseModal(false);
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddSalary({
      employeeId: `emp_${Date.now()}`,
      employeeName: salaryEmpName,
      amount: parseFloat(salaryAmount),
      period: salaryPeriod,
      status: 'paid'
    });
    setSalaryEmpName('');
    setSalaryAmount('');
    setShowSalaryModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Financials & Expense Accounting
          </h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of expenses, supplier invoices, and staff payroll
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'expenses' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses (${totalExpensesAmount.toFixed(0)})
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'purchases' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchases (${totalPurchasesAmount.toFixed(0)})
            </button>
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'salaries' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Salaries (${totalSalariesAmount.toFixed(0)})
            </button>
          </div>
        </div>
      </div>

      {/* Abnormal Expense Anomaly Detector Box */}
      {abnormalExpenses.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-300">Abnormal Expense Anomaly Detected by AI</h3>
            <p className="text-xs text-rose-200/80 mt-1">
              Outlier expense detected: <strong>{abnormalExpenses.map(e => `${e.title} ($${e.amount})`).join(', ')}</strong> is significantly higher than average routine expenses.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Quick Accounting Actions</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Register Purchase
          </button>
          <button
            onClick={() => setShowSalaryModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Register Salary
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Expense Title</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Amount ($)</th>
                  <th className="py-4 px-6">Logged By</th>
                  <th className="py-4 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{ex.title}</td>
                    <td className="py-4 px-6 text-xs text-slate-400 uppercase font-mono">{ex.category}</td>
                    <td className="py-4 px-6 font-bold text-rose-400">${ex.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-xs text-slate-300">{ex.createdBy}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(ex.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      {activeTab === 'purchases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Supplier</th>
                  <th className="py-4 px-6">Item Purchased</th>
                  <th className="py-4 px-6">Quantity</th>
                  <th className="py-4 px-6">Total Cost</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{p.supplierName}</td>
                    <td className="py-4 px-6 text-slate-300">{p.itemName}</td>
                    <td className="py-4 px-6">{p.quantity} {p.unit}</td>
                    <td className="py-4 px-6 font-bold text-white">${p.totalCost.toFixed(2)}</td>
                    <td className="py-4 px-6 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-mono font-bold ${
                        p.status === 'overdue' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaries Table */}
      {activeTab === 'salaries' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Employee Name</th>
                  <th className="py-4 px-6">Salary Amount</th>
                  <th className="py-4 px-6">Payroll Period</th>
                  <th className="py-4 px-6">Payment Status</th>
                  <th className="py-4 px-6">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salaries.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{s.employeeName}</td>
                    <td className="py-4 px-6 font-bold text-emerald-400">${s.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-xs text-slate-300">{s.period}</td>
                    <td className="py-4 px-6 text-xs font-mono font-bold text-emerald-400">{s.status.toUpperCase()}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">{new Date(s.paidDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Register Supplier Purchase Order</h3>
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Supplier</label>
                <select
                  value={purchaseSupplier}
                  onChange={e => setPurchaseSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50kg Camel Meat"
                  value={purchaseItem}
                  onChange={e => setPurchaseItem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity (kg/L)</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={purchaseQty}
                    onChange={e => setPurchaseQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="11.50"
                    value={purchaseUnitPrice}
                    onChange={e => setPurchaseUnitPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Register Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Register Employee Salary Payment</h3>
            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Omar"
                  value={salaryEmpName}
                  onChange={e => setSalaryEmpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Salary Amount ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="1400"
                    value={salaryAmount}
                    onChange={e => setSalaryAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Payroll Period</label>
                  <input
                    type="text"
                    required
                    value={salaryPeriod}
                    onChange={e => setSalaryPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Save Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
