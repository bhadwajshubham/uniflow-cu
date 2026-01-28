import { messaging } from '../lib/firebase';
import { getToken } from "firebase/messaging";

export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.log("🚫 Messaging not supported in this browser.");
    return null;
  }

  try {
    console.log("🔔 Requesting permission...");
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log("✅ Permission Granted!");
      
      // 👇 REPLACE WITH YOUR GENERATED KEY PAIR (PUBLIC KEY)
      const currentToken = await getToken(messaging, {
        vapidKey: "BO-H4fRiqZYsvOxxOQkZohoT4qYhHdJOIOjIdH-HNKksfG2qOsj1x9OokybARoLyDSqtZrI2gqDB3kGJTXf1-ps" 
      });

      if (currentToken) {
        console.log("🔥 FCM Token:", currentToken);
        return currentToken;
      } else {
        console.log("⚠️ No registration token available.");
      }
    } else {
      console.log("🚫 Permission Denied.");
    }
  } catch (error) {
    console.error("❌ Notification Error:", error);
  }
  return null;
};