import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from '../auth/LoginPage';
import { LoadingSystem } from './LoadingSystem';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <LoadingSystem />;
  }

  // If no user is authenticated and no demo role is set, direct to LoginPage
  if (!user && !role) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
