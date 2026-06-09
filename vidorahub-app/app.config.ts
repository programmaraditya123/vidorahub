import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
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
    googleServicesFile: './google-services.json',
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
        iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
          ? `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID.split('.')[0]}`
          : 'com.googleusercontent.apps.placeholder',
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    '@react-native-firebase/messaging',
  ],
  extra: {
    eas: {
      projectId: 'vidorahub-app',
    },
  },
  updates: {
    url: 'https://u.expo.dev/vidorahub-app',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
});
