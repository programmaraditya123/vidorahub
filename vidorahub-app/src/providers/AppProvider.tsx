import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { ToastProvider } from './ToastProvider';
import { ErrorBoundary } from './ErrorBoundary';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { initAnalytics } from '@/lib/analytics';
import { initSentry } from '@/lib/sentry';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
});

function AppStateListener() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => sub.remove();
  }, []);
  return null;
}

function NetworkListener() {
  const setOffline = useUiStore((s) => s.setOffline);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(!(state.isConnected && state.isInternetReachable !== false));
    });
    return unsub;
  }, [setOffline]);

  return null;
}

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
    initSentry();
    initAnalytics();
  }, [hydrate]);

  if (!isHydrated) return null;
  return <>{children}</>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <BottomSheetModalProvider>
                <AuthHydrator>
                  <AppStateListener />
                  <NetworkListener />
                  <OfflineBanner />
                  {children}
                  <ToastContainer />
                </AuthHydrator>
              </BottomSheetModalProvider>
            </ToastProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export { queryClient };
