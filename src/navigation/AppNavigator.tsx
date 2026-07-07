// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//new for batch
import BatchComparison from '../screens/BatchComparison';
import Dashboard from '../screens/Dashboard';
import AddBatch from '../screens/AddBatch';
import BatchDetails from '../screens/BatchDetails';
import LogExpense from '../screens/LogExpense';
import RecordBirdDeath from '../screens/RecordBirdDeath';
import LogSale from '../screens/LogSale';
import Settings from '../screens/Settings'; // Added Settings import


export type RootStackParamList = {
  Dashboard: undefined;
  AddBatch: undefined;
  BatchDetails: { batchId: string; batchName: string };
  LogExpense: { batchId: string };
  RecordBirdDeath: { batchId: string };
  LogSale: { batchId: string };
  BatchComparison: undefined;
  Settings: undefined; // Added Settings here 
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: 'My Farm Overview' }} />
        <Stack.Screen name="AddBatch" component={AddBatch} options={{ title: 'Start New Batch' }} />
        <Stack.Screen name="BatchDetails" component={BatchDetails} options={({ route }) => ({ title: route.params.batchName })} />
        <Stack.Screen name="LogExpense" component={LogExpense} options={{ title: 'Log Expense' }} />
        <Stack.Screen name="RecordBirdDeath" component={RecordBirdDeath} options={{ title: 'Record Bird Death' }} />
        <Stack.Screen name="LogSale" component={LogSale} options={{ title: 'Log Sale' }} />
        <Stack.Screen name="BatchComparison" component={BatchComparison} options={{ title: 'Compare Batches' }} />
        <Stack.Screen name="Settings" component={Settings}options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
