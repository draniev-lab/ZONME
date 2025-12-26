
'use client';

import { useEffect } from 'react';
import { getToken, isSupported } from 'firebase/messaging';
import { useMessaging, useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { AppSettings } from '@/lib/types';

export function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { messaging } = useMessaging();
  const { firestore } = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: settings, loading: settingsLoading } = useDoc<AppSettings>('settings', 'app');

  useEffect(() => {
    const setupMessaging = async () => {
      if (typeof window === 'undefined' || !messaging || !firestore || !user || !settings?.fcmVapidKey) {
        if (settings && !settings.fcmVapidKey) {
            console.log("FCM VAPID key is not configured in admin settings.");
        }
        return;
      }
      
      const supported = await isSupported();
      if (!supported) {
          console.log("Firebase Messaging is not supported in this browser.");
          return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          const currentToken = await getToken(messaging, {
            vapidKey: settings.fcmVapidKey,
          });

          if (currentToken) {
            console.log('FCM Token:', currentToken);
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { fcmToken: currentToken }, { merge: true });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
            console.log('Unable to get permission to notify.');
        }
      } catch (err) {
          console.error('An error occurred while retrieving token. ', err);
          if ((err as Error).message.includes('messaging/permission-blocked')) {
             toast({
                variant: 'destructive',
                title: 'Notifications Bloquées',
                description: 'Veuillez autoriser les notifications dans les paramètres de votre navigateur pour être alerté.',
             });
          }
      }
    };

    if (user && !settingsLoading) {
      setupMessaging();
    }
  }, [user, messaging, firestore, toast, settings, settingsLoading]);

  return <>{children}</>;
}
