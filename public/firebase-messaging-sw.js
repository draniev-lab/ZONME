// Import the Firebase app and messaging services
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-8002166238-73c96",
  "appId": "1:959265393180:web:31259f183743bc0eb76dd9",
  "apiKey": "AIzaSyBFB7alLSohJJa6PBd7IGdTtAgjMcSo9XE",
  "authDomain": "studio-8002166238-73c96.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "959265393180",
  "storageBucket": "studio-8002166238-73c96.appspot.com"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nouveau Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
