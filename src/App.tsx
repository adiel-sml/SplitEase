import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CreateGroupForm } from './components/Groups/CreateGroupForm';
import { GroupView } from './components/Groups/GroupView';
import { Modal } from './components/UI/Modal';
import { ToastContainer } from './components/UI/ToastContainer';
import { AuthModal } from './components/Auth/AuthModal';
import { Group } from './types';
import { useToast } from './hooks/useToast';

function AppContent() {
  const { state, saveGroup, setCurrentGroup } = useApp();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toasts, addToast } = useToast();

  const handleCreateGroup = async (group: Group) => {
    try {
      await saveGroup(group);
      setShowCreateGroup(false);
      setCurrentView('dashboard');
      
      addToast({
        type: 'success',
        title: 'Groupe créé',
        message: `Le groupe "${group.name}" a été créé avec succès !`,
        duration: 4000
      });
    } catch (error) {
      console.error('Error creating group:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer le groupe. Veuillez réessayer.',
        duration: 5000
      });
    }
  };

  const handleSelectGroup = (group: Group) => {
    setCurrentGroup(group);
    setCurrentView('group');
  };

  const handleBackToDashboard = () => {
    setCurrentGroup(null);
    setCurrentView('dashboard');
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setCurrentGroup(updatedGroup);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'create-group') {
      setShowCreateGroup(true);
    }
  };

  const handleAuthSuccess = () => {
    addToast({
      type: 'success',
      title: 'Connexion réussie',
      message: 'Bienvenue sur SplitEase ! Vos données seront maintenant synchronisées.',
      duration: 4000
    });
  };

  const getPageTitle = () => {
    if (currentView === 'group' && state.currentGroup) {
      return state.currentGroup.name;
    }
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'create-group':
        return 'Créer un groupe';
      case 'settings':
        return 'Paramètres';
      default:
        return 'SplitEase';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex relative">
      <ToastContainer toasts={toasts} />
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
      />
      
      <div className="flex-1 lg:ml-64">
        <Header
          title={getPageTitle()}
          user={user}
          onAuthClick={() => setShowAuthModal(true)}
          onMenuClick={() => setSidebarOpen(true)}
          onBackClick={handleBackToDashboard}
          showBack={currentView === 'group'}
        />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {state.loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <Dashboard
                  groups={state.groups}
                  onSelectGroup={handleSelectGroup}
                  onCreateGroup={() => setShowCreateGroup(true)}
                />
              )}
              
              {currentView === 'group' && state.currentGroup && (
                <GroupView
                  group={state.currentGroup}
                  onBack={handleBackToDashboard}
                  onUpdateGroup={handleUpdateGroup}
                />
              )}
              
              {currentView === 'settings' && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Paramètres
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Les paramètres de l'application seront disponibles dans une prochaine version.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Modal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        title="Créer un nouveau groupe"
        size="lg"
      >
        <CreateGroupForm
          onSubmit={handleCreateGroup}
          onCancel={() => setShowCreateGroup(false)}
        />
      </Modal>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;