export interface Subscription {
  ServiceId: number;
  ServiceName: string;
  Price: number;
  PaymentStatus: string;
  ExpiryDate?: string; // Optional if not all subscriptions have an expiry date
}
