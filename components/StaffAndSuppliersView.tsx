import React, { useState } from 'react';
import { Employee, Supplier, Salary } from '../../types';
import { StaffRepositoryImpl } from '../../data/repositories/StaffRepositoryImpl';
import {
  Users,
  Truck,
  PlusCircle,
  X,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Mail,
  Phone,
  ShieldAlert
} from 'lucide-react';

interface StaffAndSuppliersViewProps {
  employees: Employee[];
  suppliers: Supplier[];
  salaries: Salary[];
  onRefresh?: () => void;
}

const staffRepo = new StaffRepositoryImpl();

export const StaffAndSuppliersView: React.FC<StaffAndSuppliersViewProps> = ({
  employees,
  suppliers,
  salaries,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'suppliers' | 'payroll'>('employees');

  // Modals
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState<boolean>(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState<boolean>(false);
  const [paySalaryEmp, setPaySalaryEmp] = useState<Employee | null>(null);

  // Forms
  const [empName, setEmpName] = useState<string>('');
  const [empEmail, setEmpEmail] = useState<string>('');
  const [empRole, setEmpRole] = useState<string>('cashier');
  const [empSalary, setEmpSalary] = useState<number>(2500);

  const [supName, setSupName] = useState<string>('');
  const [supContact, setSupContact] = useState<string>('');
  const [supPhone, setSupPhone] = useState<string>('');
  const [supItems, setSupItems] = useState<string>('Meat & Meat Products');
  const [supPending, setSupPending] = useState<number>(0);

  const [payPeriod, setPayPeriod] = useState<string>('Current Month');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await staffRepo.createEmployee({
        name: empName,
        email: empEmail,
        role: empRole,
        salary: empSalary
      });
      setIsAddEmployeeOpen(false);
      setEmpName('');
      setEmpEmail('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error creating staff member: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await staffRepo.createSupplier({
        name: supName,
        contactPerson: supContact,
        phone: supPhone,
        itemsSupplied: supItems,
        pendingAmount: supPending
      });
      setIsAddSupplierOpen(false);
      setSupName('');
      setSupContact('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error creating supplier: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!paySalaryEmp) return;
    setIsSubmitting(true);
    try {
      await staffRepo.processSalaryPayment({
        employeeId: paySalaryEmp.id,
        employeeName: paySalaryEmp.name,
        amount: paySalaryEmp.salary,
        period: payPeriod
      });
      setPaySalaryEmp(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error processing payroll: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Human Resources, Payroll & Vendor Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Restaurant staff roster, monthly payroll processing & supplier directory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Hire Staff Member
          </button>
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3.5 py-2 rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-xl transition font-bold cursor-pointer ${
            activeTab === 'employees' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Staff Roster ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl transition font-bold cursor-pointer ${
            activeTab === 'suppliers' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl transition font-bold cursor-pointer ${
            activeTab === 'payroll' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Payroll History ({salaries.length})
        </button>
      </div>

      {/* Staff Roster Tab */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{emp.name}</h4>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {emp.role}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-white">${emp.salary}/mo</span>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {emp.email || 'staff@restaurant-erp.internal'}</p>
                </div>
              </div>

              <button
                onClick={() => setPaySalaryEmp(emp)}
                className="w-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold py-2 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                Disburse Monthly Salary
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Vendor / Supplier Name</th>
                  <th className="py-4 px-6">Contact Person</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Goods Supplied</th>
                  <th className="py-4 px-6 text-right">Pending Payables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">{s.name}</td>
                    <td className="py-4 px-6 text-slate-300">{s.contactPerson}</td>
                    <td className="py-4 px-6 font-mono text-slate-400">{s.phone}</td>
                    <td className="py-4 px-6 text-slate-400">{s.itemsSupplied}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-amber-400">
                      ${(s.pendingAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payroll History Tab */}
      {activeTab === 'payroll' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Employee Name</th>
                  <th className="py-4 px-6">Disbursed Amount</th>
                  <th className="py-4 px-6">Pay Period</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {salaries.map(sal => (
                  <tr key={sal.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">{sal.employeeName}</td>
                    <td className="py-4 px-6 font-extrabold text-emerald-400">${sal.amount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-400">{sal.period}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
                        {sal.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-500">
                      {new Date(sal.paidDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hire Staff Modal */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateEmployee} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-xs">
            <button type="button" onClick={() => setIsAddEmployeeOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white">Hire Staff Member</h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@restaurant.com"
                  value={empEmail}
                  onChange={e => setEmpEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Role / Position</label>
                  <select
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="cashier">Cashier (POS)</option>
                    <option value="chef">Chef / Kitchen</option>
                    <option value="manager">Branch Manager</option>
                    <option value="driver">Delivery Driver</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Monthly Salary ($)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={e => setEmpSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl transition cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Add Employee to Roster'}
            </button>
          </form>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {paySalaryEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-xs">
            <button onClick={() => setPaySalaryEmp(null)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white">Process Payroll Disbursal</h3>
            <p className="text-slate-400">{paySalaryEmp.name} ({paySalaryEmp.role})</p>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly Base Salary</span>
              <div className="text-2xl font-extrabold text-emerald-400">${paySalaryEmp.salary.toFixed(2)}</div>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handleProcessPayroll}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl transition cursor-pointer"
            >
              {isSubmitting ? 'Processing Payout...' : 'Confirm Disbursal & Log Expense'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
