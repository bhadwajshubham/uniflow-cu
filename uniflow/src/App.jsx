import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Core Layouts (Keep these synchronous for immediate render)
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// 💤 LAZY LOADED PAGES (Code Splitting)
// These chunks are only downloaded when the user visits the route.
const HomePage = lazy(() => import('./features/events/components/HomePage'));
const EventsPage = lazy(() => import('./features/events/components/EventsPage'));
const EventDetailsPage = lazy(() => import('./features/events/components/EventDetailsPage'));
const MyTicketsPage = lazy(() => import('./features/events/components/MyTicketsPage'));
const TicketPage = lazy(() => import('./features/events/components/TicketPage'));
const HelpPage = lazy(() => import('./features/events/components/HelpPage'));

// Auth Pages
const LoginPage = lazy(() => import('./features/auth/components/LoginPage'));
const AboutPage = lazy(() => import('./features/auth/AboutPage'));

// 🔒 ADMIN MODULES (Heavy Security Risk - Strict Lazy Loading)
const AdminDashboard = lazy(() => import('./features/events/components/AdminDashboard'));
const ScannerPage = lazy(() => import('./features/events/components/ScannerPage'));
const SuperAdminDashboard = lazy(() => import('./features/events/components/SuperAdminDashboard'));

// 🌀 Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Loading Experience...</p>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
          <Navbar />
          
          {/* Suspense catches the "promise" thrown by lazy components 
            and shows the fallback UI until the network request finishes.
          */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* 🏠 PUBLIC ROUTES */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/about" element={<AboutPage />} />
              
              {/* 🔒 PROTECTED STUDENT ROUTES */}
              <Route 
                path="/my-tickets" 
                element={
                  <ProtectedRoute>
                    <MyTicketsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/tickets/:ticketId" 
                element={
                  <ProtectedRoute>
                    <TicketPage />
                  </ProtectedRoute>
                } 
              />

              {/* 🛡️ ADMIN ROUTES (Code chunk only loads for Admins) */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/scan" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ScannerPage />
                  </ProtectedRoute>
                } 
              />

              {/* 👑 SUPER ADMIN ROUTE */}
              <Route 
                path="/super-admin" 
                element={
                  <ProtectedRoute superAdminOnly={true}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;