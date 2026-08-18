import React from 'react';
import { Order, Product, Ingredient, Expense, Employee, Supplier, Purchase } from '../types';
import { downloadPDFReport, exportToExcel } from '../lib/reports';
import { FileSpreadsheet, FileText, Download, Printer, ShieldAlert } from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  expenses: Expense[];
  employees: Employee[];
  suppliers: Supplier[];
  purchases: Purchase[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  products,
  ingredients,
  expenses,
  employees,
  suppliers,
  purchases
}) => {

  const handleDownloadFinancialPDF = () => {
    const totalRev = orders.reduce((a, b) => a + b.totalAmount, 0);
    const totalCogs = orders.reduce((a, b) => a + b.cogs, 0);
    const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
    const netProfit = totalRev - totalCogs - totalExp;

    downloadPDFReport(
      "Comprehensive Restaurant Financial Audit",
      `Period: Current Session | Firestore Database Audit`,
      [
        {
          heading: "Financial Statement",
          columns: ["Account Line Item", "Amount ($USD)"],
          rows: [
            ["Gross Sales Revenue", `$${(totalRev || 0).toFixed(2)}`],
            ["Cost of Goods Sold (COGS)", `$${(totalCogs || 0).toFixed(2)}`],
            ["Operating Expenses", `$${(totalExp || 0).toFixed(2)}`],
            ["Net Income / Profit", `$${(netProfit || 0).toFixed(2)}`]
          ]
        },
        {
          heading: "Expense Breakdown",
          columns: ["Title", "Category", "Amount ($)", "Date"],
          rows: expenses.map(e => [e.title, e.category, `$${(e.amount || 0).toFixed(2)}`, new Date(e.createdAt).toLocaleDateString()])
        }
      ]
    );
  };

  const handleDownloadInventoryPDF = () => {
    downloadPDFReport(
      "Kitchen Inventory & Stock Audit Report",
      `Generated: ${new Date().toLocaleString()}`,
      [
        {
          heading: "Raw Kitchen Ingredients",
          columns: ["Ingredient Name", "Stock Level", "Min Alert Level", "Unit Cost", "Supplier"],
          rows: ingredients.map(i => [i.name, `${i.stock} ${i.unit}`, `${i.minStockAlert} ${i.unit}`, `$${(i.costPerUnit || 0).toFixed(2)}`, i.supplierName])
        },
        {
          heading: "Menu Dishes Stock",
          columns: ["Dish Name", "Category", "Price", "Cost", "Stock"],
          rows: products.map(p => [p.name, p.category, `$${(p.price || 0).toFixed(2)}`, `$${(p.cost || 0).toFixed(2)}`, `${p.stock} ${p.unit}`])
        }
      ]
    );
  };

  const handleDownloadStaffPDF = () => {
    downloadPDFReport(
      "Staff Sales Performance & Payroll Report",
      `Generated: ${new Date().toLocaleString()}`,
      [
        {
          heading: "Employee Performance Ranking",
          columns: ["Employee Name", "Role", "Base Salary", "Total Sales Generated", "Orders Handled"],
          rows: employees.map(e => [e.name, e.role, `$${(e.salary || 0).toFixed(2)}`, `$${(e.totalSales || 0).toFixed(2)}`, e.ordersCount])
        }
      ]
    );
  };

  const handleExportAllToExcel = () => {
    const cols = ["Module", "Item Name", "Metric Value / Amount", "Details / Reference"];
    const rows = [
      ...orders.map(o => ["Order", o.orderNumber, `$${(o.totalAmount || 0).toFixed(2)}`, `Profit: $${(o.profit || 0).toFixed(2)}`]),
      ...expenses.map(e => ["Expense", e.title, `$${(e.amount || 0).toFixed(2)}`, e.category]),
      ...ingredients.map(i => ["Ingredient", i.name, `${i.stock} ${i.unit}`, i.supplierName]),
      ...employees.map(e => ["Employee", e.name, `$${(e.totalSales || 0).toFixed(2)} sales`, e.role])
    ];

    exportToExcel("Full_Restaurant_ERP_Master_Export", cols, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            PDF Reports & Excel Export Hub
          </h2>
          <p className="text-xs text-slate-400">
            Generate printable PDF financial audits and download Excel spreadsheet datasets
          </p>
        </div>

        <button
          onClick={handleExportAllToExcel}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Master Excel Worksheet
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Financial Report Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Financial & Income Audit</h3>
            <p className="text-xs text-slate-400 mb-4">
              Comprehensive profit & loss analysis, revenue, COGS, and itemized operational expenses.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleDownloadFinancialPDF}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Inventory Report Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Kitchen & Inventory Audit</h3>
            <p className="text-xs text-slate-400 mb-4">
              Detailed breakdown of raw kitchen ingredients, stock levels, reorder thresholds, and suppliers.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleDownloadInventoryPDF}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Staff & Payroll Report Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Staff Sales & Payroll Audit</h3>
            <p className="text-xs text-slate-400 mb-4">
              Employee sales ranking leaderboard, orders handled count, and payroll status.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              onClick={handleDownloadStaffPDF}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Download PDF Report
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
