import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// 🟡 OPTION 2: ONE-TIME CLEANUP (Smart & Safe)
if ('serviceWorker' in navigator) {
  // Check agar humne pehle safayi nahi ki hai
  const hasCleaned = localStorage.getItem('sw_cleaned_v1');

  if (!hasCleaned) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      // Agar koi purana Service Worker mila, toh usko uda do
      if (registrations.length > 0) {
        registrations.forEach((r) => {
          console.log('♻️ Removing Stale Service Worker:', r);
          r.unregister();
        });
        
        // Cache bhi saaf kar do taaki purani files na dikhein
        if (window.caches) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        
        // Reload taaki naya version load ho jaye
        window.location.reload();
      }
    });

    // Mark kar do ki safayi ho gayi hai
    localStorage.setItem('sw_cleaned_v1', 'true');
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)