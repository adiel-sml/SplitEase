import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { AdvancedDashboard } from './components/Dashboard/AdvancedDashboard';
import { CreateGroupForm } from './components/Groups/CreateGroupForm';
import { GroupView } from './components/Groups/GroupView';
import { MemberManagement } from './components/Groups/MemberManagement';
import { SocialFeatures } from './components/Social/SocialFeatures';
import { ProfilePage } from './components/Profile/ProfilePage';
import { ContactManager } from './components/Contacts/ContactManager';
import { NotificationSettings } from './components/Settings/NotificationSettings';
import { Modal } from './components/UI/Modal';
import { ToastContainer } from './components/UI/ToastContainer';
import { Group } from './types';
import { useToast } from './hooks/useToast';

function AppContent() {
  const { state, saveGroup, setCurrentGroup } = useApp();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
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
                <AdvancedDashboard
                  groups={state.groups}
                  onSelectGroup={handleSelectGroup}
                />
              )}
              
              {currentView === 'group' && state.currentGroup && (
                <div className="space-y-6">
                  <GroupView
                    group={state.currentGroup}
                    onBack={handleBackToDashboard}
                    onUpdateGroup={handleUpdateGroup}
                  />
                  
                  <MemberManagement
                    members={state.currentGroup.members}
                    onAddMember={(member) => {
                      const updatedGroup = {
                        ...state.currentGroup!,
                        members: [...state.currentGroup!.members, member]
                      };
                      handleUpdateGroup(updatedGroup);
                    }}
                    onUpdateMember={(member) => {
                      const updatedGroup = {
                        ...state.currentGroup!,
                        members: state.currentGroup!.members.map(m => 
                          m.id === member.id ? member : m
                        )
                      };
                      handleUpdateGroup(updatedGroup);
                    }}
                    onRemoveMember={(memberId) => {
                      const updatedGroup = {
                        ...state.currentGroup!,
                        members: state.currentGroup!.members.filter(m => m.id !== memberId)
                      };
                      handleUpdateGroup(updatedGroup);
                    }}
                    groupId={state.currentGroup.id}
                  />
                  
                  <SocialFeatures
                    group={state.currentGroup}
                    onUpdateGroup={handleUpdateGroup}
                  />
                </div>
              )}
              
              {currentView === 'profile' && (
                <ProfilePage />
              )}
              
              {currentView === 'contacts' && (
                <ContactManager />
              )}
              
              {currentView === 'notifications' && (
                <NotificationSettings />
              )}
              
              {currentView === 'settings' && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Paramètres Généraux
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Paramètres généraux de l'application (thème, langue, etc.)
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
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;