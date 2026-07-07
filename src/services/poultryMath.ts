// src/services/poultryMath.ts
import { Expense, Sale } from '../types';
import { convertToUSD } from '../utils/currency';

export const calculateMortalityRate = (initial: number, dead: number) => {
  if (initial === 0) return 0;
  return (dead / initial) * 100;
};

export const calculateBatchFinancials = (expenses: Expense[], sales: Sale[], currentBirds: number, rates: { ZAR: number, ZiG: number }) => {
  // Helper to convert dynamically
  const convert = (amount: number, currency: string) => {
    if (currency === 'ZAR') return amount / rates.ZAR;
    if (currency === 'ZiG') return amount / rates.ZiG;
    return amount; // USD
  };

  const totalExpensesUSD = expenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency), 0);
  const totalSalesUSD = sales.reduce((sum, sale) => sum + convert(sale.amount, sale.currency), 0);

  const profitUSD = totalSalesUSD - totalExpensesUSD;
  const breakEvenPriceUSD = currentBirds > 0 ? (totalExpensesUSD / currentBirds) : 0;

  return { totalExpensesUSD, totalSalesUSD, profitUSD, breakEvenPriceUSD };
};


 // return {
   // totalExpensesUSD,
   // totalSalesUSD,
    //profitUSD,
    //breakEvenPriceUSD
 // };
//};
