import { AuthConfig } from './types';

/**
 * Firebase configuration
 * 
 * To set up:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Create a new project or select existing
 * 3. Go to Project Settings > General > Your apps > Add app (Web)
 * 4. Copy the config object values below
 * 5. Enable Google sign-in in Authentication > Sign-in method
 * 
 * IMPORTANT: Add your domain to authorized domains in Firebase Console:
 * Authentication > Settings > Authorized domains
 */
export const firebaseConfig: AuthConfig = {
  provider: 'firebase',
  firebaseConfig: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};

/**
 * Custom backend configuration (for future use)
 */
export const customConfig: AuthConfig = {
  provider: 'custom',
  customAuthUrl: 'https://your-api.com/auth',
};

/**
 * Current auth configuration
 * Change this to switch between providers
 */
export const authConfig = firebaseConfig;
