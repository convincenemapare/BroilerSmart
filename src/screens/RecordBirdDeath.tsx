// src/screens/RecordBirdDeath.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getFlockBatches, updateFlockBatch } from '../storage/database';
import { FlockBatch } from '../types';

export default function RecordBirdDeath({ route, navigation }: any) {
  const { batchId } = route.params;
  const [batch, setBatch] = useState<FlockBatch | null>(null);
  const [deathCount, setDeathCount] = useState('');

  useEffect(() => {
    const loadBatch = async () => {
      const batches = await getFlockBatches();
      const current = batches.find(b => b.id === batchId);
      if (current) setBatch(current);
    };
    loadBatch();
  }, [batchId]);

  const handleSave = async () => {
    const count = parseInt(deathCount);
    
    if (!count || count <= 0) {
      Alert.alert('Error', 'Please enter a valid number of birds');
      return;
    }
    if (!batch) return;
    if (count > batch.currentBirdCount) {
      Alert.alert('Error', 'You cannot record more deaths than living birds.');
      return;
    }

    const updatedBatch: FlockBatch = {
      ...batch,
      currentBirdCount: batch.currentBirdCount - count,
      mortalityCount: batch.mortalityCount + count,
    };

    await updateFlockBatch(updatedBatch);
    Alert.alert('Success', 'Bird death(s) recorded.');
    navigation.goBack();
  };

  if (!batch) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Record Mortality</Text>
      <Text style={styles.infoText}>Current Live Birds: {batch.currentBirdCount}</Text>
      
      <TextInput
        placeholder="Number of birds that died (e.g., 2)"
        value={deathCount}
        onChangeText={setDeathCount}
        keyboardType="numeric"
        style={styles.input}
      />
      
      <View style={styles.buttonWrapper}>
        <Button title="Save Record" onPress={handleSave} color="#DC2626" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#F9FAFB' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  infoText: { fontSize: 16, marginBottom: 20, color: '#4B5563' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 15, marginBottom: 20, borderRadius: 8, backgroundColor: '#fff' },
  buttonWrapper: { marginTop: 10 }
});
