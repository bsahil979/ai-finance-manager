export interface User {
  _id: string;
  email: string;
  name?: string;
  currency: string; // e.g. "USD"
  monthlyIncome?: number;
  createdAt: Date;
  updatedAt: Date;
}





