import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { getExchangeRates, saveExchangeRates } from '../storage/database';

export default function Settings({ navigation }: any) {
  const [zarRate, setZarRate] = useState('');
  const [zigRate, setZigRate] = useState('');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const rates = await getExchangeRates();
    setZarRate(rates.ZAR.toString());
    setZigRate(rates.ZiG.toString());
  };

  const handleSave = async () => {
    await saveExchangeRates({ ZAR: parseFloat(zarRate), ZiG: parseFloat(zigRate) });
    Alert.alert('Success', 'Rates updated successfully!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.label}>1 USD equals how many ZAR?</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={zarRate} onChangeText={setZarRate} />
      
      <Text style={styles.label}>1 USD equals how many ZiG?</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={zigRate} onChangeText={setZigRate} />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>SAVE RATES</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  saveButton: { backgroundColor: '#0284C7', padding: 18, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' }
});
