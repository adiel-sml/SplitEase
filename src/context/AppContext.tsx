import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Group, Expense, Member } from '../types';
import { DataService } from '../services/DataService';
import { SupabaseDataService } from '../services/SupabaseDataService';
import { useAuthContext } from './AuthContext';

interface AppState {
  groups: Group[];
  currentGroup: Group | null;
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GROUPS'; payload: Group[] }
  | { type: 'SET_CURRENT_GROUP'; payload: Group | null }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string };

const initialState: AppState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadGroups: () => Promise<void>;
  saveGroup: (group: Group) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  setCurrentGroup: (group: Group | null) => void;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_GROUPS':
      return { ...state, groups: action.payload };
    case 'SET_CURRENT_GROUP':
      return { ...state, currentGroup: action.payload };
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] };
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(g => g.id === action.payload.id ? action.payload : g),
        currentGroup: state.currentGroup?.id === action.payload.id ? action.payload : state.currentGroup
      };
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== action.payload),
        currentGroup: state.currentGroup?.id === action.payload ? null : state.currentGroup
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuthContext();
  
  // Use Supabase when authenticated, localStorage otherwise
  const dataService = user 
    ? SupabaseDataService.getInstance()
    : DataService.getInstance();

  const loadGroups = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const groups = await dataService.getGroups();
      dispatch({ type: 'SET_GROUPS', payload: groups });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load groups' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveGroup = async (group: Group) => {
    try {
      await dataService.saveGroup(group);
      const existingGroup = state.groups.find(g => g.id === group.id);
      if (existingGroup) {
        dispatch({ type: 'UPDATE_GROUP', payload: group });
      } else {
        dispatch({ type: 'ADD_GROUP', payload: group });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save group' });
      throw error;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await dataService.deleteGroup(groupId);
      dispatch({ type: 'DELETE_GROUP', payload: groupId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete group' });
      throw error;
    }
  };

  const setCurrentGroup = (group: Group | null) => {
    dispatch({ type: 'SET_CURRENT_GROUP', payload: group });
  };

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      loadGroups,
      saveGroup,
      deleteGroup,
      setCurrentGroup
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}