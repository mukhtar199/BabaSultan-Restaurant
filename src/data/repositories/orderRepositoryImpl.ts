import { IOrderRepository } from '../../domain/repositories/orderRepository';
import { Order } from '../../types';
import { db, COLLECTIONS } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../infrastructure/firebase/errorHandler';

export class FirestoreOrderRepository implements IOrderRepository {
  async getOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.ORDERS);
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Order;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.ORDERS}/${id}`);
    }
  }

 async createOrder(order: Partial<Order>): Promise<string> {
  try {
    const cleanOrder = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
      ...cleanOrder,
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.ORDERS);
    throw err;
  }
}

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ORDERS, id);
      await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.ORDERS}/${id}`);
    }
  }

  subscribeOrders(onUpdate: (orders: Order[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        onUpdate(orders);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ORDERS);
      }
    );
  }
}
