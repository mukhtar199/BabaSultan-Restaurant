import React, { useState } from 'react';
import { Employee, Supplier } from '../types';
import { Users, Truck, Phone, Award, AlertTriangle } from 'lucide-react';

interface StaffAndSuppliersViewProps {
  employees: Employee[];
  suppliers: Supplier[];
}

export const StaffAndSuppliersView: React.FC<StaffAndSuppliersViewProps> = ({
  employees,
  suppliers
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'suppliers'>('staff');

  const sortedStaff = [...employees].sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Staff & Supplier Relationship Management
          </h2>
          <p className="text-xs text-slate-400">
            Monitor waiter & cashier sales metrics, employee roles, and supplier invoices
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
              activeTab === 'staff' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
              activeTab === 'suppliers' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      {/* Staff Table */}
      {activeTab === 'staff' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Sales Rank</th>
                  <th className="py-4 px-6">Employee Name</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Base Salary ($)</th>
                  <th className="py-4 px-6">Total Generated Sales</th>
                  <th className="py-4 px-6">Orders Handled</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedStaff.map((emp, rank) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-400">
                      {rank === 0 ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Award className="w-4 h-4" /> #1 Top Seller
                        </span>
                      ) : (
                        `#${rank + 1}`
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{emp.name}</td>
                    <td className="py-4 px-6 text-xs text-slate-300 uppercase font-mono">{emp.role}</td>
                    <td className="py-4 px-6 text-slate-200">${emp.salary.toFixed(2)}</td>
                    <td className="py-4 px-6 font-bold text-emerald-400">${emp.totalSales.toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-300">{emp.ordersCount} orders</td>
                    <td className="py-4 px-6 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                        {emp.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      {activeTab === 'suppliers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Supplier Name</th>
                  <th className="py-4 px-6">Contact Person</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Items Supplied</th>
                  <th className="py-4 px-6">Pending Invoice</th>
                  <th className="py-4 px-6">Overdue Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">{sup.name}</td>
                    <td className="py-4 px-6 text-slate-300">{sup.contactPerson}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {sup.phone}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300">{sup.itemsSupplied}</td>
                    <td className="py-4 px-6 font-bold text-slate-200">${sup.pendingAmount.toFixed(2)}</td>
                    <td className="py-4 px-6 font-bold">
                      {sup.overdueAmount > 0 ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          ${sup.overdueAmount.toFixed(2)} OVERDUE
                        </span>
                      ) : (
                        <span className="text-emerald-400">$0.00</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
