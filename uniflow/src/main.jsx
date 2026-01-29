import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// 🧹 START: CACHE CLEANUP (Safety Net for 500 Users)
// Ye code ensure karega ki user ke paas hamesha LATEST version hi load ho.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      console.log('♻️ Cleaning up old version...');
      registration.unregister();
    }
  });
  
  // Optional: Agar purana cache bahut ziddi hai
  if (window.caches) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}
// 🧹 END: CACHE CLEANUP

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ This is the ONLY place BrowserRouter should exist */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)