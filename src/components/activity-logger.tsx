
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface ActivityLoggerProps {
    user: User;
}

// Centralized logging function
const logActivity = (firestore: any, user: User, action: string, details?: Record<string, any>) => {
    if (!firestore || !user?.uid) {
        console.error("Firestore or user not available for logging activity.");
        return;
    }
    
    addDoc(collection(firestore, 'activityLogs'), {
        userId: user.uid,
        userDisplayName: user.displayName || user.email,
        action: action,
        details: details || {},
        createdAt: serverTimestamp(),
    }).catch(error => console.error("Failed to log activity:", error));
};

// This is a global hook that can be imported and used anywhere in the client-side code.
export const useActivityLogger = () => {
    const { firestore } = useFirestore();

    const log = useCallback((user: User, action: string, details?: Record<string, any>) => {
        logActivity(firestore, user, action, details);
    }, [firestore]);

    return { log };
};

// This component logs a user's login session once.
export const ActivityLogger = ({ user }: ActivityLoggerProps) => {
  const { firestore } = useFirestore();
  const hasLoggedLogin = useRef(false);

  useEffect(() => {
    if (user && firestore && !hasLoggedLogin.current) {
        logActivity(firestore, user, 'user_login');
        hasLoggedLogin.current = true;
    }

    const handleBeforeUnload = () => {
      hasLoggedLogin.current = false;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      hasLoggedLogin.current = false;
    }

  }, [user, firestore]);

  return null; // This component doesn't render anything
};
