importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 1. URL se Config Read karo (Magic Trick 🎩)
// React humein keys bhejege URL parameters mein
const params = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

// 2. Check karo agar keys aayi hain ya nahi
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/pwa-192x192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[SW] Config missing inside Service Worker');
}