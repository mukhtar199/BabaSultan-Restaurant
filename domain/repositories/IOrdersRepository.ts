import { Order, CreateOrderPayload } from '../entities/order';

export interface IOrdersRepository {
  fetchOrders(): Promise<Order[]>;
  createOrder(payload: CreateOrderPayload): Promise<Order>;
  updateOrderStatus(orderId: string, status: Order['status']): Promise<void>;
}
