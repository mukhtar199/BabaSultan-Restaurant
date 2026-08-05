import { CartItem } from '../entities/pos';
import { SelectedOptionChoice } from '../../types';

export interface CartCalculationResult {
  subtotal: number;
  optionsTotal: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
}

export function calculateCartTotals(
  cart: CartItem[],
  taxRatePercent: number = 5,
  discountValue: number = 0,
  discountType: 'percentage' | 'fixed' = 'percentage'
): CartCalculationResult {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const optionsTotal = cart.reduce((sum, item) => {
    if (!item.selectedOptions || item.selectedOptions.length === 0) return sum;
    const itemOptCost = item.selectedOptions.reduce((oSum, opt) => oSum + (opt.priceModifier || 0), 0);
    return sum + (itemOptCost * item.quantity);
  }, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = Math.min(subtotal, discountValue);
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = (taxableAmount * taxRatePercent) / 100;
  const grandTotal = Math.max(0, taxableAmount + tax);

  return {
    subtotal,
    optionsTotal,
    tax,
    discountAmount,
    grandTotal
  };
}

export function calculateTenderChange(amountTendered: number, grandTotal: number) {
  const changeDue = Math.max(0, amountTendered - grandTotal);
  return {
    amountTendered,
    changeDue
  };
}

export function formatOptionSummary(options?: SelectedOptionChoice[]): string {
  if (!options || options.length === 0) return '';
  return options.map(o => `${o.choiceName}${o.priceModifier > 0 ? ` (+$${o.priceModifier.toFixed(2)})` : ''}`).join(', ');
}
