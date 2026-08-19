import React from 'react';
import { Language } from '../types';
import { translations } from '../lib/i18n';
import { useAuth } from '../presentation/context/AuthContext';
import { UserRole } from '../constants';
import {
  Bot,
  BarChart3,
  ShoppingBag,
  Package,
  DollarSign,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  Globe,
  Database,
  Calculator,
  TrendingUp,
  Activity,
  Crown,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenAIAssistant: () => void;
  lowStockCount: number;
  overdueCount: number;
  onSeedData?: () => void;
  onClearData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  onOpenAIAssistant,
  lowStockCount,
  overdueCount,
  onClearData
}) => {
  const { userRecord } = useAuth();
  const activeLang = language === 'auto' ? 'en' : language;
  const t = translations[activeLang];
  const isRtl = language === 'ar';
  const isManagement = ['Owner', 'owner', 'Admin', 'admin', 'Manager', 'manager'].includes(userRecord?.role || '');
  const { user, role } = useAuth();

  const navItems = [
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
    { id: 'ceo', label: 'AI CEO', icon: Crown },
    { id: 'operations', label: 'AI Operations Manager', icon: Activity },
    { id: 'pos', label: 'POS Terminal', icon: CreditCard },
    { id: 'dashboard', label: t.dashboard, icon: BarChart3 },
    { id: 'cfo', label: 'AI Advisor (CFO)', icon: TrendingUp },
    { id: 'cpa', label: 'AI Accountant (CPA)', icon: Calculator },
    { id: 'orders', label: t.orders, icon: ShoppingBag },
    { id: 'inventory', label: t.inventory, icon: Package },
    { id: 'financials', label: t.financials, icon: DollarSign },
    { id: 'staff', label: t.staffAndSuppliers, icon: Users },
    { id: 'reports', label: t.reports, icon: FileSpreadsheet }
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {t.appName}
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ERP + POS
                </span>
              </h1>
              <p className="text-xs text-slate-400">{t.tagline}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            
            {/* RBAC Role Display */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-400 capitalize">
                {role || 'User'}
              </span>
            </div>

            {/* AI Assistant Quick Trigger Button */}
            <button
              onClick={onOpenAIAssistant}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl transition shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer text-xs"
            >
              <Bot className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">{t.aiAssistant}</span>
            </button>

            {/* Language Picker */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Globe className="w-4 h-4 text-emerald-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="auto" className="bg-slate-900 text-white">🌐 Auto</option>
                <option value="en" className="bg-slate-900 text-white">🇬🇧 EN</option>
                <option value="ar" className="bg-slate-900 text-white">🇸🇦 AR</option>
                <option value="so" className="bg-slate-900 text-white">🇸🇴 SO</option>
              </select>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-1 rtl:space-x-reverse py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {item.id === 'inventory' && lowStockCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    {lowStockCount}
                  </span>
                )}

                {item.id === 'financials' && overdueCount > 0 && (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                    {overdueCount} overdue
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
