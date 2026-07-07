import React, { useState, useCallback, useLayoutEffect  } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // 2. Add this import
import { getFlockBatches, deleteBatch } from '../storage/database'; // Ensure deleteBatch exists in your db
import { FlockBatch } from '../types';


export default function Dashboard({ navigation }: any) {
  const [batches, setBatches] = useState<FlockBatch[]>([]);

  // 3. PLACE THIS BLOCK HERE
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')} 
          style={{ marginRight: 15 }}
        >
          <Ionicons name="settings" size={24} color="#374151" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);



  const loadBatches = async () => {
    const data = await getFlockBatches();
    setBatches(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadBatches();
    }, [])

  );

  const handleDelete = (batchId: string) => {
    Alert.alert("Delete Batch", "Are you sure? This will remove all data for this batch.", [
      { text: "Cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          await deleteBatch(batchId);
          loadBatches();
        } 
      }
    ]);
  };

  const renderBatch = ({ item }: { item: FlockBatch }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('BatchDetails', { batchId: item.id, batchName: item.batchName })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.batchName}>{item.batchName}</Text>
        <Text style={styles.batchDetails}>Birds: {item.currentBirdCount} | Started: {item.startDate}</Text>
      </View>
      
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Farm</Text>
      
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate('AddBatch')}
      >
        <Text style={styles.addButtonText}>+ START NEW BATCH</Text>
      </TouchableOpacity>
      
  
    <TouchableOpacity 
      style={styles.compareButton} 
      onPress={() => navigation.navigate('BatchComparison')}
    >
      <Text style={styles.compareButtonText}>📊 COMPARE BATCHES</Text>
    </TouchableOpacity>

      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        renderItem={renderBatch}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No active batches. Start a new one!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, marginTop: 10 },
  addButton: { backgroundColor: '#059669', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 4 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContainer: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  cardContent: { flex: 1 },
  batchName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  batchDetails: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  deleteButton: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 8 },
  deleteText: { color: '#dc2626', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9ca3af', fontSize: 16 },

  // ADD THESE TWO:
  compareButton: {
    backgroundColor: '#6b7280', // A professional grey
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

});
