import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vidorahub.mobile',
  appName: 'VidoraHub',
  webDir: 'public',

  server: {
    url: "https://www.vidorahub.com",
    cleartext: true
  }
};

export default config;