import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { IAuthProvider, AuthUser, AuthConfig } from "../types";

function mapFirebaseUser(user: FirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export class FirebaseAuthProvider implements IAuthProvider {
  private app: FirebaseApp;
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;

  constructor(config: AuthConfig) {
    if (!config.firebaseConfig) {
      throw new Error("Firebase configuration is required");
    }

    this.app = initializeApp(config.firebaseConfig);
    this.auth = getAuth(this.app);
    this.googleProvider = new GoogleAuthProvider();
  }

  getCurrentUser(): AuthUser | null {
    return mapFirebaseUser(this.auth.currentUser);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(this.auth, (user) => {
      callback(mapFirebaseUser(user));
    });
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const result = await signInWithPopup(this.auth, this.googleProvider);
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error("Failed to sign in with Google");
    return user;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error("Failed to sign in");
    return user;
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthUser> {
    const result = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error("Failed to sign up");
    return user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }
}
