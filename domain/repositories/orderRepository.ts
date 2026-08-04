import { Order } from '../../types';

export interface IOrderRepository {
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(order: Partial<Order>): Promise<string>;
  updateOrderStatus(id: string, status: Order['status']): Promise<void>;
  subscribeOrders(onUpdate: (orders: Order[]) => void): () => void;
}
