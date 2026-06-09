import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://fastapi-backend-475015.el.r.appspot.com',
  apiBaseUrlSecond:
    process.env.EXPO_PUBLIC_API_BASE_URL_SECOND ??
    'https://vidorahub.el.r.appspot.com',
  ffmpegWorkerUrl:
    process.env.EXPO_PUBLIC_FFMPEG_WORKER_URL ??
    'https://about-vidorahub-ffmpeg-worker.onrender.com',
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
  studioUrl: process.env.EXPO_PUBLIC_STUDIO_URL ?? 'https://studio.vidorahub.com',
  gcsBaseUrl:
    process.env.EXPO_PUBLIC_GCS_BASE_URL ??
    'https://storage.googleapis.com/vidorahub',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  },
  appScheme: 'vidorahub',
  requestTimeout: 15000,
  uploadTimeout: 600000,
  ...extra,
} as const;
