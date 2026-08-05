import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, COLLECTIONS, deductProductIngredientsStockFirestore } from '../../lib/firebase';
import {
  KitchenTicket,
  KitchenStation,
  KitchenPrepStatus,
  KitchenOrderPriority,
  KitchenWasteLog,
  KitchenStationType,
  KitchenOrderItem
} from '../../domain/entities/kitchen';
import { KitchenRepository } from '../../domain/repositories/KitchenRepository';

export function routeProductToStation(productName: string, category?: string): KitchenStationType {
  const combined = `${productName} ${category || ''}`.toLowerCase();
  
  if (
    combined.includes('pizza') ||
    combined.includes('bakery') ||
    combined.includes('pie') ||
    combined.includes('pastry') ||
    combined.includes('canjeero') ||
    combined.includes('sambusa') ||
    combined.includes('samosa')
  ) {
    return 'pizza';
  }

  if (
    combined.includes('tea') ||
    combined.includes('shaah') ||
    combined.includes('juice') ||
    combined.includes('coffee') ||
    combined.includes('drink') ||
    combined.includes('soda') ||
    combined.includes('water') ||
    combined.includes('beverage') ||
    combined.includes('milk')
  ) {
    return 'drinks';
  }

  if (
    combined.includes('dessert') ||
    combined.includes('cake') ||
    combined.includes('ice cream') ||
    combined.includes('halwa') ||
    combined.includes('sweet') ||
    combined.includes('pancake') ||
    combined.includes('crepe')
  ) {
    return 'dessert';
  }

  if (
    combined.includes('grill') ||
    combined.includes('suqaar') ||
    combined.includes('camel') ||
    combined.includes('mandi') ||
    combined.includes('lamb') ||
    combined.includes('chicken') ||
    combined.includes('steak') ||
    combined.includes('meat') ||
    combined.includes('kebab') ||
    combined.includes('bbq') ||
    combined.includes('bariis') ||
    combined.includes('rice')
  ) {
    return 'grill';
  }

  return 'packing';
}

export class KitchenRepositoryImpl implements KitchenRepository {

  subscribeKitchenTickets(callback: (tickets: KitchenTicket[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.KITCHEN_ORDERS), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snap) => {
      try {
        if (snap.empty) {
          // Fallback: build tickets from main orders collection if kitchen_orders empty
          let fallbackTickets: KitchenTicket[] = [];
          try {
            const ordersSnap = await getDocs(query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc')));
            fallbackTickets = ordersSnap.docs.map(d => {
              const data = d.data();
              const items: KitchenOrderItem[] = (data.items || []).map((item: any) => ({
                productId: item.productId || 'p_0',
                productName: item.productName || 'Dish Item',
                quantity: item.quantity || 1,
                notes: item.notes || '',
                selectedOptions: item.selectedOptions || [],
                assignedStation: routeProductToStation(item.productName || ''),
                itemStatus: (data.status === 'completed' ? 'completed' : data.status === 'ready_for_pickup' ? 'ready' : data.status === 'in_preparation' ? 'cooking' : 'new') as KitchenPrepStatus
              }));

              const rawStatus = data.status || 'new';
              let prepStatus: KitchenPrepStatus = 'new';
              if (rawStatus === 'confirmed' || rawStatus === 'accepted') prepStatus = 'accepted';
              else if (rawStatus === 'in_preparation' || rawStatus === 'preparing') prepStatus = 'cooking';
              else if (rawStatus === 'ready_for_pickup' || rawStatus === 'ready') prepStatus = 'ready_for_pickup';
              else if (rawStatus === 'completed' || rawStatus === 'delivered') prepStatus = 'completed';
              else if (rawStatus === 'cancelled') prepStatus = 'cancelled';

              return {
                id: d.id,
                orderId: d.id,
                orderNumber: data.orderNumber || `ORD-${d.id.slice(0, 5)}`,
                orderTime: data.createdAt || new Date().toISOString(),
                orderType: data.orderType || data.type || 'dine_in',
                tableNumber: data.tableNumber || '',
                customerName: data.customerName || 'Walk-in Guest',
                items,
                prepStatus,
                priority: data.priority || 'normal',
                estimatedPrepTimeMinutes: data.prepTimeMinutes || 15,
                notes: data.notes || '',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString()
              };
            });
          } catch (e) {
            console.warn('Error fetching fallback orders in kitchen listener:', e);
          }
          callback(fallbackTickets);
        } else {
          const tickets: KitchenTicket[] = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as KitchenTicket));
          callback(tickets);
        }
      } catch (err) {
        console.warn('Error handling kitchen tickets snapshot:', err);
      }
    }, (err) => {
      console.warn('Kitchen tickets snapshot listener error:', err);
    });

    return unsubscribe;
  }

  subscribeKitchenStations(callback: (stations: KitchenStation[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.STATIONS));
    return onSnapshot(q, (snap) => {
      const stations: KitchenStation[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as KitchenStation));
      callback(stations);
    }, (err) => {
      console.warn('Kitchen stations snapshot error:', err);
    });
  }

  async getKitchenTickets(): Promise<KitchenTicket[]> {
    const q = query(collection(db, COLLECTIONS.KITCHEN_ORDERS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      const ordersSnap = await getDocs(query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc')));
      return ordersSnap.docs.map(d => {
        const data = d.data();
        const items: KitchenOrderItem[] = (data.items || []).map((item: any) => ({
          productId: item.productId || 'p_0',
          productName: item.productName || 'Dish Item',
          quantity: item.quantity || 1,
          notes: item.notes || '',
          selectedOptions: item.selectedOptions || [],
          assignedStation: routeProductToStation(item.productName || ''),
          itemStatus: (data.status === 'completed' ? 'completed' : data.status === 'ready_for_pickup' ? 'ready' : data.status === 'in_preparation' ? 'cooking' : 'new') as KitchenPrepStatus
        }));

        let prepStatus: KitchenPrepStatus = 'new';
        if (data.status === 'confirmed' || data.status === 'accepted') prepStatus = 'accepted';
        else if (data.status === 'in_preparation' || data.status === 'preparing') prepStatus = 'cooking';
        else if (data.status === 'ready_for_pickup' || data.status === 'ready') prepStatus = 'ready_for_pickup';
        else if (data.status === 'completed') prepStatus = 'completed';
        else if (data.status === 'cancelled') prepStatus = 'cancelled';

        return {
          id: d.id,
          orderId: d.id,
          orderNumber: data.orderNumber || `ORD-${d.id.slice(0, 5)}`,
          orderTime: data.createdAt || new Date().toISOString(),
          orderType: data.orderType || 'dine_in',
          tableNumber: data.tableNumber || '',
          customerName: data.customerName || 'Guest',
          items,
          prepStatus,
          priority: data.priority || 'normal',
          estimatedPrepTimeMinutes: 15,
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      });
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as KitchenTicket));
  }

  async getKitchenStations(): Promise<KitchenStation[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.STATIONS));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as KitchenStation));
  }

  async updateTicketStatus(ticketId: string, status: KitchenPrepStatus): Promise<void> {
    const nowIso = new Date().toISOString();
    const ticketRef = doc(db, COLLECTIONS.KITCHEN_ORDERS, ticketId);
    
    // Check if kitchen order doc exists
    const ticketDoc = await getDoc(ticketRef);
    const updates: any = {
      prepStatus: status,
      updatedAt: nowIso
    };

    if (status === 'cooking' && !ticketDoc.data()?.startedAt) {
      updates.startedAt = nowIso;
    } else if (status === 'ready_for_pickup') {
      updates.readyAt = nowIso;
    } else if (status === 'completed') {
      updates.completedAt = nowIso;
    }

    if (ticketDoc.exists()) {
      await updateDoc(ticketRef, updates);
    } else {
      // If doc didn't exist in kitchen_orders, create/set it
      await setDoc(ticketRef, updates, { merge: true });
    }

    // Also update main sales order status in `orders` collection
    const orderRef = doc(db, COLLECTIONS.ORDERS, ticketId);
    let mappedOrderStatus: string = 'new';
    if (status === 'accepted') mappedOrderStatus = 'confirmed';
    else if (status === 'cooking') mappedOrderStatus = 'in_preparation';
    else if (status === 'ready_for_pickup') mappedOrderStatus = 'ready_for_pickup';
    else if (status === 'completed') mappedOrderStatus = 'completed';
    else if (status === 'cancelled') mappedOrderStatus = 'cancelled';

    await updateDoc(orderRef, {
      status: mappedOrderStatus,
      updatedAt: nowIso,
      ...(status === 'completed' ? { completedAt: nowIso, paymentStatus: 'paid' } : {})
    }).catch(err => console.warn('Main order sync warning:', err));

    // Deduct ingredient inventory on order completion
    if (status === 'completed') {
      const orderData = ticketDoc.exists() ? ticketDoc.data() : (await getDoc(orderRef)).data();
      if (orderData && orderData.items) {
        for (const item of orderData.items) {
          if (item.productId) {
            await deductProductIngredientsStockFirestore(item.productId, item.quantity || 1, orderData.orderNumber || ticketId);
          }
        }
      }
    }
  }

  async updateTicketPriority(ticketId: string, priority: KitchenOrderPriority): Promise<void> {
    const ticketRef = doc(db, COLLECTIONS.KITCHEN_ORDERS, ticketId);
    const docSnap = await getDoc(ticketRef);
    if (docSnap.exists()) {
      await updateDoc(ticketRef, { priority, updatedAt: new Date().toISOString() });
    } else {
      await setDoc(ticketRef, { priority, updatedAt: new Date().toISOString() }, { merge: true });
    }
  }

  async updateItemStatusInTicket(ticketId: string, productId: string, itemStatus: KitchenPrepStatus): Promise<void> {
    const ticketRef = doc(db, COLLECTIONS.KITCHEN_ORDERS, ticketId);
    const docSnap = await getDoc(ticketRef);
    if (docSnap.exists()) {
      const ticket = docSnap.data() as KitchenTicket;
      const updatedItems = (ticket.items || []).map(item => {
        if (item.productId === productId) {
          return { ...item, itemStatus };
        }
        return item;
      });

      // Check if all items are ready or cooking
      const allReady = updatedItems.every(i => i.itemStatus === 'ready_for_pickup' || i.itemStatus === 'completed');
      const anyCooking = updatedItems.some(i => i.itemStatus === 'cooking' || i.itemStatus === 'ready_for_pickup');

      let newPrepStatus = ticket.prepStatus;
      if (allReady) newPrepStatus = 'ready_for_pickup';
      else if (anyCooking && ticket.prepStatus === 'new') newPrepStatus = 'cooking';

      await updateDoc(ticketRef, {
        items: updatedItems,
        prepStatus: newPrepStatus,
        updatedAt: new Date().toISOString()
      });
    }
  }

  async updateStationStatus(stationId: string, status: 'normal' | 'busy' | 'overloaded', chefName?: string): Promise<void> {
    const stationRef = doc(db, COLLECTIONS.STATIONS, stationId);
    const updates: any = { status };
    if (chefName) updates.assignedChef = chefName;
    await updateDoc(stationRef, updates);
  }

  async createKitchenTicketFromOrder(order: any): Promise<KitchenTicket> {
    const nowIso = new Date().toISOString();
    const items: KitchenOrderItem[] = (order.items || []).map((i: any) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      notes: i.notes || '',
      selectedOptions: i.selectedOptions || [],
      assignedStation: routeProductToStation(i.productName, i.category),
      itemStatus: 'new'
    }));

    const ticket: KitchenTicket = {
      id: order.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderTime: order.createdAt || nowIso,
      orderType: order.orderType || 'dine_in',
      tableNumber: order.tableNumber || '',
      customerName: order.customerName || 'Guest',
      items,
      prepStatus: 'new',
      priority: 'normal',
      estimatedPrepTimeMinutes: 15,
      notes: order.notes || '',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const ticketRef = doc(db, COLLECTIONS.KITCHEN_ORDERS, order.id);
    await setDoc(ticketRef, ticket);
    return ticket;
  }

  async logKitchenWaste(wasteData: Omit<KitchenWasteLog, 'id' | 'createdAt'>): Promise<string> {
    const nowIso = new Date().toISOString();
    const newRef = doc(collection(db, COLLECTIONS.KITCHEN_WASTE));
    const fullLog: KitchenWasteLog = {
      ...wasteData,
      id: newRef.id,
      createdAt: nowIso
    };
    await setDoc(newRef, fullLog);

    // Record as inventory movement log for audit trail
    await addDoc(collection(db, COLLECTIONS.MOVEMENTS), {
      type: 'waste',
      itemType: 'ingredient',
      itemId: wasteData.itemOrIngredientName.toLowerCase().replace(/\s+/g, '_'),
      itemName: wasteData.itemOrIngredientName,
      quantity: wasteData.quantity,
      reason: `Kitchen Waste: ${wasteData.reason} (Cost $${wasteData.cost})`,
      createdBy: wasteData.loggedBy || 'Kitchen Staff',
      createdAt: nowIso
    });

    return newRef.id;
  }

  async fetchKitchenWasteLogs(): Promise<KitchenWasteLog[]> {
    const q = query(collection(db, COLLECTIONS.KITCHEN_WASTE), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as KitchenWasteLog));
  }
}
