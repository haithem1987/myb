export interface Subscription {
  Id?: number;
  UserId: string;
  CopropertyId?: string;
  ServiceId: number;
  ServiceName: string;
  Price: number;
  PaymentStatus: 'Trial' | 'Paid' | 'Pending' | 'Failed' | string;
  PaymentMethod: string;
  ExpiryDate?: string;
  IsRecurring: boolean;
}
