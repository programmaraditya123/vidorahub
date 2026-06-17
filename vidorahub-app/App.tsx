import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from '@/providers/AppProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <AppProvider>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </AppProvider>
  );
}
