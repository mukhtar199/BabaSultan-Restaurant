import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { KPICard } from './KPICard';
import { Order, Employee } from '../../../types';
import {
  ShieldCheck,
  Building2,
  Users,
  Database,
  Truck,
  MapPin,
  Utensils,
  CheckCircle2,
  Clock,
  Navigation
} from 'lucide-react';

interface OtherRolesViewProps {
  role: string;
  orders: Order[];
  employees: Employee[];
  onNavigateToTab?: (tab: string) => void;
}

export const AdminView: React.FC<OtherRolesViewProps> = ({ orders, employees, onNavigateToTab }) => {
  const { t } = useAuth();
  const d: Record<string, any> = t.dashboard || {};

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/10 text-purple-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-wider">
              {d.systemAdmin || 'System Admin'}
            </span>
            <span className="text-xs text-slate-400">• {d.fullRbac || 'Full RBAC Architecture Access'}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{d.adminTitle || 'System Administration Dashboard'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{d.adminSubtitle || 'Manage enterprise access control, user accounts, security rules, and database collections.'}</p>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('admin')}
            className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
          >
            {d.openAdminControl || 'Open Admin Control Panel →'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={orders.length} icon={ShieldCheck} iconColor="purple" />
        <KPICard title="Enterprise Staff" value={employees.length} icon={Users} iconColor="teal" />
        <KPICard title="Security Rules" value="v2 ABAC Active" icon={Building2} iconColor="emerald" />
        <KPICard title="Database Status" value="Firestore Synced" icon={Database} iconColor="indigo" />
      </div>
    </div>
  );
};

export const WaiterView: React.FC<OtherRolesViewProps> = ({ orders, onNavigateToTab }) => {
  const { t } = useAuth();
  const d: Record<string, any> = t.dashboard || {};

  const readyTableOrders = orders.filter(o => o.status === 'ready_for_pickup' || o.prepStatus === 'ready');
  const activeDineIn = orders.filter(o => o.orderType === 'dine_in' || !o.orderType);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider block w-fit mb-1">
            {d.floorStaff || 'Floor Staff'}
          </span>
          <h2 className="text-2xl font-bold text-white">{d.waiterTitle || 'Dining Room Waiter Station'}</h2>
          <p className="text-xs text-slate-400">{d.waiterSubtitle || 'Track active dining tables, ready dishes from kitchen, and floor service requests.'}</p>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('pos')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
          >
            {d.createTableOrder || '+ Create Table Order'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Ready for Table Service" value={readyTableOrders.length} icon={Utensils} iconColor="emerald" />
        <KPICard title="Active Occupied Tables" value={activeDineIn.length || 4} icon={Clock} iconColor="amber" />
        <KPICard title="Floor Shift Sales" value={`$${orders.reduce((s, o) => s + o.totalAmount, 0).toFixed(2)}`} icon={CheckCircle2} iconColor="teal" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Utensils className="w-5 h-5 text-emerald-400" />
          Kitchen Ready Dishes awaiting Table Delivery
        </h3>
        <div className="space-y-2">
          {readyTableOrders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No kitchen dishes currently waiting for floor delivery.</p>
          ) : (
            readyTableOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-emerald-500/30 text-xs">
                <div>
                  <span className="font-bold text-white">{o.orderNumber} ({o.tableNumber || 'Table 4'})</span>
                  <p className="text-[10px] text-slate-400">{o.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">READY</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const DeliveryDriverView: React.FC<OtherRolesViewProps> = ({ orders }) => {
  const deliveryOrders = orders.filter(o => o.orderType === 'delivery' || o.status === 'out_for_delivery');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <span className="bg-indigo-500/10 text-indigo-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider block w-fit mb-1">
            Dispatch Portal
          </span>
          <h2 className="text-2xl font-bold text-white">Delivery Driver App</h2>
          <p className="text-xs text-slate-400">Assigned customer delivery orders, navigation routes, and completion status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Assigned Deliveries" value={deliveryOrders.length} icon={Truck} iconColor="indigo" />
        <KPICard title="Avg Delivery Time" value="18.5 min" icon={Clock} iconColor="teal" />
        <KPICard title="Completed Trips Today" value="14" icon={CheckCircle2} iconColor="emerald" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Navigation className="w-5 h-5 text-indigo-400" />
          Active Delivery Trips Queue
        </h3>
        <div className="space-y-2">
          {deliveryOrders.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No active delivery assignments currently queued.</p>
          ) : (
            deliveryOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-white">{o.orderNumber} • {o.customerName}</span>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-indigo-400" /> Mogadishu District Area
                  </p>
                </div>
                <span className="font-bold text-indigo-400">${(o.totalAmount || 0).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
