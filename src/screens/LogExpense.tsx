import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { saveExpense, updateExpense } from '../storage/database'; 
import { Currency } from '../types';

export default function LogExpense({ route, navigation }: any) {
  const { batchId, transactionToEdit } = route.params || {};
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category || 'Other');
      setCurrency(transactionToEdit.currency || 'USD');
    }
  }, [transactionToEdit]);

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const expenseData = {
      ...(transactionToEdit || {}), // Keep ID if editing
      id: transactionToEdit ? transactionToEdit.id : Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      currency,
      date: transactionToEdit ? transactionToEdit.date : new Date().toISOString(),
      batchId: batchId
    };

    try {
      if (transactionToEdit) {
        await updateExpense(expenseData);
        Alert.alert("✅ Updated", "Expense updated successfully.");
      } else {
        await saveExpense(expenseData);
        Alert.alert("✅ Saved", "Expense added successfully.");
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("❌ Error", "Could not save expense.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{transactionToEdit ? 'Edit Expense' : 'Log Expense'}</Text>

      <View style={styles.currencyContainer}>
        {(['USD', 'ZAR', 'ZiG'] as Currency[]).map((curr) => (
          <TouchableOpacity 
            key={curr} 
            style={[styles.currencyBtn, currency === curr && styles.currencyBtnActive]}
            onPress={() => setCurrency(curr)}
          >
            <Text style={[styles.currencyText, currency === curr && styles.currencyTextActive]}>{curr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Description (e.g., Feed, Meds)" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{transactionToEdit ? 'UPDATE EXPENSE' : 'SAVE EXPENSE'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  currencyContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  currencyBtn: { flex: 1, padding: 12, backgroundColor: '#e5e7eb', marginHorizontal: 5, borderRadius: 8, alignItems: 'center' },
  currencyBtnActive: { backgroundColor: '#0284C7' },
  currencyText: { fontWeight: 'bold', color: '#374151' },
  currencyTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  saveButton: { backgroundColor: '#0284C7', padding: 18, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' }
});
