
"use client";

import { createContext, useContext } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Messaging } from "firebase/messaging";
import type { FirebaseStorage } from "firebase/storage";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  messaging: Messaging | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
  messaging,
  storage,
}: React.PropsWithChildren<FirebaseContextValue>) {
  const value = { firebaseApp, auth, firestore, messaging, storage };
  
  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseApp() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error("useFirebaseApp must be used within a FirebaseProvider");
  }
  return context.firebaseApp;
}

export function useAuth() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error("useAuth must be used within a FirebaseProvider");
  }
  return context.auth;
}

export function useFirestore() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error("useFirestore must be used within a FirebaseProvider");
  }
  return context;
}

export function useMessaging() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error("useMessaging must be used within a FirebaseProvider");
  }
  return context;
}

export function useStorage() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error("useStorage must be used within a FirebaseProvider");
  }
  return context;
}
