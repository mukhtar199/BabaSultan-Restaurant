import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../lib/firebase';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
import {
  InventoryItem,
  InventoryMovement,
  PurchaseOrder,
  Supplier,
  SupplierPayment,
  InventoryItemStatus
} from '../../domain/entities/inventory';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('Firestore Inventory Note: ', JSON.stringify(errInfo));
}

export class InventoryRepositoryImpl implements IInventoryRepository {
  // Inventory Items
  async fetchInventoryItems(): Promise<InventoryItem[]> {
    try {
      const q = query(collection(db, COLLECTIONS.INVENTORY), orderBy('itemName', 'asc'));
      const snap = await getDocs(q);
      const items: InventoryItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as InventoryItem));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.INVENTORY);
      return [];
    }
  }

  subscribeInventoryItems(callback: (items: InventoryItem[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.INVENTORY), orderBy('itemName', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const items: InventoryItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as InventoryItem));
        callback(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.INVENTORY);
        callback([]);
      }
    );
  }

  async addInventoryItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    try {
      const newRef = doc(collection(db, COLLECTIONS.INVENTORY));
      const now = new Date().toISOString();
      const status = this.calculateStatus(
        itemData.currentQuantity,
        itemData.minimumQuantity,
        itemData.maximumQuantity,
        itemData.expirationDate
      );

      const newItem: InventoryItem = {
        ...itemData,
        id: newRef.id,
        status,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(newRef, newItem);

      // Record initial stock movement if quantity > 0
      if (itemData.currentQuantity > 0) {
        await this.recordMovement({
          type: 'stock_in',
          itemId: newItem.id,
          itemName: newItem.itemName,
          itemCode: newItem.itemCode,
          quantity: newItem.currentQuantity,
          unit: newItem.unit,
          previousQuantity: 0,
          newQuantity: newItem.currentQuantity,
          reason: 'Initial stock intake upon item creation',
          createdBy: 'System / Manager'
        });
      }

      return newItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.INVENTORY);
      throw err;
    }
  }

  async updateInventoryItem(id: string, updateData: Partial<InventoryItem>): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTIONS.INVENTORY, id);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) return;

      const current = snap.data() as InventoryItem;
      const updatedQty = updateData.currentQuantity !== undefined ? updateData.currentQuantity : current.currentQuantity;
      const minQty = updateData.minimumQuantity !== undefined ? updateData.minimumQuantity : current.minimumQuantity;
      const maxQty = updateData.maximumQuantity !== undefined ? updateData.maximumQuantity : current.maximumQuantity;
      const expDate = updateData.expirationDate !== undefined ? updateData.expirationDate : current.expirationDate;

      const status = this.calculateStatus(updatedQty, minQty, maxQty, expDate);

      const payload = {
        ...updateData,
        status,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(itemRef, payload as any);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.INVENTORY}/${id}`);
      throw err;
    }
  }

  async deleteInventoryItem(id: string): Promise<void> {
    try {
      const itemRef = doc(db, COLLECTIONS.INVENTORY, id);
      await deleteDoc(itemRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.INVENTORY}/${id}`);
      throw err;
    }
  }

  // Stock Movements
  async fetchMovements(): Promise<InventoryMovement[]> {
    try {
      const q = query(collection(db, COLLECTIONS.INVENTORY_MOVEMENTS), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const movements: InventoryMovement[] = [];
      snap.forEach((d) => movements.push({ id: d.id, ...d.data() } as InventoryMovement));
      return movements;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.INVENTORY_MOVEMENTS);
      return [];
    }
  }

  subscribeMovements(callback: (movements: InventoryMovement[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.INVENTORY_MOVEMENTS), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: InventoryMovement[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as InventoryMovement));
        callback(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.INVENTORY_MOVEMENTS)
    );
  }

  async recordMovement(movementData: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
    try {
      const newRef = doc(collection(db, COLLECTIONS.INVENTORY_MOVEMENTS));
      const fullMovement: InventoryMovement = {
        ...movementData,
        id: newRef.id,
        createdAt: new Date().toISOString()
      };
      await setDoc(newRef, fullMovement);
      return fullMovement;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.INVENTORY_MOVEMENTS);
      throw err;
    }
  }

  // Purchasing
  async fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const q = query(collection(db, COLLECTIONS.PURCHASE_ORDERS), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: PurchaseOrder[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PurchaseOrder));
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PURCHASE_ORDERS);
      return [];
    }
  }

  subscribePurchaseOrders(callback: (orders: PurchaseOrder[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.PURCHASE_ORDERS), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: PurchaseOrder[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PurchaseOrder));
        callback(list);
      },
      (err) => handleFirestoreError(err, OperationType.GET, COLLECTIONS.PURCHASE_ORDERS)
    );
  }

  async createPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> {
    try {
      const newRef = doc(collection(db, COLLECTIONS.PURCHASE_ORDERS));
      const now = new Date().toISOString();
      const po: PurchaseOrder = {
        ...poData,
        id: newRef.id,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(newRef, po);
      return po;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.PURCHASE_ORDERS);
      throw err;
    }
  }

  async updatePurchaseOrder(id: string, poData: Partial<PurchaseOrder>): Promise<void> {
    try {
      const poRef = doc(db, COLLECTIONS.PURCHASE_ORDERS, id);
      await updateDoc(poRef, {
        ...poData,
        updatedAt: new Date().toISOString()
      } as any);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.PURCHASE_ORDERS}/${id}`);
      throw err;
    }
  }

  async approvePurchaseOrder(id: string, approvedBy: string): Promise<void> {
    try {
      const poRef = doc(db, COLLECTIONS.PURCHASE_ORDERS, id);
      await updateDoc(poRef, {
        approvalStatus: 'approved',
        status: 'approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.PURCHASE_ORDERS}/${id}`);
      throw err;
    }
  }

  async receiveGoods(
    poId: string,
    receivedItems: { itemId: string; receivedQty: number; batchNumber?: string; expirationDate?: string }[],
    receivedBy: string
  ): Promise<void> {
    try {
      const poRef = doc(db, COLLECTIONS.PURCHASE_ORDERS, poId);
      const poSnap = await getDoc(poRef);
      if (!poSnap.exists()) return;

      const po = poSnap.data() as PurchaseOrder;
      const updatedItems = po.items.map((pi) => {
        const match = receivedItems.find((ri) => ri.itemId === pi.itemId);
        if (match) {
          const currentReceived = pi.receivedQuantity || 0;
          return {
            ...pi,
            receivedQuantity: currentReceived + match.receivedQty,
            batchNumber: match.batchNumber || pi.batchNumber,
            expirationDate: match.expirationDate || pi.expirationDate
          };
        }
        return pi;
      });

      // Check if completely received or partially
      let allFullyReceived = true;
      let totalReceivedSum = 0;
      updatedItems.forEach((item) => {
        const recv = item.receivedQuantity || 0;
        totalReceivedSum += recv;
        if (recv < item.requestedQuantity) {
          allFullyReceived = false;
        }
      });

      const nextStatus = allFullyReceived ? 'completed' : totalReceivedSum > 0 ? 'partially_received' : po.status;

      // Update PO document
      await updateDoc(poRef, {
        items: updatedItems,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      // Update inventory items stock & record stock_in movements
      for (const rec of receivedItems) {
        if (rec.receivedQty <= 0) continue;

        const invRef = doc(db, COLLECTIONS.INVENTORY, rec.itemId);
        const invSnap = await getDoc(invRef);
        if (invSnap.exists()) {
          const invItem = invSnap.data() as InventoryItem;
          const newQty = invItem.currentQuantity + rec.receivedQty;
          const status = this.calculateStatus(newQty, invItem.minimumQuantity, invItem.maximumQuantity, rec.expirationDate || invItem.expirationDate);

          await updateDoc(invRef, {
            currentQuantity: newQty,
            batchNumber: rec.batchNumber || invItem.batchNumber || '',
            expirationDate: rec.expirationDate || invItem.expirationDate || '',
            status,
            updatedAt: new Date().toISOString()
          });

          await this.recordMovement({
            type: 'stock_in',
            itemId: invItem.id,
            itemName: invItem.itemName,
            itemCode: invItem.itemCode,
            quantity: rec.receivedQty,
            unit: invItem.unit,
            previousQuantity: invItem.currentQuantity,
            newQuantity: newQty,
            reason: `Goods Receiving from PO #${po.poNumber}`,
            referenceId: po.poNumber,
            createdBy: receivedBy
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.PURCHASE_ORDERS}/${poId}/receive`);
      throw err;
    }
  }

  // Suppliers
  async fetchSuppliers(): Promise<Supplier[]> {
    try {
      const q = query(collection(db, COLLECTIONS.SUPPLIERS), orderBy('companyName', 'asc'));
      const snap = await getDocs(q);
      const list: Supplier[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Supplier));
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.SUPPLIERS);
      return [];
    }
  }

  subscribeSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    const q = query(collection(db, COLLECTIONS.SUPPLIERS), orderBy('companyName', 'asc'));
    return onSnapshot(
      q,
      (snap) => {
        const list: Supplier[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Supplier));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.SUPPLIERS);
        callback([]);
      }
    );
  }

  async addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    try {
      const newRef = doc(collection(db, COLLECTIONS.SUPPLIERS));
      const now = new Date().toISOString();
      const sup: Supplier = {
        ...supplierData,
        id: newRef.id,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(newRef, sup);
      return sup;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.SUPPLIERS);
      throw err;
    }
  }

  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<void> {
    try {
      const supRef = doc(db, COLLECTIONS.SUPPLIERS, id);
      await updateDoc(supRef, {
        ...supplierData,
        updatedAt: new Date().toISOString()
      } as any);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.SUPPLIERS}/${id}`);
      throw err;
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      const supRef = doc(db, COLLECTIONS.SUPPLIERS, id);
      await deleteDoc(supRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.SUPPLIERS}/${id}`);
      throw err;
    }
  }

  // Supplier Payments
  async fetchSupplierPayments(supplierId?: string): Promise<SupplierPayment[]> {
    try {
      let q = query(collection(db, COLLECTIONS.SUPPLIER_PAYMENTS), orderBy('paymentDate', 'desc'));
      if (supplierId) {
        q = query(collection(db, COLLECTIONS.SUPPLIER_PAYMENTS), where('supplierId', '==', supplierId), orderBy('paymentDate', 'desc'));
      }
      const snap = await getDocs(q);
      const list: SupplierPayment[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as SupplierPayment));
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.SUPPLIER_PAYMENTS);
      return [];
    }
  }

  async recordSupplierPayment(paymentData: Omit<SupplierPayment, 'id' | 'createdAt'>): Promise<SupplierPayment> {
    try {
      const newRef = doc(collection(db, COLLECTIONS.SUPPLIER_PAYMENTS));
      const now = new Date().toISOString();
      const payment: SupplierPayment = {
        ...paymentData,
        id: newRef.id,
        createdAt: now
      };
      await setDoc(newRef, payment);

      // Deduct payment amount from supplier outstanding balance
      const supRef = doc(db, COLLECTIONS.SUPPLIERS, paymentData.supplierId);
      const supSnap = await getDoc(supRef);
      if (supSnap.exists()) {
        const sup = supSnap.data() as Supplier;
        const newBalance = Math.max(0, sup.outstandingBalance - paymentData.amount);
        await updateDoc(supRef, { outstandingBalance: newBalance, updatedAt: now });
      }

      return payment;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.SUPPLIER_PAYMENTS);
      throw err;
    }
  }

  // Helper status calculation
  private calculateStatus(qty: number, min: number, max: number, expirationDate?: string): InventoryItemStatus {
    if (expirationDate) {
      const exp = new Date(expirationDate).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        return 'expired';
      }
    }
    if (qty <= 0) return 'out_of_stock';
    if (qty <= min) return 'low_stock';
    if (max > 0 && qty >= max) return 'overstock';
    return 'in_stock';
  }
}
