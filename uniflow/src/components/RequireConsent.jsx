import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireConsent = ({ children }) => {
  const { user, profile, loading } = useAuth();

  /**
   * VERY IMPORTANT LOGIC:
   *
   * 1. Wait for auth + profile to fully load
   * 2. Do NOT render anything until we KNOW profile state
   * 3. Enforce consent ONLY after profile exists
   */

  // Auth or profile still loading → block render
  if (loading || (user && profile === undefined)) {
    return null; // prevents flicker & bypass
  }

  // User logged in but profile missing (edge case)
  if (user && profile === null) {
    return <Navigate to="/consent" replace />;
  }

  // User logged in but has NOT accepted terms
  if (user && profile && profile.termsAccepted !== true) {
    return <Navigate to="/consent" replace />;
  }

  // All good → allow access
  return children;
};

export default RequireConsent;
