import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../../types';
import { updateOrderStatusFirestore } from '../../lib/firebase';
import { KDSView } from './orders/KDSView';
import { TableManagementView } from './orders/TableManagementView';
import { CustomerHistoryView } from './orders/CustomerHistoryView';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { EditOrderModal } from './orders/EditOrderModal';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Utensils,
  Search,
  Filter,
  Eye,
  Flame,
  Users,
  Layers,
  Edit,
  Plus
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onRefresh?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, onRefresh }) => {
  const { t } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'kds' | 'tables' | 'customers'>('pipeline');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Order Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusFirestore(orderId, newStatus);
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails({ ...selectedOrderDetails, status: newStatus });
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">{t.orders.completed}</span>;
      case 'in_preparation':
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase animate-pulse">{t.orders.inKitchen}</span>;
      case 'ready_for_pickup':
      case 'ready':
        return <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] font-bold uppercase">{t.orders.ready}</span>;
      case 'out_for_delivery':
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase">{t.orders.onDelivery}</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase">{t.orders.cancelled}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase">{t.orders.received}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Tab Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            {t.orders.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.orders.subtitle}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.orders.pipeline}</span>
          </button>

          <button
            onClick={() => setActiveTab('kds')}
            className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'kds'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{t.orders.kds}</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>{t.orders.tables}</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.orders.customerLog}</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Orders Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs overflow-x-auto no-scrollbar">
              {['all', 'received', 'in_preparation', 'ready_for_pickup', 'completed', 'cancelled'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3.5 py-1.5 rounded-xl transition font-bold capitalize whitespace-nowrap cursor-pointer ${
                    filterStatus === st ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search order #, customer, or table..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Customer / Table</th>
                    <th className="py-4 px-6">Items Count</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6">Net Profit</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No orders match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6 font-mono font-extrabold text-emerald-400">#{o.orderNumber}</td>
                        <td className="py-4 px-6 text-slate-400 uppercase font-mono text-[10px]">
                          {o.orderType?.replace('_', ' ') || o.type || 'dine_in'}
                        </td>
                        <td className="py-4 px-6 font-medium text-white">
                          {o.customerName || 'Walk-in'} {o.tableNumber ? `(Table ${o.tableNumber})` : ''}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : 0} items
                        </td>
                        <td className="py-4 px-6 font-extrabold text-white">${o.totalAmount.toFixed(2)}</td>
                        <td className="py-4 px-6 font-bold text-teal-400">${(o.profit || 0).toFixed(2)}</td>
                        <td className="py-4 px-6">{getStatusBadge(o.status)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" /> View
                            </button>
                            {o.status !== 'completed' && o.status !== 'cancelled' && (
                              <button
                                onClick={() => setSelectedOrderForEdit(o)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab Content 2: KDS View */}
      {activeTab === 'kds' && (
        <KDSView
          orders={orders}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Tab Content 3: Table Management */}
      {activeTab === 'tables' && (
        <TableManagementView
          orders={orders}
          onOpenOrderModal={order => setSelectedOrderDetails(order)}
        />
      )}

      {/* Tab Content 4: Customer Directory */}
      {activeTab === 'customers' && (
        <CustomerHistoryView
          orders={orders}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <OrderDetailsModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
          onUpdateStatus={handleUpdateStatus}
          onEditOrder={order => setSelectedOrderForEdit(order)}
        />
      )}

      {/* Edit Order Modal */}
      {selectedOrderForEdit && (
        <EditOrderModal
          order={selectedOrderForEdit}
          onClose={() => setSelectedOrderForEdit(null)}
          onSaved={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

    </div>
  );
};
