import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { getFlockBatches, getExpensesByBatch, getSalesByBatch, getExchangeRates } from '../storage/database';
import { calculateBatchFinancials } from '../services/poultryMath';

const screenWidth = Dimensions.get('window').width;

export default function BatchComparison() {
  const [data, setData] = useState<any[]>([]);
  const [supplierStats, setSupplierStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComparisonData = async () => {
    setLoading(true);
    const batches = await getFlockBatches();
    const rates = await getExchangeRates();
    
    // 1. Process Individual Batch Data
    const comparisons = await Promise.all(
      batches.map(async (batch) => {
        const expenses = await getExpensesByBatch(batch.id);
        const sales = await getSalesByBatch(batch.id);
        
        // Ensure we handle both variable naming conventions safely
        const initialBirds = batch.initialBirdCount || 0;
        const currentBirds = batch.currentBirdCount || 0;
        const deadBirds = batch.mortalityCount || 0;
        
        const financials = calculateBatchFinancials(expenses, sales, currentBirds, rates);
        const mortalityRate = initialBirds > 0 ? (deadBirds / initialBirds) * 100 : 0;
        
        return {
          ...batch,
          ...financials,
          mortalityRate,
          displayName: batch.batchName || 'Unnamed Batch',
          supplierName: batch.supplierName || 'Not Recorded'
        };
      })
    );
    
    setData(comparisons);

    // 2. CRITICAL THINKING: Data Aggregation Engine for Suppliers
    // We group all batches by supplier to find out who has the best overall mortality rate
    const supplierMap: any = {};
    
    comparisons.forEach(c => {
      if (c.supplierName !== 'Not Recorded') {
        const sup = c.supplierName;
        if (!supplierMap[sup]) {
          supplierMap[sup] = { name: sup, totalBirds: 0, totalDead: 0 };
        }
        supplierMap[sup].totalBirds += (c.initialBirdCount || 0);
        supplierMap[sup].totalDead += (c.mortalityCount || 0);
      }
    });

    const leaderboard = Object.values(supplierMap).map((s: any) => ({
      name: s.name,
      avgMortality: s.totalBirds > 0 ? (s.totalDead / s.totalBirds) * 100 : 0
    })).sort((a, b) => a.avgMortality - b.avgMortality); // Sort lowest mortality (best) to top

    setSupplierStats(leaderboard);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadComparisonData();
    }, [])
  );

  const chartData = {
    labels: data.map(b => b.displayName.substring(0, 8)),
    datasets: [
      {
        data: data.map(b => b.profitUSD || 0)
      }
    ]
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Text style={styles.batchName}>{item.displayName}</Text>
        <View style={styles.supplierBadge}>
          <Text style={styles.supplierText}>{item.supplierName}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Mortality Rate:</Text>
        <Text style={[styles.value, { color: item.mortalityRate > 5 ? '#dc2626' : '#166534' }]}>
          {item.mortalityRate.toFixed(1)}%
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Profit (USD):</Text>
        <Text style={[styles.value, { color: item.profitUSD >= 0 ? '#166534' : '#dc2626' }]}>
          ${(item.profitUSD || 0).toFixed(2)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Break-Even:</Text>
        <Text style={styles.value}>${(item.breakEvenPriceUSD || 0).toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#0284C7" />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList 
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No batches to compare yet.</Text>}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>Profit Comparison</Text>
            
            {data.length > 0 && (
              <View style={styles.chartContainer}>
                <BarChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                    style: { borderRadius: 16 },
                  }}
                  style={{ marginVertical: 8, borderRadius: 16 }}
                  showValuesOnTopOfBars={true}
                />
              </View>
            )}

            {/* --- NEW: SUPPLIER LEADERBOARD --- */}
            {supplierStats.length > 0 && (
              <View style={styles.leaderboardContainer}>
                <Text style={styles.subHeader}>🏆 Supplier Mortality Leaderboard</Text>
                <View style={styles.leaderboardCard}>
                  {supplierStats.map((stat, index) => (
                    <View key={index} style={styles.leaderboardRow}>
                      <Text style={styles.leaderboardName}>
                        {index === 0 ? '🥇 ' : ''}{stat.name}
                      </Text>
                      <Text style={[styles.leaderboardScore, { color: stat.avgMortality > 5 ? '#dc2626' : '#166534' }]}>
                        {stat.avgMortality.toFixed(1)}% avg death
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.subHeader}>Detailed Metrics</Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  header: { fontSize: 24, fontWeight: 'bold', margin: 20, marginBottom: 10, color: '#1f2937' },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginTop: 10, marginBottom: 10, color: '#4b5563' },
  chartContainer: { alignItems: 'center', marginBottom: 15 },
  
  // New Leaderboard Styles
  leaderboardContainer: { marginBottom: 15 },
  leaderboardCard: { backgroundColor: '#fff', padding: 15, marginHorizontal: 20, borderRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  leaderboardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  leaderboardName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  leaderboardScore: { fontSize: 16, fontWeight: 'bold' },

  // Updated Card Styles
  card: { backgroundColor: '#fff', padding: 20, marginHorizontal: 20, borderRadius: 12, marginBottom: 15, elevation: 2 },
  batchName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  supplierBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  supplierText: { fontSize: 12, color: '#0369a1', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 15, color: '#4b5563' },
  value: { fontSize: 15, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9ca3af' }
});
