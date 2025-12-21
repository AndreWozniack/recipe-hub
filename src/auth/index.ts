import type { IAuthProvider, AuthConfig, AuthProviderType } from './types';
import { FirebaseAuthProvider } from './providers/FirebaseAuthProvider';
import { CustomAuthProvider } from './providers/CustomAuthProvider';

export type { IAuthProvider, AuthConfig, AuthProviderType, AuthUser, AuthState } from './types';

// Singleton instance
let authProviderInstance: IAuthProvider | null = null;

/**
 * Factory function to create the appropriate auth provider.
 * 
 * Usage:
 * 
 * // For Firebase
 * const auth = createAuthProvider({
 *   provider: 'firebase',
 *   firebaseConfig: { ... }
 * });
 * 
 * // For custom backend
 * const auth = createAuthProvider({
 *   provider: 'custom',
 *   customAuthUrl: 'https://your-api.com/auth'
 * });
 */
export function createAuthProvider(config: AuthConfig): IAuthProvider {
  switch (config.provider) {
    case 'firebase':
      return new FirebaseAuthProvider(config);
    case 'custom':
      return new CustomAuthProvider(config);
    default:
      throw new Error(`Unknown auth provider: ${config.provider}`);
  }
}

/**
 * Get the current auth provider instance.
 * Throws if not initialized.
 */
export function getAuthProvider(): IAuthProvider {
  if (!authProviderInstance) {
    throw new Error(
      'Auth provider not initialized. Call initializeAuth() first.'
    );
  }
  return authProviderInstance;
}

/**
 * Initialize the auth provider with specific configuration.
 * Call this at app startup.
 */
export function initializeAuth(config: AuthConfig): IAuthProvider {
  authProviderInstance = createAuthProvider(config);
  return authProviderInstance;
}

/**
 * Check if auth is initialized
 */
export function isAuthInitialized(): boolean {
  return authProviderInstance !== null;
}

/**
 * Get current provider type
 */
export function getCurrentAuthProvider(): AuthProviderType | null {
  if (authProviderInstance instanceof FirebaseAuthProvider) return 'firebase';
  if (authProviderInstance instanceof CustomAuthProvider) return 'custom';
  return null;
}
