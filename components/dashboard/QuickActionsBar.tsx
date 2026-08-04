import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserRole
} from '../../../constants';
import {
  ShieldCheck,
  Plus,
  ShoppingCart,
  Receipt,
  Boxes,
  Bot
} from 'lucide-react';

interface QuickActionsBarProps {
  activeRoleView: string;
  onChangeRoleView: (role: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenAIQuery?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  activeRoleView,
  onChangeRoleView,
  onNavigateToTab,
  onOpenAIQuery
}) => {
  const { role, switchRole, permissions, t } = useAuth();

  const roleViews: { id: string; label: string; roleKey: UserRole }[] = [
    { id: 'owner', label: 'Owner Dashboard', roleKey: 'Owner' },
    { id: 'manager', label: 'Manager Dashboard', roleKey: 'Manager' },
    { id: 'accountant', label: 'Accountant Dashboard', roleKey: 'Accountant' },
    { id: 'cashier', label: 'Cashier Dashboard', roleKey: 'Cashier' },
    { id: 'kitchen', label: 'Kitchen Dashboard', roleKey: 'Kitchen' },
    { id: 'waiter', label: 'Waiter Station', roleKey: 'Waiter' },
    { id: 'delivery', label: 'Delivery Driver', roleKey: 'Delivery Driver' },
    { id: 'admin', label: 'System Admin', roleKey: 'Admin' }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Role View Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> View As:
            </span>
            {roleViews.map(rv => {
              const isActive = activeRoleView.toLowerCase() === rv.id;
              return (
                <button
                  key={rv.id}
                  onClick={() => {
                    onChangeRoleView(rv.id);
                    if (permissions.canAccessAdminPanel) {
                      switchRole(rv.roleKey);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {rv.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
          {onNavigateToTab && (
            <>
              <button
                onClick={() => onNavigateToTab('pos')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ POS Order</span>
              </button>

              <button
                onClick={() => onNavigateToTab('financials')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ Log Expense</span>
              </button>

              <button
                onClick={() => onNavigateToTab('inventory')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Stock Movement</span>
              </button>
            </>
          )}

          {onOpenAIQuery && (
            <button
              onClick={onOpenAIQuery}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shadow-md cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>AI Advisor</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
