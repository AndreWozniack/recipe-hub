import { AuthConfig } from "./types";

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

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA412dAxQvTykzo_c5SBBXvdCZocyQJjVs",
  authDomain: "recipes-hub-2b2c3.firebaseapp.com",
  projectId: "recipes-hub-2b2c3",
  storageBucket: "recipes-hub-2b2c3.firebasestorage.app",
  messagingSenderId: "330115789796",
  appId: "1:330115789796:web:b405cbbe46a816ff278df1",
  measurementId: "G-HHJRYM5LPZ",
  databaseURL: "https://recipes-hub-2b2c3-default-rtdb.firebaseio.com",
};

/**
 * Custom backend configuration (for future use)
 */
export const customConfig: AuthConfig = {
  provider: "custom",
  customAuthUrl: "https://your-api.com/auth",
};

/**
 * Current auth configuration
 * Change this to switch between providers
 */
export const authConfig: AuthConfig = {
  provider: "firebase",
  firebaseConfig: firebaseConfig,
};
