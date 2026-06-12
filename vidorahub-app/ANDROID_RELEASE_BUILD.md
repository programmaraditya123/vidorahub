# Android AAB release build

Use these steps to create a signed `.aab` for Google Play Console.

## 1. Check the keystore alias

```powershell
keytool -list -v -keystore "C:\Users\PREET\Downloads\vidorahub.keystore"
```

Enter the keystore password when prompted. Copy the `Alias name` value.

## 2. Set signing values for this PowerShell session

```powershell
cd D:\vidorahub\vidorahub-app

$env:VIDORAHUB_UPLOAD_STORE_FILE="C:\Users\PREET\Downloads\vidorahub.keystore"
$env:VIDORAHUB_UPLOAD_STORE_PASSWORD="YOUR_KEYSTORE_PASSWORD"
$env:VIDORAHUB_UPLOAD_KEY_ALIAS="YOUR_ALIAS_NAME"
$env:VIDORAHUB_UPLOAD_KEY_PASSWORD="YOUR_KEY_PASSWORD"
```

If the key password is the same as the keystore password, use the same value for both.

## 3. Build the release AAB

```powershell
cd D:\vidorahub\vidorahub-app\android
.\gradlew.bat clean bundleRelease
```

The upload file will be created here:

```text
D:\vidorahub\vidorahub-app\android\app\build\outputs\bundle\release\app-release.aab
```

Upload that `.aab` in Google Play Console.

## Troubleshooting

If Gradle fails with `Task '.keystore' not found`, the keystore path was split into a separate command-line argument. Keep the full path in one quoted environment variable as shown above, then run only:

```powershell
.\gradlew.bat clean bundleRelease
```

Note: Google Search Console is for websites/search indexing. Android app bundles are uploaded to Google Play Console.
