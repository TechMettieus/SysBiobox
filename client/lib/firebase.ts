import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const config: FirebaseOptions | null = (() => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
    | string
    | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as
    | string
    | undefined;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
    | string
    | undefined;
  const messagingSenderId = import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

  if (
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId
  ) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    } satisfies FirebaseOptions;
  }
  return null;
})();

export const isFirebaseConfigured = Boolean(config);

export const app = (() => {
  if (!config) return null;
  if (!getApps().length) {
    return initializeApp(config);
  }
  return getApps()[0] || null;
})();

export const auth = app ? getAuth(app) : null;
export const db = app
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    })
  : null;
