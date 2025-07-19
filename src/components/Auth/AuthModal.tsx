import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';
import { SupabaseDataService } from '../../services/SupabaseDataService';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const dataService = SupabaseDataService.getInstance();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (mode === 'signup') {
      if (!formData.name.trim()) {
        newErrors.name = 'Le nom est obligatoire';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'signup') {
        await dataService.signUp(formData.email, formData.password, formData.name);
      } else {
        await dataService.signIn(formData.email, formData.password);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    setErrors({});
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Connexion' : 'Créer un compte'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        {mode === 'signup' && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              name="name"
              type="text"
              placeholder="Votre nom complet"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              className="pl-10"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            name="email"
            type="email"
            placeholder="votre@email.com"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            name="password"
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            className="pl-10"
          />
        </div>

        {mode === 'signup' && (
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              className="pl-10"
            />
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          {mode === 'signin' ? (
            <>
              <LogIn className="w-4 h-4" />
              Se connecter
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Créer un compte
            </>
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {mode === 'signin' 
              ? "Pas encore de compte ? Créer un compte"
              : "Déjà un compte ? Se connecter"
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}