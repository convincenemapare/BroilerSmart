import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, TextInput, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import * as Clipboard from 'expo-clipboard';
import { getFlockBatches, getExpensesByBatch, getSalesByBatch, deleteExpense,deleteSale } from '../storage/database';
import { getExchangeRates } from '../storage/database';
import { calculateBatchFinancials, calculateMortalityRate } from '../services/poultryMath';
import { FlockBatch } from '../types';

const screenWidth = Dimensions.get('window').width;

export default function BatchDetails({ route, navigation }: any) {
  const { batchId, batchName } = route.params;
  const [batch, setBatch] = useState<FlockBatch | null>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
    // --- ADDED FOR FCR CALCULATOR ---
  const [feedKg, setFeedKg] = useState('');
  const [avgWeight, setAvgWeight] = useState('');


  const loadBatchData = async () => {
    const batches = await getFlockBatches();
    const currentBatch = batches.find(b => b.id === batchId);
    if (!currentBatch) return;

    const expenses = await getExpensesByBatch(batchId) || [];
    const sales = await getSalesByBatch(batchId) || [];
    const rates = await getExchangeRates() || {};

    const convertToUSD = (amount: number, currency: string) => {
      if (!currency || currency.toUpperCase() === 'USD') return amount;
      const curKey = currency.toUpperCase();
      
      if (rates && rates[curKey]) {
        const rate = parseFloat(rates[curKey]);
        if (rate > 0) return amount / rate;
      }
      
      if (curKey === 'ZAR') return amount / 20; 
      if (curKey === 'ZIG' || curKey === 'ZWG') return amount / 30;
      return amount;
    };

    const totalBirdsSold = sales.reduce((sum: number, s: any) => sum + (parseInt(s.quantity) || 0), 0);
    const dynamicCurrentBirdCount = Math.max(0, (currentBatch.initialBirdCount || 0) - (currentBatch.mortalityCount || 0) - totalBirdsSold);

    const updatedBatch = {
      ...currentBatch,
      currentBirdCount: dynamicCurrentBirdCount
    };
    setBatch(updatedBatch);

    setFinancials(calculateBatchFinancials(expenses, sales, dynamicCurrentBirdCount, rates));

    const breakdown = expenses.reduce((acc: any, curr: any) => {
      let cat = curr.category || 'Other';
      if ((cat === 'Other' || !cat) && curr.description) {
        cat = curr.description;
      }
      const amountInUSD = convertToUSD(parseFloat(curr.amount) || 0, curr.currency);
      acc[cat] = (acc[cat] || 0) + amountInUSD;
      return acc;
    }, {});

    const chartConfig = Object.keys(breakdown).map((key, index) => ({
      name: key,
      population: parseFloat(breakdown[key].toFixed(2)),
      color: ['#0284C7', '#166534', '#DC2626', '#F59E0B', '#7C3AED', '#EC4899'][index % 6],
      legendFontColor: '#374151',
    }));
    
    const validData = chartConfig.filter(item => item.population > 0);
    setExpenseData(validData);

    const combinedExpenses = expenses.map((e: any) => ({
      ...e,
      type: 'Expense',
      displayTitle: e.description || 'Expense',
      usdAmount: convertToUSD(parseFloat(e.amount) || 0, e.currency)
    }));

    const combinedSales = sales.map((s: any) => ({
      ...s,
      type: 'Sale',
      displayTitle: `${s.quantity} Birds Sold`,
      usdAmount: convertToUSD(parseFloat(s.amount) || 0, s.currency)
    }));

    const combined = [...combinedExpenses, ...combinedSales];
    setTransactions(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useFocusEffect(useCallback(() => { loadBatchData(); }, [batchId]));

  const handleExport = async () => {
    const header = 'Type,Description,Amount(USD),Date\n';
    const rows = transactions.map(t => `${t.type},${t.displayTitle},${Number(t.usdAmount).toFixed(2)},${t.date}`).join('\n');
    await Clipboard.setStringAsync(header + rows);
    Alert.alert('✅ Exported', 'Normalized USD transaction ledger copied to clipboard.');
  };

  const handleTransactionOptions = (transaction: any) => {
    Alert.alert(
      'Transaction Options',
      `What would you like to do with this ${transaction.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => {
            const screen = transaction.type === 'Expense' ? 'LogExpense' : 'LogSale';
            navigation.navigate(screen, { batchId: batchId, transactionToEdit: transaction });
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
             setTransactions(prev => prev.filter(t => t.id !== transaction.id));
             if (transaction.type === 'Expense') await deleteExpense(transaction.id);
             else await deleteSale(transaction.id);
             setTimeout(() => loadBatchData(), 500);
          },
        },
      ]
    );
  };

  const handleWhatsAppShare = async () => {
    // --- Added line to tackle the app from crashing before it fetches data from database
    if (!batch) return; 

    const message = `🐔 *${batchName} Update* 🐔\n\n` +
                    `📊 *Remaining Birds:* ${batch.currentBirdCount}\n` +
                    `📉 *Mortality Rate:* ${calculateMortalityRate(batch.initialBirdCount, batch.mortalityCount || 0).toFixed(1)}%\n` +
                    `💰 *Break-Even:* $${financials?.breakEvenPriceUSD?.toFixed(2) || '0.00'}\n` +
                    `⚡ *Current FCR:* ${fcrValue !== '0.00' ? fcrValue : 'Not calculated yet'}\n\n` +
                    `Shared via KukuSmart App 📱`;
    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the results.');
    }
  };

   if (!batch) return null;
     // --- FCR MATH ---
  const totalFlockWeight = batch.currentBirdCount * (parseFloat(avgWeight) || 0);
  const fcrValue = totalFlockWeight > 0 ? ((parseFloat(feedKg) || 0) / totalFlockWeight).toFixed(2) : '0.00';


  return (
    <ScrollView style={styles.container}>
      
      {/* --- ADDED: DISPLAY SUPPLIER NAME --- */}
      <View style={{ marginBottom: 20, alignItems: 'center' }}>
        <Text style={styles.title}>{batchName}</Text>
        <Text style={{ fontSize: 16, color: '#4B5563', fontWeight: '500' }}>
          Supplier: {batch.supplierName || 'Not recorded'}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Remaining Birds</Text>
          <Text style={styles.metricValue}>{batch.currentBirdCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Mortality Rate</Text>
          <Text style={styles.metricValue}>
            {calculateMortalityRate(batch.initialBirdCount, batch.mortalityCount || 0).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Expenses</Text>
          <Text style={styles.metricValue}>${financials?.totalExpensesUSD?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Break-Even Price</Text>
          <Text style={styles.metricValue}>${financials?.breakEvenPriceUSD?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>

            {/* --- ADDED: QUICK FCR CALCULATOR --- */}
      <View style={styles.fcrCard}>
        <Text style={styles.chartTitle}>⚡ Quick FCR Calculator</Text>
        <Text style={{fontSize: 12, color: 'gray', marginBottom: 10}}>
          FCR = Total Feed (kg) ÷ Total Flock Weight (kg). Ideal FCR is 1.5 to 1.8.
        </Text>
        
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
          <View style={{flex: 1, marginRight: 5}}>
            <Text style={styles.metricLabel}>Total Feed Used (kg)</Text>
            <TextInput 
              style={styles.fcrInput} 
              placeholder="e.g., 150" 
              keyboardType="numeric" 
              value={feedKg} 
              onChangeText={setFeedKg} 
            />
          </View>
          <View style={{flex: 1, marginLeft: 5}}>
            <Text style={styles.metricLabel}>Avg Bird Weight (kg)</Text>
            <TextInput 
              style={styles.fcrInput} 
              placeholder="e.g., 2.1" 
              keyboardType="numeric" 
              value={avgWeight} 
              onChangeText={setAvgWeight} 
            />
          </View>
        </View>
        
        <View style={{backgroundColor: '#e0f2fe', padding: 10, borderRadius: 5, alignItems: 'center'}}>
          <Text style={{fontSize: 14, color: '#0369a1', fontWeight: 'bold'}}>
            Current FCR: <Text style={{fontSize: 18}}>{fcrValue}</Text>
          </Text>
        </View>
      </View>

{/* piechart section */}
      {expenseData.length > 0 ? (
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>Expense Breakdown</Text>
          <PieChart
            data={expenseData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
            hasLegend={true}
          />
        </View>
      ) : (
        <View style={styles.chartWrapper}>
            <Text style={{color: 'red', textAlign: 'center'}}>No expense data found.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
        <Text style={styles.exportText}>📤 EXPORT DATA</Text>
      </TouchableOpacity>

            {/* --- WHATSAPP SHARE BUTTON --- */}
      <TouchableOpacity 
        style={{ backgroundColor: '#25D366', padding: 12, borderRadius: 8, marginBottom: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} 
        onPress={handleWhatsAppShare}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
          💬 SHARE RESULTS
        </Text>
      </TouchableOpacity>


      <TouchableOpacity 
        style={{ backgroundColor: '#0284C7', padding: 15, borderRadius: 5, marginBottom: 10, alignItems: 'center' }} 
        onPress={() => navigation.navigate('LogExpense', { batchId: batch.id })}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>LOG EXPENSE</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#DC2626', padding: 15, borderRadius: 5, marginBottom: 10, alignItems: 'center' }} 
        onPress={() => navigation.navigate('RecordBirdDeath', { batchId: batch.id })}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>RECORD BIRD DEATH</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ backgroundColor: '#166534', padding: 15, borderRadius: 5, marginBottom: 20, alignItems: 'center' }} 
        onPress={() => navigation.navigate('LogSale', { batchId: batch.id })}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>LOG SALE</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#374151' }}>
        Recent Transactions <Text style={{fontSize: 12, color: 'gray', fontWeight: 'normal'}}>(Long press to delete or edit)</Text>
      </Text>
      
      {transactions && transactions.length > 0 ? (
        transactions.map((t: any, index: number) => (
          <TouchableOpacity 
            key={index} 
            onLongPress={() => handleTransactionOptions(t)}
            delayLongPress={500}
            style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 10, color: 'gray', fontWeight: 'bold', letterSpacing: 1 }}>{t.type?.toUpperCase()}</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 2 }} numberOfLines={1}>{t.displayTitle}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                 {t.date ? new Date(t.date).toLocaleDateString() : 'Date unrecorded'}
              </Text>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: t.type === 'Sale' ? '#166534' : '#DC2626' }}>
                  {t.type === 'Sale' ? '+' : '-'}${Number(t.usdAmount || 0).toFixed(2)}
                </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ textAlign: 'center', color: 'gray', marginTop: 10, marginBottom: 30 }}>No transactions yet.</Text>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' }, // Simplified
  chartWrapper: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 20, alignItems: 'center', elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  exportButton: { backgroundColor: '#475569', padding: 12, borderRadius: 8, marginBottom: 20 },
  exportText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { flex: 1, backgroundColor: '#fff', padding: 12, marginHorizontal: 4, borderRadius: 8, elevation: 2, minHeight: 85, justifyContent: 'space-between' },
  metricLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  metricValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  //the style for FCR calculator
  fcrCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, elevation: 2 },
  fcrInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 8, marginTop: 4, backgroundColor: '#f9fafb' }

});
