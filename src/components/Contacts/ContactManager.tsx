import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, Download, Search, Mail, Phone, UserCheck } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { SearchInput } from '../UI/SearchInput';
import { Modal } from '../UI/Modal';
import { UserContact } from '../../types/auth';
import { useAuthContext } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

export function ContactManager() {
  const { user } = useAuthContext();
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setContacts(data.map(contact => ({
        ...contact,
        created_at: new Date(contact.created_at),
        updated_at: new Date(contact.updated_at)
      })));
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur de chargement',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceContacts = async () => {
    if (!('contacts' in navigator)) {
      addToast({
        type: 'error',
        title: 'Non supporté',
        message: 'L\'API Contacts n\'est pas supportée sur ce navigateur.'
      });
      return;
    }

    try {
      const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel'], {
        multiple: true
      });

      const importedContacts = contacts.map((contact: any) => ({
        name: contact.name?.[0] || 'Contact sans nom',
        email: contact.email?.[0],
        phone: contact.tel?.[0],
        source: 'device' as const
      })).filter((contact: any) => contact.email || contact.phone);

      await importContacts(importedContacts);
      
      addToast({
        type: 'success',
        title: 'Contacts importés',
        message: `${importedContacts.length} contacts ont été importés depuis votre appareil.`
      });

    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        addToast({
          type: 'warning',
          title: 'Permission refusée',
          message: 'L\'accès aux contacts a été refusé.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Erreur d\'import',
          message: error.message
        });
      }
    }
  };

  const handleCSVImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('nom'));
      const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('mail'));
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('tel'));

      if (nameIndex === -1 || (emailIndex === -1 && phoneIndex === -1)) {
        throw new Error('Format CSV invalide. Colonnes requises: name, email ou phone');
      }

      const importedContacts = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return {
          name: values[nameIndex] || 'Contact sans nom',
          email: emailIndex !== -1 ? values[emailIndex] : undefined,
          phone: phoneIndex !== -1 ? values[phoneIndex] : undefined,
          source: 'csv' as const
        };
      }).filter(contact => contact.email || contact.phone);

      await importContacts(importedContacts);
      
      addToast({
        type: 'success',
        title: 'CSV importé',
        message: `${importedContacts.length} contacts ont été importés depuis le fichier CSV.`
      });

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'import CSV',
        message: error.message
      });
    }
  };

  const importContacts = async (contactsToImport: any[]) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_contacts')
        .insert(
          contactsToImport.map(contact => ({
            user_id: user.id,
            ...contact
          }))
        )
        .select();

      if (error) throw error;

      // Synchroniser avec les utilisateurs SplitEase
      await supabase.rpc('sync_contacts_with_users');
      
      await loadContacts();
    } catch (error: any) {
      throw new Error(`Erreur lors de l'import: ${error.message}`);
    }
  };

  const handleAddContact = async (contactData: { name: string; email?: string; phone?: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_contacts')
        .insert({
          user_id: user.id,
          ...contactData,
          source: 'manual'
        });

      if (error) throw error;

      await loadContacts();
      setShowAddModal(false);
      
      addToast({
        type: 'success',
        title: 'Contact ajouté',
        message: `${contactData.name} a été ajouté à vos contacts.`
      });

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur d\'ajout',
        message: error.message
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('user_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      setContacts(prev => prev.filter(c => c.id !== contactId));
      
      addToast({
        type: 'success',
        title: 'Contact supprimé',
        message: 'Le contact a été supprimé de votre carnet d\'adresses.'
      });

    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Erreur de suppression',
        message: error.message
      });
    }
  };

  const exportContacts = () => {
    const csv = [
      'Name,Email,Phone,Source,SplitEase User',
      ...contacts.map(contact => 
        `"${contact.name}","${contact.email || ''}","${contact.phone || ''}","${contact.source}","${contact.is_splitease_user ? 'Yes' : 'No'}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'splitease-contacts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Export réussi',
      message: 'Vos contacts ont été exportés en CSV.'
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Mes Contacts ({contacts.length})
          </h2>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportContacts}>
              <Download className="w-4 h-4" />
              Exporter
            </Button>
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4" />
              Importer
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher un contact..."
          />
        </div>

        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Aucun contact trouvé' : 'Aucun contact'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? 'Essayez avec d\'autres mots-clés'
                : 'Commencez par ajouter ou importer vos contacts'
              }
            </p>
            {!searchTerm && (
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4" />
                  Ajouter un contact
                </Button>
                <Button variant="outline" onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4" />
                  Importer des contacts
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onDelete={() => handleDeleteContact(contact.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout de contact */}
      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddContact}
      />

      {/* Modal d'import */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onDeviceImport={handleDeviceContacts}
        onCSVImport={handleCSVImport}
      />
    </div>
  );
}

function ContactCard({ contact, onDelete }: { contact: UserContact; onDelete: () => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={contact.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=3b82f6&color=fff`}
            alt={contact.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {contact.name}
            </h3>
            {contact.is_splitease_user && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <UserCheck className="w-3 h-3" />
                Utilisateur SplitEase
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {contact.email && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Source: {contact.source === 'manual' ? 'Manuel' : contact.source === 'device' ? 'Appareil' : 'CSV'}
      </div>
    </div>
  );
}

function AddContactModal({ isOpen, onClose, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contact: { name: string; email?: string; phone?: string }) => void;
}) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.contact = 'Email ou téléphone obligatoire';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onAdd({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined
      });
      setFormData({ name: '', email: '', phone: '' });
      setErrors({});
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un contact">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom *"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          error={errors.name}
          placeholder="Nom du contact"
        />
        
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          error={errors.email}
          placeholder="email@exemple.com"
        />
        
        <Input
          label="Téléphone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+33 6 12 34 56 78"
        />
        
        {errors.contact && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.contact}</p>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            Ajouter
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ isOpen, onClose, onDeviceImport, onCSVImport }: {
  isOpen: boolean;
  onClose: () => void;
  onDeviceImport: () => void;
  onCSVImport: (file: File) => void;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      onCSVImport(file);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importer des contacts">
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Depuis votre appareil
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Importer directement depuis le carnet d'adresses de votre appareil
          </p>
          <Button onClick={onDeviceImport} className="w-full">
            <Users className="w-4 h-4" />
            Importer depuis l'appareil
          </Button>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Fichier CSV
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Format: Name, Email, Phone (une ligne par contact)
          </p>
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" className="w-full cursor-pointer">
              <Upload className="w-4 h-4" />
              Choisir un fichier CSV
            </Button>
          </label>
        </div>
      </div>
    </Modal>
  );
}