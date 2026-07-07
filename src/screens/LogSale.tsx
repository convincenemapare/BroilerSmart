import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { saveSale, updateSale } from '../storage/database'; // Added updateSale
import { Currency } from '../types';

export default function LogSale({ route, navigation }: any) {
  // Pull both batchId and the optional transactionToEdit from params
  const { batchId, transactionToEdit } = route.params || {};
  
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');

  // Pre-fill the form if we are editing an existing sale
  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setQuantity(transactionToEdit.quantity.toString());
      setCurrency(transactionToEdit.currency || 'USD');
    }
  }, [transactionToEdit]);

  const handleSave = async () => {
    if (!amount || !quantity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Construct the sale object
    const saleData = {
      ...(transactionToEdit || {}), // Keep existing ID and Date if editing
      id: transactionToEdit ? transactionToEdit.id : Date.now().toString(),
      batchId,
      amount: parseFloat(amount),
      quantity: parseInt(quantity),
      currency,
      date: transactionToEdit ? transactionToEdit.date : new Date().toISOString(),
    };

    try {
      if (transactionToEdit) {
        // Edit mode
        await updateSale(saleData);
        Alert.alert('✅ Updated', 'Sale updated successfully');
      } else {
        // Create mode
        await saveSale(saleData);
        Alert.alert('✅ Saved', 'Sale added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('❌ Error', 'Could not save sale');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{transactionToEdit ? 'Edit Sale' : 'Log Sale'}</Text>

      {/* Currency Selector */}
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

      <TextInput 
        style={styles.input} 
        placeholder="Number of Birds" 
        keyboardType="numeric" 
        value={quantity} 
        onChangeText={setQuantity} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Total Amount Received" 
        keyboardType="numeric" 
        value={amount} 
        onChangeText={setAmount} 
      />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
            {transactionToEdit ? 'UPDATE SALE' : 'SAVE SALE'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  currencyContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  currencyBtn: { flex: 1, padding: 12, backgroundColor: '#e5e7eb', marginHorizontal: 5, borderRadius: 8, alignItems: 'center' },
  currencyBtnActive: { backgroundColor: '#166534' },
  currencyText: { fontWeight: 'bold', color: '#374151' },
  currencyTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  saveButton: { backgroundColor: '#166534', padding: 18, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' }
});
