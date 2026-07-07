// src/utils/currency.ts
import { Currency } from '../types';

// These rates represent how many [Currency] units equal 1 USD
export const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  ZAR: 20, // Example rate
  ZiG: 14, // Example rate
};

export const convertToUSD = (amount: number, currency: Currency): number => {
  return amount / EXCHANGE_RATES[currency];
};
