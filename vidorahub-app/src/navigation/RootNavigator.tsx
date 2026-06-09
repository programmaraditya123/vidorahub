import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { useAuthStore } from '@/store/authStore';
import { Loader } from '@/components/ui/Loader';
import { logScreenView } from '@/lib/analytics';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return <Loader />;
  }

  return (
    <NavigationContainer
      linking={linking as never}
      onStateChange={() => {
        // Screen tracking handled per-screen via useFocusEffect where needed
      }}
      onReady={() => {
        logScreenView('AppReady');
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export { linking } from './linking';
export type * from './types';
