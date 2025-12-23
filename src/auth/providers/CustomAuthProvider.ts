import { IAuthProvider, AuthUser, AuthConfig } from "../types";

/**
 * Placeholder for custom authentication provider.
 *
 * Implement this class when you want to use your own backend for authentication.
 *
 * Example implementation would:
 * - Call your backend API for authentication
 * - Store tokens in localStorage/sessionStorage
 * - Handle token refresh
 */
export class CustomAuthProvider implements IAuthProvider {
  private baseUrl: string;
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor(config: AuthConfig) {
    this.baseUrl = config.customAuthUrl || "/api/auth";
    console.warn(
      "CustomAuthProvider is a placeholder. Implement your own authentication logic.",
    );

    // Load user from storage on init
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch {
        this.currentUser = null;
      }
    }
  }

  private saveUser(user: AuthUser | null): void {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
    this.currentUser = user;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.currentUser));
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.currentUser);

    return () => {
      this.listeners.delete(callback);
    };
  }

  async signInWithGoogle(): Promise<AuthUser> {
    // TODO: Implement OAuth flow with your backend
    // Example:
    // 1. Open popup to your backend OAuth endpoint
    // 2. Backend handles Google OAuth and returns user + token
    // 3. Store token and return user
    throw new Error(
      "CustomAuthProvider.signInWithGoogle() not implemented. " +
        "Add your OAuth logic here.",
    );
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    // TODO: Implement email/password login with your backend
    // Example:
    // const response = await fetch(`${this.baseUrl}/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    // const { user, token } = await response.json();
    // localStorage.setItem('auth_token', token);
    // this.saveUser(user);
    // return user;
    throw new Error(
      "CustomAuthProvider.signInWithEmail() not implemented. " +
        "Add your login logic here.",
    );
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthUser> {
    // TODO: Implement email/password signup with your backend
    throw new Error(
      "CustomAuthProvider.signUpWithEmail() not implemented. " +
        "Add your signup logic here.",
    );
  }

  async signOut(): Promise<void> {
    // TODO: Call your backend to invalidate session
    // await fetch(`${this.baseUrl}/logout`, { method: 'POST' });
    localStorage.removeItem("auth_token");
    this.saveUser(null);
  }
}
