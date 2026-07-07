// App.tsx

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // The root component purely wraps the navigator for clean architecture
  return <AppNavigator />;
}
