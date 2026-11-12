import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { LandingPage } from '../features/landing/LandingPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { VerifyEmailPage } from '../features/verification/VerifyEmailPage.js';
import { VaultLayout } from '../features/vault/VaultLayout.js';
import { VaultDashboard } from '../features/vault/VaultDashboard.js';
import { SettingsPage } from '../features/settings/SettingsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, masterKeyHex } = useAuth();

  // If vault is locked or user is unauthenticated, redirect to login
  if (!isAuthenticated || !masterKeyHex) {
    return <Navigate to="/login" replace />;
  }

  return <VaultLayout>{children}</VaultLayout>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected Vault Routes */}
      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <VaultDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

