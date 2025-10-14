import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const fallbackConfig: FirebaseOptions = {
  apiKey: "AIzaSyDI3BRH44JpubuDzFZzJ23OfFccZ2-0efo",
  authDomain: "biobox-1ad4a.firebaseapp.com",
  projectId: "biobox-1ad4a",
  storageBucket: "biobox-1ad4a.firebasestorage.app",
  messagingSenderId: "782207164797",
  appId: "1:782207164797:web:a5d2d12d09733327456c14",
  measurementId: "G-JDQ4DYC5EH",
};

const configFromEnv = (() => {
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
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as
    | string
    | undefined;

  if (
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId
  ) {
    const baseConfig: FirebaseOptions = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };

    return measurementId ? { ...baseConfig, measurementId } : baseConfig;
  }
  return null;
})();

const config: FirebaseOptions = configFromEnv ?? fallbackConfig;

export const isFirebaseConfigured = Boolean(config);

export const app = getApps().length ? getApps()[0]! : initializeApp(config);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});
