import React, { useState } from 'react';
import { PaymentMethod, POSCheckoutPayload, CartItem, OrderType } from '../../../domain/entities/pos';
import { Customer } from '../../../types';
import { X, DollarSign, CreditCard, Smartphone, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  cart: CartItem[];
  orderType: OrderType;
  tableNumber?: string;
  subtotal: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
  selectedCustomer?: Customer | null;
  cashierName: string;
  cashierUid: string;
  onClose: () => void;
  onConfirmPayment: (payload: POSCheckoutPayload) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  cart,
  orderType,
  tableNumber,
  subtotal,
  tax,
  discountAmount,
  grandTotal,
  selectedCustomer,
  cashierName,
  cashierUid,
  onClose,
  onConfirmPayment
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState<string>(selectedCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(selectedCustomer?.phone || '');
  const [amountTendered, setAmountTendered] = useState<string>(grandTotal.toString());
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const numericTendered = parseFloat(amountTendered) || grandTotal;
  const changeDue = Math.max(0, numericTendered - grandTotal);

  const quickTenderOptions = [
    grandTotal,
    Math.ceil(grandTotal / 5) * 5,
    Math.ceil(grandTotal / 10) * 10,
    50,
    100
  ].filter((val, idx, self) => val >= grandTotal && self.indexOf(val) === idx);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload: POSCheckoutPayload = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber || 'T-01' : '',
        items: cart,
        subtotal,
        tax,
        discount: discountAmount,
        totalAmount: grandTotal,
        paymentMethod,
        amountTendered: numericTendered,
        changeDue,
        employeeId: cashierUid || 'emp-pos',
        employeeName: cashierName || 'Cashier',
        notes: orderNotes
      };

      await onConfirmPayment(payload);
    } catch (err: any) {
      alert(`Payment submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">POS Checkout & Payment</h3>
            <p className="text-xs text-slate-400">Select customer payment method & complete ledger entry</p>
          </div>
        </div>

        {/* Amount Due Banner */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Total Payable</span>
          <div className="text-3xl font-extrabold text-emerald-400">${grandTotal.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 flex justify-center gap-2">
            <span>Sub: ${subtotal.toFixed(2)}</span>
            <span>VAT: ${tax.toFixed(2)}</span>
            {discountAmount > 0 && <span className="text-emerald-400">Disc: -${discountAmount.toFixed(2)}</span>}
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: DollarSign },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'mobile_money', label: 'Mobile', icon: Smartphone },
                { id: 'online', label: 'Online', icon: Globe }
              ].map(m => {
                const Icon = m.icon;
                const isSel = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      isSel
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tendered Amount (if Cash) */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <label className="text-slate-300 font-bold block">Amount Tendered ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amountTendered}
                onChange={e => setAmountTendered(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-extrabold text-sm focus:outline-none focus:border-emerald-500"
              />

              {/* Quick Tender Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickTenderOptions.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountTendered(val.toString())}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] transition"
                  >
                    ${val.toFixed(2)}
                  </button>
                ))}
              </div>

              {/* Change Due Display */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Change Due to Customer:</span>
                <span className="text-emerald-400 font-extrabold text-sm">${changeDue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="Optional Phone"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Order Notes */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">Order Notes / Kitchen Instruction</label>
            <input
              type="text"
              placeholder="e.g. VIP guest, extra napkin, pack separate..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Order Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-3.5 rounded-2xl transition cursor-pointer shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span>Processing Payment...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Order & Complete (${grandTotal.toFixed(2)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
