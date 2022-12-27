import { Order } from './orders/order';

export class OrderData {
  constructor(private orderClass: typeof Order) {}
}
