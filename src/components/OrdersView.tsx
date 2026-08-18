import React from 'react';
import { Order } from '../types';
import { downloadInvoicePDF, exportToExcel } from '../lib/reports';
import { ShoppingBag, FileText, Download, CheckCircle2, Clock } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders }) => {
  const handleExportExcel = () => {
    const cols = ["Order #", "Customer", "Total Amount ($)", "COGS ($)", "Profit ($)", "Payment", "Employee", "Date"];
    const rows = orders.map(o => [
      o.orderNumber,
      o.customerName || 'Walk-in',
      o.totalAmount.toFixed(2),
      o.cogs.toFixed(2),
      o.profit.toFixed(2),
      o.paymentMethod,
      o.employeeName,
      new Date(o.createdAt).toLocaleString()
    ]);
    exportToExcel('Restaurant_Sales_Orders', cols, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            Orders & Sales Management
          </h2>
          <p className="text-xs text-slate-400">
            Real-time customer sales transactions stored in Firestore
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export Orders to Excel
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Order #</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Items</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">COGS</th>
                <th className="py-4 px-6">Net Profit</th>
                <th className="py-4 px-6">Staff</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No orders registered yet. Click "Seed Demo ERP Data" in navbar to test.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">{o.orderNumber}</td>
                    <td className="py-4 px-6 font-medium text-white">{o.customerName || 'Walk-in'}</td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {o.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">${(o.totalAmount || 0).toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-400">${(o.cogs || 0).toFixed(2)}</td>
                    <td className="py-4 px-6 font-bold text-emerald-400">${(o.profit || 0).toFixed(2)}</td>
                    <td className="py-4 px-6 text-xs text-slate-300">{o.employeeName}</td>
                    <td className="py-4 px-6 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => downloadInvoicePDF(o)}
                        className="p-2 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg transition"
                        title="Download Invoice PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
