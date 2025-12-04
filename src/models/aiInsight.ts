export type AIInsightType = "spending_explanation" | "savings_tips";

export interface AIInsight {
  _id: string;
  userId: string;
  month: number; // 1-12
  year: number;
  type: AIInsightType;
  inputSummary: Record<string, unknown>;
  responseText: string;
  createdAt: Date;
}


