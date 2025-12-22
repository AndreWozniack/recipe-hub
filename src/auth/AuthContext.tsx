import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthUser, AuthState, AuthConfig, IAuthProvider } from "./types";
import { initializeAuth, getAuthProvider, isAuthInitialized } from "./index";

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  config: AuthConfig;
}

export function AuthProvider({ children, config }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<IAuthProvider | null>(null);

  // Initialize auth provider
  useEffect(() => {
    try {
      const authProvider = initializeAuth(config);
      setProvider(authProvider);

      // Set up auth state listener
      const unsubscribe = authProvider.onAuthStateChanged((authUser) => {
        setUser(authUser);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize auth"
      );
      setLoading(false);
    }
  }, [config]);

  const signInWithGoogle = useCallback(async () => {
    if (!provider) return;
    setError(null);
    setLoading(true);
    try {
      await provider.signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!provider) return;
      setError(null);
      setLoading(true);
      try {
        await provider.signInWithEmail(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sign in");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [provider]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!provider) return;
      setError(null);
      setLoading(true);
      try {
        await provider.signUpWithEmail(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sign up");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [provider]
  );

  const signOut = useCallback(async () => {
    if (!provider) return;
    setError(null);
    try {
      await provider.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out");
      throw err;
    }
  }, [provider]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
