export interface Notification {
  id: string;
  senderId: string;
  receiverId: string;
  copropertyId?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
