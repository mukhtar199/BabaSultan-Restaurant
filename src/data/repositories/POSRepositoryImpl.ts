import { collection, addDoc, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
import { IPOSRepository } from '../../domain/repositories/IPOSRepository';
import { POSCheckoutPayload, ReceiptData } from '../../domain/entities/pos';
import { Order } from '../../types';

export class POSRepositoryImpl implements IPOSRepository {
  async createOrder(payload: POSCheckoutPayload): Promise<ReceiptData> {
    const timestamp = new Date().toISOString();
    const dateCode = new Date().toISOString().replace(/[-:T.]/g, '').slice(2, 10);
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateCode}-${randomSeq}`;

    const calculatedCOGS = payload.items.reduce((sum, item) => {
      const itemCost = (item.product.cost || item.product.price * 0.45) * item.quantity;
      return sum + itemCost;
    }, 0);

    const profit = payload.totalAmount - calculatedCOGS;

    // 1. Create Order Document in Firestore
    const newOrderData = {
      orderNumber,
      customerName: payload.customerName || 'Walk-in Customer',
      customerPhone: payload.customerPhone || '',
      orderType: payload.orderType,
      tableNumber: payload.tableNumber || '',
      items: payload.items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        notes: i.selectedNotes || ''
      })),
      subtotal: payload.subtotal,
      tax: payload.tax,
      discount: payload.discount,
      totalAmount: payload.totalAmount,
      cogs: calculatedCOGS,
      profit,
      employeeId: payload.employeeId,
      employeeName: payload.employeeName,
      status: 'completed',
      prepStatus: 'preparing',
      deliveryStatus: payload.orderType === 'delivery' ? 'assigned' : 'n/a',
      paymentMethod: payload.paymentMethod,
      amountTendered: payload.amountTendered || payload.totalAmount,
      changeDue: payload.changeDue || 0,
      createdAt: timestamp
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), newOrderData);

    // 2. Deduct Product Stock & Create Inventory Movements in Firestore
    for (const item of payload.items) {
      if (item.product && item.product.id) {
        try {
          const prodRef = doc(db, COLLECTIONS.PRODUCTS, item.product.id);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const currentStock = prodSnap.data().stock || 0;
            const currentSales = prodSnap.data().salesCount || 0;
            const newStock = Math.max(0, currentStock - item.quantity);

            await updateDoc(prodRef, {
              stock: newStock,
              salesCount: currentSales + item.quantity
            });

            // Log Inventory Movement
            await addDoc(collection(db, COLLECTIONS.INVENTORY_MOVEMENTS), {
              type: 'pos_sale',
              itemType: 'product',
              itemId: item.product.id,
              itemName: item.product.name,
              quantity: item.quantity,
              reason: `POS Sale Order #${orderNumber}`,
              createdBy: payload.employeeName,
              createdAt: timestamp
            });
          }
        } catch {
          // Log movement even if direct doc update fails
        }
      }
    }

    const receipt: ReceiptData = {
      orderId: docRef.id,
      orderNumber,
      timestamp,
      cashierName: payload.employeeName,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber,
      customerName: payload.customerName || 'Walk-in Customer',
      items: payload.items,
      subtotal: payload.subtotal,
      tax: payload.tax,
      discount: payload.discount,
      totalAmount: payload.totalAmount,
      paymentMethod: payload.paymentMethod,
      amountTendered: payload.amountTendered,
      changeDue: payload.changeDue
    };

    return receipt;
  }

  async fetchRecentOrders(): Promise<Order[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orders: Order[] = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() } as Order));
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
