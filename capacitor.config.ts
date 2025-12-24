import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.upasnaborewells.app',
  appName: 'Upasna Borewells',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
