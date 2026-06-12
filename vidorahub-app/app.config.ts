import { ExpoConfig, ConfigContext } from 'expo/config';

type GoogleServicesJson = {
  project_info?: {
    project_id?: string;
    storage_bucket?: string;
  };
  client?: Array<{
    api_key?: Array<{
      current_key?: string;
    }>;
    client_info?: {
      mobilesdk_app_id?: string;
      android_client_info?: {
        package_name?: string;
      };
    };
    oauth_client?: Array<{
      client_id?: string;
      client_type?: number;
    }>;
  }>;
};

const GOOGLE_SERVICES_FILE = './google-services.json';

function loadGoogleServices(): GoogleServicesJson | undefined {
  try {
    const fs = require('fs');
    const raw = fs.readFileSync(GOOGLE_SERVICES_FILE, 'utf8').trim();

    if (!raw) return undefined;

    return JSON.parse(raw) as GoogleServicesJson;
  } catch {
    return undefined;
  }
}

function valueFromEnvOrGoogle(envValue: string | undefined, googleValue?: string) {
  return envValue && envValue.length > 0 ? envValue : googleValue ?? '';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServices = loadGoogleServices();
  const firebaseClient = googleServices?.client?.find(
    (client) =>
      client.client_info?.android_client_info?.package_name === 'com.vidorahub.app',
  );
  const googleWebClientId = firebaseClient?.oauth_client?.find(
    (client) => client.client_type === 3,
  )?.client_id;
  const googleClientId = valueFromEnvOrGoogle(
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    googleWebClientId,
  );

  return {
    ...config,
    name: 'VidoraHub',
    slug: 'vidorahub-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'vidorahub',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.vidorahub.app',
      associatedDomains: ['applinks:www.vidorahub.com', 'applinks:vidorahub.com'],
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#7c3aed',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      package: 'com.vidorahub.app',
      googleServicesFile: GOOGLE_SERVICES_FILE,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'https', host: 'www.vidorahub.com', pathPrefix: '/video' },
            { scheme: 'https', host: 'www.vidorahub.com', pathPrefix: '/channel' },
            { scheme: 'https', host: 'www.vidorahub.com', pathPrefix: '/vibes' },
            { scheme: 'https', host: 'vidorahub.com', pathPrefix: '/video' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      ...config.extra,
      googleClientId,
      firebase: {
        apiKey: valueFromEnvOrGoogle(
          process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          firebaseClient?.api_key?.[0]?.current_key,
        ),
        authDomain: valueFromEnvOrGoogle(
          process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          googleServices?.project_info?.project_id
            ? `${googleServices.project_info.project_id}.firebaseapp.com`
            : undefined,
        ),
        projectId: valueFromEnvOrGoogle(
          process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          googleServices?.project_info?.project_id,
        ),
        storageBucket: valueFromEnvOrGoogle(
          process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          googleServices?.project_info?.storage_bucket,
        ),
        messagingSenderId:
          process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: valueFromEnvOrGoogle(
          process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
          firebaseClient?.client_info?.mobilesdk_app_id,
        ),
      },
    },
    plugins: [
      'expo-font',
      'expo-video',
      'expo-secure-store',
      'expo-splash-screen',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#7c3aed',
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: googleClientId
            ? `com.googleusercontent.apps.${googleClientId.split('.')[0]}`
            : 'com.googleusercontent.apps.placeholder',
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      '@react-native-firebase/messaging',
    ],
    runtimeVersion: {
      policy: 'appVersion',
    },
  };
};
