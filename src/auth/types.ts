/**
 * Authentication Layer Types
 *
 * This abstraction allows switching between different auth providers
 * (Firebase, custom backend, etc.) without changing the rest of the app.
 */

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface IAuthProvider {
  // Get current user
  getCurrentUser(): AuthUser | null;

  // Auth state listener
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;

  // Sign in methods
  signInWithGoogle(): Promise<AuthUser>;
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signUpWithEmail(email: string, password: string): Promise<AuthUser>;

  // Sign out
  signOut(): Promise<void>;
}

// Provider types
export type AuthProviderType = "firebase" | "custom";

export interface AuthConfig {
  provider: AuthProviderType;
  // Firebase config
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  // Custom backend config
  customAuthUrl?: string;
}
