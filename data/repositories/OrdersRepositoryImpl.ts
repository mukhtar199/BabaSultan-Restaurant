import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
import { IOrdersRepository } from '../../domain/repositories/IOrdersRepository';
import { CreateOrderPayload } from '../../domain/entities/order';
import { Order } from '../../types';

export class OrdersRepositoryImpl implements IOrdersRepository {
  async fetchOrders(): Promise<Order[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const list: Order[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Order));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = payload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;
    const cogs = subtotal * 0.45;
    const profit = totalAmount - cogs;

    const mappedItems = payload.items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.price,
      unitCost: i.cost,
      totalPrice: i.price * i.quantity
    }));

    const newOrderData: Omit<Order, 'id'> = {
      orderNumber,
      customerName: payload.customerName || 'Walk-in Customer',
      orderType: (payload.type as any) || 'dine_in',
      items: mappedItems,
      subtotal,
      tax,
      discountAmount: (payload as any).discount || 0,
      totalAmount,
      cogs,
      profit,
      employeeId: payload.employeeId || 'emp-pos',
      employeeName: payload.employeeName || 'POS Staff',
      status: 'new',
      paymentMethod: payload.paymentMethod || 'cash',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
      type: payload.type || 'dine_in'
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), newOrderData);
    return { id: docRef.id, ...newOrderData };
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(docRef, { status });
  }
}
