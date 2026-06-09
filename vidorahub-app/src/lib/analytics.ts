import { config } from '@/config';

let analyticsInitialized = false;

export async function initAnalytics() {
  if (analyticsInitialized || !config.firebase.projectId) return;

  try {
    const analytics = require('@react-native-firebase/analytics').default;
    await analytics().setAnalyticsCollectionEnabled(!__DEV__);
    analyticsInitialized = true;
  } catch {
    // Firebase optional until native build
  }
}

export async function logScreenView(screenName: string) {
  if (!config.firebase.projectId) return;
  try {
    const analytics = require('@react-native-firebase/analytics').default;
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch {
    // noop
  }
}

export async function logEvent(name: string, params?: Record<string, unknown>) {
  if (!config.firebase.projectId) return;
  try {
    const analytics = require('@react-native-firebase/analytics').default;
    await analytics().logEvent(name, params);
  } catch {
    // noop
  }
}
