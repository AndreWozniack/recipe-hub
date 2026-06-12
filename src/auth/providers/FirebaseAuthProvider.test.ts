import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/auth", () => ({
  getAuth: () => ({
    currentUser: { getIdToken: vi.fn(async () => "fake-id-token") },
  }),
  GoogleAuthProvider: class {},
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  getOrCreateFirebaseApp: () => ({}),
}));

import { FirebaseAuthProvider } from "./FirebaseAuthProvider";

describe("FirebaseAuthProvider.getIdToken", () => {
  it("retorna o token do currentUser", async () => {
    const provider = new FirebaseAuthProvider({
      provider: "firebase",
      firebaseConfig: { apiKey: "x", authDomain: "x", projectId: "x" },
    } as never);
    await expect(provider.getIdToken()).resolves.toBe("fake-id-token");
  });
});
