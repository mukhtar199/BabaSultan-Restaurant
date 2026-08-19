import React, { useState, useEffect } from 'react';
import { PaymentMethod, POSCheckoutPayload, CartItem, OrderType } from '../../../domain/entities/pos';
import { Customer, DeliveryZone } from '../../../types';
import { X, DollarSign, CreditCard, Smartphone, Globe, CheckCircle2, MapPin, Truck } from 'lucide-react';

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
  deliveryZones?: DeliveryZone[];
  initialZoneId?: string;
  initialAddress?: string;
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
  deliveryZones,
  initialZoneId,
  initialAddress,
  onClose,
  onConfirmPayment
}) => {
  const activeZones = deliveryZones || [];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState<string>(selectedCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(selectedCustomer?.phone || '');
  
  // Delivery Specific State
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    initialZoneId || activeZones[0]?.id || ''
  );
  const selectedZone = activeZones.find(z => z.id === selectedZoneId) || activeZones[0];
  
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    initialAddress || selectedCustomer?.address || ''
  );

  const deliveryFee = orderType === 'delivery' ? (selectedZone?.baseDeliveryFee ?? 2.00) : 0;
  const payableTotal = orderType === 'delivery' 
    ? Math.max(0, subtotal + tax + deliveryFee - discountAmount)
    : grandTotal;

  const [amountTendered, setAmountTendered] = useState<string>(payableTotal.toString());
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setAmountTendered(payableTotal.toString());
  }, [payableTotal]);

  const numericTendered = payableTotal;
  const changeDue = 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (orderType === 'delivery') {
      if (!customerPhone.trim()) {
        alert('Please enter a customer phone number for delivery orders.');
        return;
      }
      if (!deliveryAddress.trim()) {
        alert('Please enter a delivery address.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: POSCheckoutPayload = {
        customerName: customerName.trim() || (orderType === 'delivery' ? 'Delivery Customer' : 'Walk-in Customer'),
        customerPhone: customerPhone.trim(),
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber || 'T-01' : '',
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        deliveryZoneId: orderType === 'delivery' ? selectedZone?.id : undefined,
        deliveryZoneName: orderType === 'delivery' ? selectedZone?.name : undefined,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        items: cart,
        subtotal,
        tax,
        discount: discountAmount,
        totalAmount: payableTotal,
        paymentMethod,
        amountTendered: payableTotal,
        changeDue: 0,
        employeeId: cashierUid || 'emp-pos',
        employeeName: cashierName || 'Cashier',
        notes: orderNotes
      };

      await onConfirmPayment(payload);
    } catch (err: any) {
      alert(`Payment submission failed: ${err.message || err}`);
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
          <div className="text-3xl font-extrabold text-emerald-400">${(payableTotal || 0).toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 flex flex-wrap justify-center gap-2">
            <span>Sub: ${(subtotal || 0).toFixed(2)}</span>
            <span>VAT: ${(tax || 0).toFixed(2)}</span>
            {orderType === 'delivery' && <span className="text-amber-400 font-bold">Delivery Fee: +${(deliveryFee || 0).toFixed(2)}</span>}
            {(discountAmount || 0) > 0 && <span className="text-emerald-400">Disc: -${(discountAmount || 0).toFixed(2)}</span>}
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Delivery Configuration Section (Visible only when orderType === 'delivery') */}
          {orderType === 'delivery' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Truck className="w-4 h-4" />
                <span>Delivery Order Configuration</span>
              </div>

              {/* Zone Selector */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Select Delivery Zone</label>
                <select
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  {activeZones.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.city}) — Fee: ${(z.baseDeliveryFee || 0).toFixed(2)} | EST: {z.estimatedTimeMinutes} min
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Delivery Address <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 42, KM4 Area, Hodan District, Mogadishu"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

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
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Exact Cash Payment Required:</span>
                <span className="text-emerald-400 font-extrabold text-sm">${payableTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Change Due:</span>
                <span className="text-slate-300 font-extrabold text-xs">$0.00</span>
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
              <label className="text-slate-300 font-bold block mb-1">
                Phone Number {orderType === 'delivery' && <span className="text-rose-400">*</span>}
              </label>
              <input
                type="text"
                required={orderType === 'delivery'}
                placeholder={orderType === 'delivery' ? 'e.g. +252 61 555 1234' : 'Optional Phone'}
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
                <span>Confirm Order & Complete (${(payableTotal || 0).toFixed(2)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
