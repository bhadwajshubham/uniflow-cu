import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// 1. Load Config from Environment Variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// 2. Initialize Core Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 3. Advanced Messaging Init (Passes Config to Service Worker)
let messaging = null;

if (typeof window !== "undefined") {
  // Only run this in the browser, not during build
  if ("serviceWorker" in navigator) {
    try {
      // Create a URL string containing your config
      const configUrl = new URLSearchParams({
        apiKey: import.meta.env.VITE_API_KEY,
        authDomain: import.meta.env.VITE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_APP_ID,
      }).toString();

      // Register the Service Worker and pass the config in the URL
      navigator.serviceWorker
        .register(`/firebase-messaging-sw.js?${configUrl}`)
        .then((registration) => {
          console.log("✅ Service Worker Registered with Dynamic Config");
        })
        .catch((err) => {
          console.error("❌ Service Worker Registration Failed:", err);
        });

      // Initialize Messaging
      messaging = getMessaging(app);
      console.log("✅ FCM Initialized");

    } catch (error) {
      console.warn("⚠️ FCM Setup Failed (Safe Mode):", error);
    }
  } else {
    console.log("ℹ️ This browser does not support Service Workers.");
  }
}

// 4. Export services for use in your app
export { app, auth, db, storage, messaging };