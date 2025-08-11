import React, { createContext, useContext, ReactNode } from 'react';
import { AuthContextType } from '../types/auth';
// On importe le hook Supabase sous un autre nom pour éviter la collision
import { useAuth as useAuthHook } from '../hooks/useAuth';

// Création du contexte
const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // On appelle le hook Supabase
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook interne pour accéder au contexte.
 * À utiliser dans les hooks et helpers internes.
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook public useAuth exposé par le contexte.
 * Il renvoie simplement le résultat de useAuthContext().
 */
export function useAuth(): AuthContextType {
  return useAuthContext();
}

/**
 * Hook utilitaire qui indique si un utilisateur est connecté ou si l’on est encore en train de charger les données.
 */
export function useAuthGuard() {
  const { user, loading } = useAuthContext();

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
}
