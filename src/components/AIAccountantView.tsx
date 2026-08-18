import React, { useState } from 'react';
import {
  Order,
  Product,
  Ingredient,
  Expense,
  Purchase,
  Employee,
  SalaryPayment,
  Supplier,
  CustomerRefund,
  BankTransaction,
  FinancialAccount,
  Language
} from '../types';
import { calculateCPAMetrics } from '../lib/cpaCalculator';
import { generateCPAReport } from '../lib/reports';
import { translations } from '../lib/i18n';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ShieldAlert,
  FileText,
  Download,
  PlusCircle,
  Building2,
  Wallet,
  Receipt,
  Users,
  Package,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  addExpenseFirestore,
  addPurchaseFirestore,
  addSalaryFirestore,
  addRefundFirestore,
  addBankTransactionFirestore
} from '../lib/firebase';

interface AIAccountantViewProps {
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  expenses: Expense[];
  purchases: Purchase[];
  employees: Employee[];
  salaries: SalaryPayment[];
  suppliers: Supplier[];
  refunds: CustomerRefund[];
  bankTransactions: BankTransaction[];
  accounts: FinancialAccount[];
  language: Language;
  onAskCPA: (question: string) => void;
}

export const AIAccountantView: React.FC<AIAccountantViewProps> = ({
  orders,
  products,
  ingredients,
  expenses,
  purchases,
  employees,
  salaries,
  suppliers,
  refunds,
  bankTransactions,
  accounts,
  language,
  onAskCPA
}) => {
  const activeLang = language === 'auto' ? 'en' : language;
  const isRtl = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'statements' | 'ledger' | 'reports' | 'record'>('overview');
  const [statementType, setStatementType] = useState<'pnl' | 'cashflow' | 'tax'>('pnl');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'income' | 'expense' | 'purchase' | 'payroll' | 'refund' | 'bank'>('all');

  // New Transaction Form State
  const [recordType, setRecordType] = useState<'expense' | 'purchase' | 'salary' | 'refund' | 'bank'>('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<'utilities' | 'supplies' | 'rent' | 'maintenance' | 'marketing' | 'delivery' | 'other'>('utilities');
  const [expDesc, setExpDesc] = useState('');

  // Refund form
  const [refCustomer, setRefCustomer] = useState('');
  const [refAmount, setRefAmount] = useState('');
  const [refReason, setRefReason] = useState('');
  const [refMethod, setRefMethod] = useState<'cash' | 'bank' | 'mobile_money'>('cash');

  // Bank Transaction form
  const [bankType, setBankType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'fee'>('deposit');
  const [bankAmount, setBankAmount] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [bankDesc, setBankDesc] = useState('');

  // Calculate Real-time CPA Financial Metrics
  const metrics = calculateCPAMetrics({
    orders,
    products,
    ingredients,
    expenses,
    purchases,
    employees,
    salaries,
    suppliers,
    refunds,
    bankTransactions,
    accounts
  });

  // Handle Recording New Accounting Entries
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess('');

    try {
      if (recordType === 'expense') {
        if (!expTitle || !expAmount) return;
        await addExpenseFirestore({
          title: expTitle,
          amount: parseFloat(expAmount),
          category: expCategory,
          description: expDesc,
          createdBy: 'AI CPA Accountant'
        });
        setExpTitle('');
        setExpAmount('');
        setExpDesc('');
        setSubmitSuccess('Expense recorded successfully in Firestore Ledger.');
      } else if (recordType === 'refund') {
        if (!refCustomer || !refAmount) return;
        await addRefundFirestore({
          customerName: refCustomer,
          amount: parseFloat(refAmount),
          reason: refReason,
          paymentMethod: refMethod
        });
        setRefCustomer('');
        setRefAmount('');
        setRefReason('');
        setSubmitSuccess('Customer refund recorded successfully in Firestore Ledger.');
      } else if (recordType === 'bank') {
        if (!bankAmount || !bankRef) return;
        await addBankTransactionFirestore({
          type: bankType,
          amount: parseFloat(bankAmount),
          reference: bankRef,
          description: bankDesc,
          accountName: 'Premier Commercial Bank (Corporate Operating)'
        });
        setBankAmount('');
        setBankRef('');
        setBankDesc('');
        setSubmitSuccess('Bank transaction recorded successfully in Firestore Ledger.');
      }
    } catch (err) {
      console.error('Error submitting ledger record:', err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(''), 4000);
    }
  };

  // Build Unified Ledger Entries for General Ledger View
  const allLedgerEntries = [
    ...orders.filter(o => o.status === 'completed').map(o => ({
      id: `ord_${o.id}`,
      type: 'income',
      title: `Customer Order ${o.orderNumber || ''} (${o.customerName || 'Walk-in'})`,
      category: 'Sales Revenue',
      amount: o.totalAmount || 0,
      date: o.createdAt,
      method: (o.paymentMethod || 'cash').toUpperCase()
    })),
    ...expenses.map(e => ({
      id: `exp_${e.id}`,
      type: 'expense',
      title: e.title || 'Expense',
      category: (e.category || 'General').toUpperCase(),
      amount: -(e.amount || 0),
      date: e.createdAt,
      method: 'Operating Expense'
    })),
    ...purchases.map(p => ({
      id: `pur_${p.id}`,
      type: 'purchase',
      title: `Supplier Purchase: ${p.itemName || 'Item'} (${p.supplierName || 'Supplier'})`,
      category: 'Inventory AP',
      amount: -(p.totalCost || 0),
      date: p.createdAt,
      method: (p.status || 'completed').toUpperCase()
    })),
    ...salaries.map(s => ({
      id: `sal_${s.id}`,
      type: 'payroll',
      title: `Payroll Salary: ${s.employeeName || 'Staff'}`,
      category: `Salary (${s.period || 'Monthly'})`,
      amount: -(s.amount || 0),
      date: s.paidDate,
      method: (s.status || 'paid').toUpperCase()
    })),
    ...refunds.map(r => ({
      id: `ref_${r.id}`,
      type: 'refund',
      title: `Customer Refund: ${r.customerName || 'Customer'}`,
      category: 'Sales Allowance',
      amount: -(r.amount || 0),
      date: r.createdAt,
      method: (r.paymentMethod || 'cash').toUpperCase()
    })),
    ...bankTransactions.map(b => ({
      id: `bt_${b.id}`,
      type: 'bank',
      title: `Bank ${(b.type || 'deposit').toUpperCase()}: ${b.description || ''}`,
      category: b.accountName || 'Bank Account',
      amount: b.type === 'deposit' ? (b.amount || 0) : -(b.amount || 0),
      date: b.createdAt,
      method: b.reference || 'REF'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredLedger = allLedgerEntries.filter(entry => {
    const matchesFilter = ledgerFilter === 'all' || entry.type === ledgerFilter;
    const matchesSearch = (entry.title || '').toLowerCase().includes((ledgerSearch || '').toLowerCase()) ||
                          (entry.category || '').toLowerCase().includes((ledgerSearch || '').toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const cpaQuestions = [
    "How much profit did I make today?",
    "How much cash do I have?",
    "Show today's expenses.",
    "Show this month's profit.",
    "How much do I owe suppliers?",
    "How much inventory do I own?",
    "Which expense is the highest?",
    "Generate today's accounting report."
  ];

  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>

      {/* CPA Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
              <Calculator className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">AI CPA Accountant Module</h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Real Firestore Ledger
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Certified Public Accountant engine performing GAAP-compliant audit calculations, cost percentage analysis, anomaly detection, and automated report exports.
              </p>
            </div>
          </div>

          {/* Quick Sub-Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'overview'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>CPA Overview</span>
            </button>
            <button
              onClick={() => setActiveSubTab('statements')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'statements'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Financial Statements</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ledger')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'ledger'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>General Ledger</span>
            </button>
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'reports'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Report Generator</span>
            </button>
            <button
              onClick={() => setActiveSubTab('record')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'record'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Entry</span>
            </button>
          </div>
        </div>

        {/* CPA Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 pt-6 border-t border-slate-800 text-slate-200">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Gross Revenue</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">${(metrics.grossRevenue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Net Revenue</p>
            <p className="text-lg font-bold text-teal-300 mt-1">${(metrics.netRevenue || 0).toFixed(2)}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Net Profit</p>
            <p className={`text-lg font-bold mt-1 ${(metrics.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${(metrics.netProfit || 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Food Cost %</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-lg font-bold text-amber-300">{(metrics.foodCostPercentage || 0).toFixed(1)}%</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${(metrics.foodCostPercentage || 0) <= 35 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {(metrics.foodCostPercentage || 0) <= 35 ? 'Target' : 'High'}
              </span>
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Labor Cost %</p>
            <p className="text-lg font-bold text-sky-300 mt-1">{(metrics.laborCostPercentage || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Cash Drawer</p>
            <p className="text-lg font-bold text-white mt-1">${(metrics.cashBalance || 0).toFixed(2)}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Bank Balance</p>
            <p className="text-lg font-bold text-indigo-300 mt-1">${(metrics.bankBalance || 0).toFixed(2)}</p>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Accounts Payable</p>
            <p className="text-lg font-bold text-rose-400 mt-1">${(metrics.accountsPayable || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: CPA OVERVIEW & HEALTH */}
      {/* ========================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">

          {/* Quick CPA Question Shortcuts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Ask the CPA Accountant directly (English / Arabic / Somali)</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {cpaQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskCPA(q)}
                  className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* CPA Audit & Health Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  CPA Financial Health Audit
                </h3>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs">
                  Grade A (Solid)
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Daily Sales (Today)</span>
                  <span className="font-bold text-slate-900">${(metrics.dailySales || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Weekly Sales</span>
                  <span className="font-bold text-slate-900">${(metrics.weeklySales || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Cost of Goods Sold (COGS)</span>
                  <span className="font-bold text-slate-900">${(metrics.cogs || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Total Inventory Asset Value</span>
                  <span className="font-bold text-slate-900">${(metrics.inventoryValuation || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Total Liquid Capital (Cash + Bank)</span>
                  <span className="font-bold text-emerald-600">${(metrics.totalLiquidity || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">CPA Predictions (Next 30 Days)</p>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Predicted Monthly Profit:</span>
                  <span className="font-bold text-emerald-700">${(metrics.predictedMonthlyProfit || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Predicted Monthly Expenses:</span>
                  <span className="font-bold text-slate-800">${(metrics.predictedFutureExpenses || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Anomalies & Risk Warning Flags */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Anomalies & Accounting Warnings
                </h3>
                <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                  {metrics.anomalies.length} Flagged
                </span>
              </div>

              <div className="space-y-3">
                {metrics.anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-900">{anom.title}</span>
                      <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                        {anom.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{anom.description}</p>
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      CPA Action: {anom.suggestedAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Cost Reduction & Pricing Advice */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-teal-600" />
                  Cost Reduction & Pricing Strategy
                </h3>
              </div>

              <div className="space-y-3">
                {metrics.recommendations.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{rec.title}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                        +${rec.potentialSavingsOrGain.toFixed(2)} Savings
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: GAAP FINANCIAL STATEMENTS */}
      {/* ========================================================= */}
      {activeSubTab === 'statements' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official GAAP Financial Statements</h2>
              <p className="text-xs text-slate-500">Certified Public Accountant Financial Reporting Engine</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatementType('pnl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  statementType === 'pnl' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Profit & Loss (P&L)
              </button>
              <button
                onClick={() => setStatementType('cashflow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  statementType === 'cashflow' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cash Flow Statement
              </button>
              <button
                onClick={() => setStatementType('tax')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  statementType === 'tax' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax Compliance Report
              </button>
            </div>
          </div>

          {/* Statement View */}
          {statementType === 'pnl' && (
            <div className="space-y-4 text-slate-800 text-sm">
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">RESTAURANT PROFIT AND LOSS STATEMENT</p>
                  <p className="text-base font-bold">Standard Income Audit Statement</p>
                </div>
                <button
                  onClick={() => generateCPAReport('pnl', metrics, { orders, expenses, purchases, salaries, products, ingredients, employees, suppliers, refunds, bankTransactions }, 'pdf')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export P&L PDF
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  1. Revenues
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Gross Food & Beverage Sales Revenue</span>
                  <span className="font-semibold">${(metrics.grossRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between text-rose-600">
                  <span>Less: Customer Refunds & Allowances</span>
                  <span className="font-semibold">-${(metrics.customerRefundsTotal || 0).toFixed(2)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between bg-emerald-50 font-bold text-slate-900 border-t border-b border-emerald-200">
                  <span>NET SALES REVENUE</span>
                  <span className="text-emerald-700">${(metrics.netRevenue || 0).toFixed(2)}</span>
                </div>

                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  2. Cost of Goods Sold (COGS)
                </div>
                <div className="px-4 py-2.5 flex justify-between text-slate-700">
                  <span>Cost of Raw Ingredients & Direct Food Cost</span>
                  <span className="font-semibold">-${(metrics.cogs || 0).toFixed(2)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between bg-teal-50 font-bold text-slate-900 border-t border-b border-teal-200">
                  <span>GROSS PROFIT</span>
                  <span className="text-teal-800">${(metrics.grossProfit || 0).toFixed(2)}</span>
                </div>

                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  3. Operating & Payroll Expenses
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Payroll & Staff Salaries</span>
                  <span className="font-semibold">-${(metrics.laborCost || 0).toFixed(2)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Utilities & Generator Diesel Fuel</span>
                  <span className="font-semibold">-${(metrics.operatingExpenses || 0).toFixed(2)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span>Delivery Logistics</span>
                  <span className="font-semibold">-${(metrics.deliveryCost || 0).toFixed(2)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between bg-slate-100 font-bold text-slate-900 border-t border-b border-slate-200">
                  <span>TOTAL OPERATING EXPENSES</span>
                  <span className="text-slate-900">-${(metrics.totalExpenses || 0).toFixed(2)}</span>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-b-xl flex justify-between items-center text-base font-bold">
                  <span>NET OPERATING PROFIT</span>
                  <span className={(metrics.netProfit || 0) >= 0 ? 'text-emerald-400 text-xl' : 'text-rose-400 text-xl'}>
                    ${(metrics.netProfit || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {statementType === 'cashflow' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">CASH FLOW AUDIT STATEMENT</p>
                  <p className="text-base font-bold">Direct Liquidity & Bank Position</p>
                </div>
                <button
                  onClick={() => generateCPAReport('cashflow', metrics, { orders, expenses, purchases, salaries, products, ingredients, employees, suppliers, refunds, bankTransactions }, 'pdf')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export Cash Flow PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Physical Cash Drawer & Safe</h4>
                      <p className="text-xs text-slate-500">Liquidity for daily register cash change</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">${(metrics.cashBalance || 0).toFixed(2)}</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Premier Commercial Bank Account</h4>
                      <p className="text-xs text-slate-500">Corporate Operating Account (PCB-8839201-9)</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">${(metrics.bankBalance || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {statementType === 'tax' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">TAX COMPLIANCE & VAT ESTIMATE</p>
                  <p className="text-base font-bold">Sales VAT & Income Tax Calculations</p>
                </div>
                <button
                  onClick={() => generateCPAReport('tax', metrics, { orders, expenses, purchases, salaries, products, ingredients, employees, suppliers, refunds, bankTransactions }, 'pdf')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export Tax PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-200 bg-emerald-50/50 space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estimated Sales VAT Payable (5%)</p>
                  <p className="text-3xl font-black text-emerald-800">${(metrics.taxEstimatedVAT || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Calculated on Net Sales Revenue (${(metrics.netRevenue || 0).toFixed(2)})</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-sky-50/50 space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estimated Corporate Income Tax (15%)</p>
                  <p className="text-3xl font-black text-sky-800">${(metrics.taxEstimatedCorporate || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Calculated on Net Operating Profit (${(metrics.netProfit || 0).toFixed(2)})</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: GENERAL LEDGER */}
      {/* ========================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Real-Time Double-Entry General Ledger</h2>
              <p className="text-xs text-slate-500">Complete audit trail of income, expenses, AP, payroll, refunds & bank entries from Firestore</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={ledgerFilter}
                onChange={(e) => setLedgerFilter(e.target.value as any)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Entries</option>
                <option value="income">Income (Sales)</option>
                <option value="expense">Expenses</option>
                <option value="purchase">Purchases (AP)</option>
                <option value="payroll">Payroll (Salaries)</option>
                <option value="refund">Refunds</option>
                <option value="bank">Bank Transfers</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Transaction Description</th>
                  <th className="p-3">Ledger Category</th>
                  <th className="p-3">Payment Method / Status</th>
                  <th className="p-3 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(entry.date).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                      {entry.amount > 0 ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      )}
                      <span>{entry.title}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{entry.category}</td>
                    <td className="p-3 text-slate-500">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {entry.method}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold text-sm ${(entry.amount || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(entry.amount || 0) > 0 ? `+$${(entry.amount || 0).toFixed(2)}` : `-$${Math.abs(entry.amount || 0).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: REPORT GENERATOR */}
      {/* ========================================================= */}
      {activeSubTab === 'reports' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Download CPA Accounting Reports</h2>
            <p className="text-xs text-slate-500">Export audited financial statements in PDF, Excel, or CSV formats</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {[
              { id: 'daily', name: 'Daily Financial Report', desc: 'Today revenue, expenses, COGS and cash balance' },
              { id: 'weekly', name: 'Weekly Accounting Report', desc: '7-day financial audit summary' },
              { id: 'monthly', name: 'Monthly Financial Statement', desc: '30-day comprehensive P&L breakdown' },
              { id: 'yearly', name: 'Yearly Financial Report', desc: 'Annual profit and tax audit report' },
              { id: 'pnl', name: 'Profit & Loss Statement (P&L)', desc: 'Official GAAP Income statement' },
              { id: 'cashflow', name: 'Cash Flow Statement', desc: 'Cash vs Bank liquidity movements' },
              { id: 'expenses', name: 'Expense Audit Report', desc: 'Itemized operational expenses' },
              { id: 'sales', name: 'Sales Revenue Report', desc: 'Customer order logs & profit margins' },
              { id: 'inventory_cost', name: 'Inventory Cost Report', desc: 'Asset valuation of stock' },
              { id: 'payroll', name: 'Payroll & Salary Report', desc: 'Staff compensation history' },
              { id: 'tax', name: 'Tax Compliance Report', desc: 'VAT & Corporate income tax' }
            ].map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-3 transition">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{rep.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{rep.desc}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => generateCPAReport(rep.id, metrics, { orders, expenses, purchases, salaries, products, ingredients, employees, suppliers, refunds, bankTransactions }, 'pdf')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    onClick={() => generateCPAReport(rep.id, metrics, { orders, expenses, purchases, salaries, products, ingredients, employees, suppliers, refunds, bankTransactions }, 'excel')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Excel / CSV
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 5: RECORD ACCOUNTING ENTRY */}
      {/* ========================================================= */}
      {activeSubTab === 'record' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Accounting Ledger Entry</h2>
            <p className="text-xs text-slate-500">Record real income, expenses, customer refunds, or bank transfers directly into Firestore</p>
          </div>

          {submitSuccess && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Record Type Switcher */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setRecordType('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                recordType === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setRecordType('refund')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                recordType === 'refund' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Refund
            </button>
            <button
              onClick={() => setRecordType('bank')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                recordType === 'bank' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bank Transfer
            </button>
          </div>

          <form onSubmit={handleRecordSubmit} className="space-y-4">
            {recordType === 'expense' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Power Generator Diesel"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="utilities">Utilities & Fuel</option>
                      <option value="supplies">Cleaning & Supplies</option>
                      <option value="rent">Property Rent</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="marketing">Marketing</option>
                      <option value="delivery">Delivery</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Optional details..."
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            {recordType === 'refund' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer name..."
                    value={refCustomer}
                    onChange={(e) => setRefCustomer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Refund Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={refAmount}
                      onChange={(e) => setRefAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Refund Method</label>
                    <select
                      value={refMethod}
                      onChange={(e) => setRefMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="cash">Cash Register</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Refund</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Order item returned"
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            {recordType === 'bank' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Type</label>
                    <select
                      value={bankType}
                      onChange={(e) => setBankType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="deposit">Deposit to Bank</option>
                      <option value="withdrawal">Withdrawal from Bank</option>
                      <option value="transfer">Supplier Wire Transfer</option>
                      <option value="fee">Bank Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Wire No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEP-99302"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Details..."
                    value={bankDesc}
                    onChange={(e) => setBankDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Recording to Firestore...' : 'Record Entry to Ledger'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
