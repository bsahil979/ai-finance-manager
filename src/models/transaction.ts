export type TransactionType = "income" | "expense";

export interface Transaction {
  _id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string;
  rawDescription: string;
  category?: string;
  type: TransactionType;
  isSubscription: boolean;
  subscriptionId?: string;
  source: "csv" | "api" | "sms";
  createdAt: Date;
  updatedAt: Date;
}





