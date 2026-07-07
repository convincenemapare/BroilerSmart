// utils/validation.ts
import { Alert } from 'react-native';

export const validateNumericInput = (value: string, fieldName: string) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    Alert.alert("Invalid Input", `Please enter a valid positive number for ${fieldName}.`);
    return false;
  }
  return true;
};
