import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireConsent({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (user && profile && profile.termsAccepted !== true) {
    return <Navigate to="/consent" replace />;
  }

  return children;
}
