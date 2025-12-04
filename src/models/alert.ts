export type AlertType = "renewal" | "unusual_spend";

export interface Alert {
  _id: string;
  userId: string;
  type: AlertType;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}


