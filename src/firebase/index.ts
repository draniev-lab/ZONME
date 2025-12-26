
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getMessaging, type Messaging } from "firebase/messaging";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";
import { useUser } from "./auth/use-user";
import { FirebaseProvider, useFirebaseApp, useAuth, useFirestore, useMessaging, useStorage } from "./provider";
import { FirebaseClientProvider } from "./client-provider";
import { useCollection } from "./firestore/use-collection";
import { useDoc } from "./firestore/use-doc";


let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let messaging: Messaging | null = null;
let storage: FirebaseStorage | null = null;


function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!firebaseApp) {
      if (getApps().length === 0) {
          firebaseApp = initializeApp(firebaseConfig);
      } else {
          firebaseApp = getApps()[0];
      }
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
      storage = getStorage(firebaseApp);
      try {
        messaging = getMessaging(firebaseApp);
      } catch (e) {
        console.error("Firebase Messaging a échoué. Votre navigateur ne supporte peut-être pas les Service Workers.", e);
        messaging = null;
      }
    }
  }
  return { firebaseApp, auth, firestore, messaging, storage };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useMessaging,
  useStorage,
  useCollection,
  useDoc,
};
