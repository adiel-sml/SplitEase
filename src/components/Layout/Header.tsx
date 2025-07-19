import React from 'react';
import { Menu, Moon, Sun, ArrowLeft, User, LogOut } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useTheme } from '../../hooks/useTheme';
import { SupabaseDataService } from '../../services/SupabaseDataService';

interface HeaderProps {
  title: string;
  user?: SupabaseUser | null;
  onAuthClick?: () => void;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  showBack?: boolean;
}

export function Header({ title, user, onAuthClick, onMenuClick, onBackClick, showBack = false }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const dataService = SupabaseDataService.getInstance();

  const handleSignOut = async () => {
    try {
      await dataService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={onBackClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            ) : (
              <button
                onClick={onMenuClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.user_metadata?.name || user.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Connecté
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Se connecter</span>
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}