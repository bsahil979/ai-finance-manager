export interface RecurringTransaction {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  merchant?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate?: Date;
  nextOccurrence: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";


