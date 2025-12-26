"use client";

import { useMemo } from "react";
import { FirebaseProvider, initializeFirebase } from ".";
import { FirebaseMessagingProvider } from "@/components/firebase-messaging-provider";

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebaseServices = useMemo(() => {
    const { firebaseApp, firestore, auth, messaging, storage } = initializeFirebase();
    return { firebaseApp, firestore, auth, messaging, storage };
  }, []);

  return (
      <FirebaseProvider {...firebaseServices}>
        <FirebaseMessagingProvider>
            {children}
        </FirebaseMessagingProvider>
      </FirebaseProvider>
  );
}
