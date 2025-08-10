import React, { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from '../types/auth';
import { useAuth as useAuthHook } from '../hooks/useAuth';

// Create the authentication context
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider Component
 * Provides authentication state and methods to the entire application
 */
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * Throws error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Authentication Guard Hook
 * Returns authentication status for route protection
 */
export function useAuthGuard() {
  const { user, loading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user
  };
}