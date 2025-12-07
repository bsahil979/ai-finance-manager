export interface Goal {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  category: "emergency" | "vacation" | "car" | "house" | "education" | "other";
  status: "active" | "completed" | "paused" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export type GoalCategory = "emergency" | "vacation" | "car" | "house" | "education" | "other";
export type GoalStatus = "active" | "completed" | "paused" | "cancelled";


