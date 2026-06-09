import { config } from '@/config';

export function initSentry() {
  if (!config.sentryDsn) return;

  try {
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: config.sentryDsn,
      enableInExpoDevelopment: false,
      debug: __DEV__,
    });
  } catch {
    // Sentry optional in dev
  }
}

export function captureException(error: unknown) {
  if (!config.sentryDsn) return;
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.captureException(error);
  } catch {
    // noop
  }
}
