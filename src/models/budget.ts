export interface Budget {
  _id: string;
  userId: string;
  category: string;
  amount: number;
  period: "monthly" | "yearly";
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

