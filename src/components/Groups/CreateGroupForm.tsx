import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Group, Member } from '../../types';
import { generateAvatar } from '../../utils/avatars';
import { Plus, X, Upload } from 'lucide-react';

interface CreateGroupFormProps {
  onSubmit: (group: Group) => void;
  onCancel: () => void;
}

export function CreateGroupForm({ onSubmit, onCancel }: CreateGroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addMember = () => {
    if (!memberName.trim()) return;
    
    const { avatar, color } = generateAvatar(memberName);
    const newMember: Member = {
      id: Date.now().toString(),
      name: memberName.trim(),
      avatar,
      color
    };
    
    setMembers(prev => [...prev, newMember]);
    setMemberName('');
  };

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du groupe est obligatoire';
    }
    
    if (members.length < 2) {
      newErrors.members = 'Au moins 2 membres sont requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image || undefined,
        members,
        expenses: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      onSubmit(newGroup);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input
            label="Nom du groupe *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Voyage en Espagne, Colocation..."
            error={errors.name}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description optionnelle du groupe..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image du groupe
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Choisir une image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Membres du groupe *
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nom du membre"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addMember}
                disabled={!memberName.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.members && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{errors.members}</p>
            )}
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Créer le groupe
        </Button>
      </div>
    </form>
  );
}