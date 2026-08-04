import React, { useState } from 'react';
import { Order, OrderStatus } from '../../../types';
import { downloadPDFInvoice } from '../../../domain/services/receiptService';
import {
  X,
  Printer,
  Download,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Utensils,
  DollarSign,
  FileText
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onEditOrder?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onEditOrder
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, newStatus);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white">Order #{order.orderNumber}</h3>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20">
                {order.orderType?.replace('_', ' ') || 'dine_in'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {onEditOrder && order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              onClick={() => {
                onEditOrder(order);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Order</span>
            </button>
          )}
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Customer</span>
            <span className="text-white font-extrabold mt-0.5 block">{order.customerName || 'Walk-in'}</span>
            {order.customerPhone && <span className="text-[10px] text-slate-500">{order.customerPhone}</span>}
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Table / Location</span>
            <span className="text-emerald-400 font-extrabold mt-0.5 block">
              {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeout / Delivery'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Cashier / Staff</span>
            <span className="text-white font-extrabold mt-0.5 block">{order.employeeName || 'Staff'}</span>
          </div>
        </div>

        {/* Itemized Products List */}
        <div className="space-y-2">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">Ordered Dishes & Items</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-lg text-[10px]">
                      {item.quantity}x
                    </span>
                    <span>{item.productName}</span>
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-emerald-400 pl-7 mt-0.5">
                      + {item.selectedOptions.map(o => o.choiceName).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-amber-300 italic pl-7">Note: {item.notes}</p>
                  )}
                </div>

                <span className="font-mono font-extrabold text-white">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal:</span>
            <span>${(order.subtotal || order.totalAmount * 0.95).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tax (5% VAT):</span>
            <span>${(order.tax || order.totalAmount * 0.05).toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount Applied:</span>
              <span>-${order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
            <span>Grand Total Amount:</span>
            <span className="text-emerald-400">${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-teal-400 pt-1 font-sans font-bold">
            <span>Calculated Net Profit:</span>
            <span>${(order.profit || order.totalAmount * 0.55).toFixed(2)}</span>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-slate-400 font-bold text-[10px] uppercase block">Kitchen Workflow Progression</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              disabled={isUpdating}
              onClick={() => handleStatusChange('in_preparation')}
              className="p-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold transition cursor-pointer text-center"
            >
              In Kitchen
            </button>
            <button
              disabled={isUpdating}
              onClick={() => handleStatusChange('ready_for_pickup')}
              className="p-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-xs font-bold transition cursor-pointer text-center"
            >
              Mark Ready
            </button>
            <button
              disabled={isUpdating}
              onClick={() => handleStatusChange('completed')}
              className="p-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-extrabold transition cursor-pointer text-center shadow-md shadow-emerald-500/20"
            >
              Complete
            </button>
            <button
              disabled={isUpdating}
              onClick={() => handleStatusChange('cancelled')}
              className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-bold transition cursor-pointer text-center"
            >
              Cancel Order
            </button>
          </div>
        </div>

        {/* Document Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Ticket</span>
          </button>
          <button
            onClick={() => downloadPDFInvoice(order)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Invoice PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
