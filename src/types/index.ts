// src/types/index.ts

export type Currency = 'USD' | 'ZAR' | 'ZiG';

export interface Expense {
  id: string;
  batchId: string;
  amount: number;
  currency: Currency; // NEW
  description: string;
  date: string;
}

export interface Sale {
  id: string;
  batchId: string;
  amount: number;
  currency: Currency; // NEW
  quantity: number;
  date: string;
}

export interface FlockBatch {
  id: string;
  batchName: string;
  initialBirdCount: number;
  currentBirdCount: number;
  mortalityCount: number;
  totalFeedConsumedKg: number;
  currentAverageWeightGrams: number;
  isActive: boolean;
  startDate: string;
  supplierName: string; // <--- ADDED FOR THE SUPPLIER
}
