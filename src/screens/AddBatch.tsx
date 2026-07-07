import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
} from 'react-native';
import { saveFlockBatch } from '../storage/database';
import { FlockBatch } from '../types'; 

export default function AddBatch({ navigation }: any) {
  const [batchName, setBatchName] = useState('');
  const [birdCount, setBirdCount] = useState('');
  const [supplier, setSupplier] = useState('');

  const handleSave = async () => {
    // 1. Validation to ensure professional data entry
    if (!batchName.trim()) {
      Alert.alert('Missing Information', 'Please enter a name for this batch.');
      return;
    }
    if (!birdCount.trim() || isNaN(Number(birdCount)) || Number(birdCount) <= 0) {
      Alert.alert('Invalid Entry', 'Please enter a valid number of starting birds.');
      return;
    }

    // 2. Format the data to include all required fields for the FlockBatch type
    const newBatch: FlockBatch = {
      id: Date.now().toString(),
      batchName: batchName.trim(),
      currentBirdCount: Number(birdCount),
      // --- ADD THESE MISSING PROPERTIES BELOW ---
      initialBirdCount: Number(birdCount), // Starts same as current
      mortalityCount: 0, 
      totalFeedConsumedKg: 0,                  // Starts at 0
      currentAverageWeightGrams: 0,        // Starts at 0
      isActive: true,                      // It is currently active
      // ------------------------------------------
      startDate: new Date().toLocaleDateString('en-GB'),
      supplierName: supplier, // <--- This saves the data to the database 
    };

    try {
      await saveFlockBatch(newBatch);
      navigation.goBack(); // Instantly returns to the refreshed dashboard
    } catch (error) {
      Alert.alert('Error', 'Could not save the batch. Please try again.');
    }
    const [isSubmitting, setIsSubmitting] = useState(false);

  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Start New Batch</Text>
            <Text style={styles.headerSubtitle}>Set up the details for your incoming flock.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Batch Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Broilers 2026"
              placeholderTextColor="#9ca3af"
              value={batchName}
              onChangeText={setBatchName}
            />

            <Text style={styles.label}>Initial Bird Count</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={birdCount}
              onChangeText={setBirdCount}
            />

            {/* --- ADD THIS NEW SUPPLIER SECTION --- */}
            <Text style={styles.label}>Supplier Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g., Irvine's" 
              placeholderTextColor="#9ca3af"
              value={supplier} 
              onChangeText={setSupplier} 
        />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE BATCH</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  scrollContent: { padding: 20 },
  headerContainer: { marginBottom: 24, marginTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  headerSubtitle: { fontSize: 15, color: '#6b7280', marginTop: 5 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#059669',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
