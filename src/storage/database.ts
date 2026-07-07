// src/storage/database.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlockBatch, Expense, Sale } from '../types';

const BATCHES_KEY = '@kuku_batches';
const EXPENSES_KEY = '@kuku_expenses';
const SALES_KEY = '@kuku_sales';

// --- FLOCK BATCHES ---
export const getFlockBatches = async (): Promise<FlockBatch[]> => {
  const data = await AsyncStorage.getItem(BATCHES_KEY);
  return data ? JSON.parse(data) : [];
};
// ADD THIS NEW VERSION
export const saveFlockBatch = async (newBatch: FlockBatch) => {
  try {
    const existingData = await AsyncStorage.getItem(BATCHES_KEY);
    const batches = existingData ? JSON.parse(existingData) : [];
    batches.push(newBatch);
    await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  } catch (error) {
    console.error("Error saving batch:", error);
    throw error;
  }
};
// NEW: We need this to update the bird count when one dies or is sold
export const updateFlockBatch = async (updatedBatch: FlockBatch) => {
  const batches = await getFlockBatches();
  const index = batches.findIndex(b => b.id === updatedBatch.id);
  if (index > -1) {
    batches[index] = updatedBatch;
    await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
  }
};

export const deleteFlockBatch = async (id: string) => {
  const batches = await getFlockBatches();
  const filtered = batches.filter(b => b.id !== id);
  await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(filtered));
};

// --- EXPENSES ---
export const getExpensesByBatch = async (batchId: string): Promise<Expense[]> => {
  const data = await AsyncStorage.getItem(EXPENSES_KEY);
  const allExpenses: Expense[] = data ? JSON.parse(data) : [];
  return allExpenses.filter(e => e.batchId === batchId);
};

export const saveExpense = async (expense: Expense) => {
  const data = await AsyncStorage.getItem(EXPENSES_KEY);
  const expenses: Expense[] = data ? JSON.parse(data) : [];
  expenses.push(expense);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

// --- SALES ---
export const getSalesByBatch = async (batchId: string): Promise<Sale[]> => {
  const data = await AsyncStorage.getItem(SALES_KEY);
  const allSales: Sale[] = data ? JSON.parse(data) : [];
  return allSales.filter(s => s.batchId === batchId);
};

// NEW: We need this to save revenue
export const saveSale = async (sale: Sale) => {
  const data = await AsyncStorage.getItem(SALES_KEY);
  const sales: Sale[] = data ? JSON.parse(data) : [];
  sales.push(sale);
  await AsyncStorage.setItem(SALES_KEY, JSON.stringify(sales));
};
// added after upgrading the dashboard with a new button deleteBatch
export const deleteBatch = async (batchId: string) => {
  const data = await AsyncStorage.getItem(BATCHES_KEY);
  if (data) {
    const batches = JSON.parse(data);
    const updated = batches.filter((b: any) => b.id !== batchId);
    await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(updated));
  }
};

// Add these two to the bottom of src/storage/database.ts, with handling mismatches

export const deleteExpense = async (expenseToDelete: any) => {
  try {
    const data = await AsyncStorage.getItem(EXPENSES_KEY);
    if (data) {
      const expenses = JSON.parse(data);
      
      // CRITICAL THINKING: Check if we received an object OR just an ID string/number
      const idToMatch = typeof expenseToDelete === 'object' ? expenseToDelete.id : expenseToDelete;
      
      const updatedExpenses = expenses.filter((item: any) => item.id !== idToMatch);
      
      await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updatedExpenses));
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
  }
};

export const deleteSale = async (saleToDelete: any) => {
  try {
    const data = await AsyncStorage.getItem(SALES_KEY);
    if (data) {
      const sales = JSON.parse(data);
      
      // CRITICAL THINKING: Check if we received an object OR just an ID string/number
      const idToMatch = typeof saleToDelete === 'object' ? saleToDelete.id : saleToDelete;
      
      const updatedSales = sales.filter((item: any) => item.id !== idToMatch);
      
      await AsyncStorage.setItem(SALES_KEY, JSON.stringify(updatedSales));
    }
  } catch (error) {
    console.error("Error deleting sale:", error);
  }
};


// the new function for exchange rates
const RATES_KEY = 'user_exchange_rates';

export const getExchangeRates = async () => {
  const data = await AsyncStorage.getItem(RATES_KEY);
  // Default values if nothing is saved yet
  return data ? JSON.parse(data) : { ZAR: 20, ZiG: 14 }; 
};

export const saveExchangeRates = async (rates: { ZAR: number, ZiG: number }) => {
  await AsyncStorage.setItem(RATES_KEY, JSON.stringify(rates));
};
//a function to fetch everything related to a batch for the export.
export const getExportData = async (batchId: string) => {
  const expenses = await getExpensesByBatch(batchId);
  const sales = await getSalesByBatch(batchId);
  
  // Format for CSV (Comma Separated Values)
  const header = "Type,Description/Quantity,Amount,Currency,Date\n";
  const rows = [
    ...expenses.map(e => `Expense,${e.description},${e.amount},${e.currency},${e.date}`),
    ...sales.map(s => `Sale,${s.quantity} Birds,${s.amount},${s.currency},${s.date}`)
  ].join("\n");
  
  return header + rows;
};
// the edit feature to overide the old data
export const updateExpense = async (updatedExpense: Expense) => {
  const data = await AsyncStorage.getItem(EXPENSES_KEY);
  if (data) {
    const expenses = JSON.parse(data);
    const index = expenses.findIndex((e: any) => e.id === updatedExpense.id);
    if (index > -1) {
      expenses[index] = updatedExpense;
      await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    }
  }
};

export const updateSale = async (updatedSale: Sale) => {
  const data = await AsyncStorage.getItem(SALES_KEY);
  if (data) {
    const sales = JSON.parse(data);
    const index = sales.findIndex((s: any) => s.id === updatedSale.id);
    if (index > -1) {
      sales[index] = updatedSale;
      await AsyncStorage.setItem(SALES_KEY, JSON.stringify(sales));
    }
  }
};
