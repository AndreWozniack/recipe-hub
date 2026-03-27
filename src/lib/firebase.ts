import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";

export function getOrCreateFirebaseApp(config: FirebaseOptions): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(config);
}
