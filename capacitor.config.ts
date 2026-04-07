import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hellopay.app',
  appName: 'HelloPay',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
