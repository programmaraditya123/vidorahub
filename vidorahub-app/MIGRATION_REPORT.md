# VidoraHub Expo to React Native CLI Migration Report

## Dependency Mapping

| Expo package | React Native CLI replacement | Usage / notes |
| --- | --- | --- |
| `expo` | React Native `AppRegistry` / RN CLI | `index.ts`, scripts, Babel, Jest, and Android Gradle now use RN CLI. |
| `expo-application` | `react-native-device-info` | Installed; no direct source usage was found. |
| `expo-camera` | `react-native-vision-camera` | Installed for camera flows; no direct source usage was found. |
| `expo-clipboard` | `@react-native-clipboard/clipboard` | `src/components/ui/ShareBlade.tsx`. |
| `expo-constants` | `react-native-config` | `src/config/index.ts`, `.env`, `.env.example`, Android dotenv Gradle. |
| `expo-device` | `react-native-device-info` | `src/lib/notifications.ts`. |
| `expo-file-system` | `react-native-fs` | `src/services/api/authApi.ts` GCS upload task. |
| `expo-font` | Native/system font loading | Removed from `App.tsx`; no bundled font files were present. |
| `expo-image` | `react-native-fast-image` | `src/components/native/Image.tsx` compatibility wrapper and all image imports. |
| `expo-image-picker` | `react-native-image-picker` | `src/screens/upload/UploadSelectScreen.tsx`, `UploadContentScreen.tsx`. |
| `expo-linear-gradient` | `react-native-linear-gradient` | All gradient imports. |
| `expo-linking` | `Linking` from `react-native` | `src/navigation/linking.ts`. |
| `expo-network` | `@react-native-community/netinfo` | NetInfo was already present; no Expo Network source usage was found. |
| `expo-notifications` | `@react-native-firebase/messaging` + `@notifee/react-native` | `src/lib/notifications.ts`, Android channel metadata. |
| `expo-screen-orientation` | `react-native-orientation-locker` | `src/features/video/components/VideoPlayer.tsx`. |
| `expo-secure-store` | `react-native-keychain` | `src/lib/storage/secureStore.ts`. |
| `expo-splash-screen` | Android launch theme | Removed JS dependency; Android keeps native splash theme/resources. |
| `expo-status-bar` | `StatusBar` from `react-native` | `App.tsx`. |
| `expo-updates` | Optional `react-native-code-push` | Removed. CodePush is not installed; add it only after choosing App Center/CodePush deployment keys. |
| `expo-video` | `react-native-video` | `VideoPlayer.tsx`, `VibeSlide.tsx`, upload preview components. |
| `expo-video-thumbnails` | `react-native-create-thumbnail` | `UploadContentScreen.tsx`. |

## Changed Files

- Bootstrap/config: `App.tsx`, `index.ts`, `app.json`, `babel.config.js`, `jest.config.js`, `tsconfig.json`, `react-native.config.js`, `README.md`.
- Dependencies: `package.json`, `package-lock.json`.
- Environment: `.env`, `.env.example`.
- Native Android: `android/settings.gradle`, `android/build.gradle`, `android/app/build.gradle`, `android/gradle.properties`, `android/app/src/main/AndroidManifest.xml`, `MainActivity.kt`, `MainApplication.kt`, `strings.xml`, `proguard-rules.pro`, `android/app/google-services.json`.
- Expo image/icon/gradient import updates across shared UI, video, store, profile, search, upload, earn, and navigation components.
- Core replacements: `src/config/index.ts`, `src/lib/storage/secureStore.ts`, `src/lib/notifications.ts`, `src/navigation/linking.ts`, `src/services/api/authApi.ts`.
- Video/upload replacements: `src/features/video/components/VideoPlayer.tsx`, `src/features/vibes/components/VibeSlide.tsx`, `src/screens/upload/UploadSelectScreen.tsx`, `src/screens/upload/UploadContentScreen.tsx`.
- Added compatibility/types: `src/components/native/Image.tsx`, `src/types/react-native-vector-icons.d.ts`.

## Android Configuration

- RN CLI autolinking configured through `settings.gradle` and `react-native.config.js`.
- Android SDK values set explicitly: compile/target SDK 36, min SDK 24, NDK `27.1.12297006`.
- Firebase Google Services plugin applied.
- `react-native-config` dotenv Gradle integration added.
- App id remains `com.vidorahub.mobile`.
- Permissions added for camera, microphone, notifications, media reads, storage compatibility, vibration, and internet.
- Deep links added for `vidorahub://`, `https://www.vidorahub.com/video`, `/channel`, `/vibes`, and `https://vidorahub.com/video`.
- Default notification channel metadata added with manifest conflict override.
- Release signing placeholders use `VIDORAHUB_UPLOAD_STORE_FILE`, `VIDORAHUB_UPLOAD_STORE_PASSWORD`, `VIDORAHUB_UPLOAD_KEY_ALIAS`, and `VIDORAHUB_UPLOAD_KEY_PASSWORD`.

## Manual Steps

- Replace `android/app/google-services.json` with a real Firebase Android app config for package `com.vidorahub.mobile`. The checked-in Android copy was package-aligned only so Gradle can build; production Firebase/Auth/FCM requires a real client from Firebase Console.
- Configure Google Sign-In with the web client id in `GOOGLE_CLIENT_ID` and matching SHA-1/SHA-256 fingerprints in Firebase.
- For release builds/AABs, provide the four `VIDORAHUB_UPLOAD_*` signing values.
- Optional OTA: install/configure `react-native-code-push` after choosing deployment keys. Do not re-add `expo-updates`.
- Validate notification click routing with real FCM payloads on a physical device.

## Verification

- `npm run typecheck` passes.
- `android/app/build/outputs/apk/debug/app-debug.apk` was generated successfully by `.\gradlew.bat assembleDebug`.
- Targeted Expo source/config scan returned no Expo imports or `EXPO_PUBLIC_*` references outside ignored historical docs/lock optional peer metadata.

## Final Commands

```bash
cd vidorahub-app
npm install --legacy-peer-deps
npm start
npm run android
cd android
./gradlew assembleDebug
./gradlew assembleRelease
./gradlew bundleRelease
```

On Windows PowerShell, use `.\gradlew.bat assembleDebug`, `.\gradlew.bat assembleRelease`, and `.\gradlew.bat bundleRelease`.
