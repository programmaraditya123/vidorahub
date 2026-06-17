import Config from 'react-native-config';

function fromConfig(name: keyof typeof Config, fallback = '') {
  return Config[name] || fallback;
}

export const config = {
  apiBaseUrl:
    fromConfig('API_BASE_URL',
    'https://fastapi-backend-475015.el.r.appspot.com',
    ),
  apiBaseUrlSecond:
    fromConfig('API_BASE_URL_SECOND',
    'https://vidorahub.el.r.appspot.com',
    ),
  ffmpegWorkerUrl:
    fromConfig('FFMPEG_WORKER_URL',
    'https://about-vidorahub-ffmpeg-worker.onrender.com',
    ),
  googleClientId: fromConfig('GOOGLE_CLIENT_ID'),
  studioUrl: fromConfig('STUDIO_URL', 'https://studio.vidorahub.com'),
  gcsBaseUrl:
    fromConfig('GCS_BASE_URL',
    'https://storage.googleapis.com/vidorahub',
    ),
  sentryDsn: fromConfig('SENTRY_DSN'),
  firebase: {
    apiKey: fromConfig('FIREBASE_API_KEY'),
    authDomain: fromConfig('FIREBASE_AUTH_DOMAIN'),
    projectId: fromConfig('FIREBASE_PROJECT_ID'),
    storageBucket: fromConfig('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: fromConfig('FIREBASE_MESSAGING_SENDER_ID'),
    appId: fromConfig('FIREBASE_APP_ID'),
  },
  appScheme: 'vidorahub',
  requestTimeout: 15000,
  uploadTimeout: 600000,
} as const;
