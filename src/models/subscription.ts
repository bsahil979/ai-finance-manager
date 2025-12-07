export type BillingCycle = "weekly" | "monthly" | "yearly" | "custom";

export interface Subscription {
  _id: string;
  userId: string;
  merchant: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate?: Date;
  status: "active" | "cancelled" | "paused";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}





