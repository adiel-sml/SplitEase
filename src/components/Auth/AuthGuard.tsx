import React, { ReactNode } from 'react';
import { useAuthGuard } from '../../context/AuthContext';
import { AuthModal } from './AuthModal';

/**
 * AuthGuard Component
 * Protects routes by requiring authentication
 * Shows login modal if user is not authenticated
 */
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthGuard();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return fallback || <AuthenticationRequired />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
}

/**
 * Authentication Required Component
 * Displays when user needs to authenticate
 */
function AuthenticationRequired() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connexion Requise
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vous devez vous connecter pour accéder à SplitEase
          </p>
        </div>
        
        <AuthModal 
          isOpen={true} 
          onClose={() => {}} 
          onSuccess={() => window.location.reload()} 
        />
      </div>
    </div>
  );
}