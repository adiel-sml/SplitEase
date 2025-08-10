import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Mail, 
  MessageSquare, 
  Phone, 
  UserPlus, 
  Crown,
  Eye,
  Settings,
  QrCode,
  Link,
  Send
} from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';
import { Member } from '../../types';
import { generateAvatar } from '../../utils/avatars';
import { useToast } from '../../hooks/useToast';

interface MemberManagementProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onRemoveMember: (memberId: string) => void;
  groupId: string;
  isAdmin?: boolean;
}

type MemberRole = 'admin' | 'member' | 'viewer';

interface ExtendedMember extends Member {
  role: MemberRole;
  joinedAt: Date;
  lastActive?: Date;
}

export function MemberManagement({ 
  members, 
  onAddMember, 
  onUpdateMember, 
  onRemoveMember, 
  groupId,
  isAdmin = true 
}: MemberManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ExtendedMember | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const { addToast } = useToast();

  // Request contacts permission and load contacts
  const loadContacts = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };
        
        const contactList = await (navigator as any).contacts.select(props, opts);
        setContacts(contactList);
        
        addToast({
          type: 'success',
          title: 'Contacts chargés',
          message: `${contactList.length} contacts disponibles`
        });
      } else {
        addToast({
          type: 'warning',
          title: 'API non supportée',
          message: 'L\'accès aux contacts n\'est pas disponible sur ce navigateur'
        });
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'L\'accès aux contacts a été refusé'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de charger les contacts'
        });
      }
    }
  };

  const handleAddFromContacts = (contact: any) => {
    const email = contact.email?.[0] || '';
    const phone = contact.tel?.[0] || '';
    const name = contact.name?.[0] || 'Contact';

    if (!email && !phone) {
      addToast({
        type: 'error',
        title: 'Contact invalide',
        message: 'Le contact doit avoir un email ou un téléphone'
      });
      return;
    }

    const { avatar, color } = generateAvatar(name);
    const newMember: Member = {
      id: Date.now().toString(),
      name,
      email,
      avatar,
      color
    };

    onAddMember(newMember);
    addToast({
      type: 'success',
      title: 'Membre ajouté',
      message: `${name} a été ajouté au groupe`
    });
  };

  const sendInvitation = async (email: string, message: string, method: 'email' | 'sms') => {
    try {
      const inviteLink = `${window.location.origin}/invite/${groupId}`;
      
      if (method === 'email') {
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addToast({
          type: 'success',
          title: 'Invitation envoyée',
          message: `Invitation envoyée par email à ${email}`
        });
      } else {
        // Simulate SMS sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addToast({
          type: 'success',
          title: 'SMS envoyé',
          message: `Invitation envoyée par SMS`
        });
      }
      
      setShowInviteModal(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur d\'envoi',
        message: 'Impossible d\'envoyer l\'invitation'
      });
    }
  };

  const generateQRCode = () => {
    const inviteLink = `${window.location.origin}/invite/${groupId}`;
    // In a real app, you would generate an actual QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`;
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${groupId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      addToast({
        type: 'success',
        title: 'Lien copié',
        message: 'Le lien d\'invitation a été copié'
      });
    });
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'admin': return Crown;
      case 'member': return Users;
      case 'viewer': return Eye;
    }
  };

  const getRoleColor = (role: MemberRole) => {
    switch (role) {
      case 'admin': return 'text-yellow-600 dark:text-yellow-400';
      case 'member': return 'text-blue-600 dark:text-blue-400';
      case 'viewer': return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Convert members to extended members with roles
  const extendedMembers: ExtendedMember[] = members.map((member, index) => ({
    ...member,
    role: index === 0 ? 'admin' : 'member' as MemberRole,
    joinedAt: new Date(),
    lastActive: new Date()
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membres du Groupe ({members.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gérez les membres et leurs permissions
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              <Send className="w-4 h-4" />
              Inviter
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extendedMembers.map((member) => {
          const RoleIcon = getRoleIcon(member.role);
          
          return (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full border-2"
                    style={{ borderColor: member.color }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
                
                {isAdmin && (
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 ${getRoleColor(member.role)}`}>
                  <RoleIcon className="w-4 h-4" />
                  <span className="text-sm font-medium capitalize">
                    {member.role === 'admin' ? 'Administrateur' : 
                     member.role === 'member' ? 'Membre' : 'Observateur'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Actif {member.lastActive ? 'récemment' : 'il y a longtemps'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un membre"
        size="lg"
      >
        <AddMemberForm
          onAddMember={onAddMember}
          onClose={() => setShowAddModal(false)}
          onLoadContacts={loadContacts}
          contacts={contacts}
          onAddFromContacts={handleAddFromContacts}
        />
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Inviter des membres"
        size="lg"
      >
        <InviteForm
          onSendInvitation={sendInvitation}
          onClose={() => setShowInviteModal(false)}
          onGenerateQR={generateQRCode}
          onCopyLink={copyInviteLink}
        />
      </Modal>

      {/* Member Settings Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Paramètres - ${selectedMember.name}`}
        >
          <MemberSettingsForm
            member={selectedMember}
            onUpdateMember={onUpdateMember}
            onRemoveMember={onRemoveMember}
            onClose={() => setSelectedMember(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// Add Member Form Component
interface AddMemberFormProps {
  onAddMember: (member: Member) => void;
  onClose: () => void;
  onLoadContacts: () => void;
  contacts: any[];
  onAddFromContacts: (contact: any) => void;
}

function AddMemberForm({ 
  onAddMember, 
  onClose, 
  onLoadContacts, 
  contacts, 
  onAddFromContacts 
}: AddMemberFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [activeTab, setActiveTab] = useState<'manual' | 'contacts'>('manual');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const { avatar, color } = generateAvatar(formData.name);
      const newMember: Member = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        avatar,
        color
      };
      
      onAddMember(newMember);
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Ajout Manuel
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'contacts'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Depuis Contacts
        </button>
      </div>

      {activeTab === 'manual' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
            placeholder="Nom du membre"
          />
          
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={errors.email}
            placeholder="email@exemple.com"
          />
          
          <Input
            label="Téléphone (optionnel)"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+33 6 12 34 56 78"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter le membre
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sélectionnez des contacts depuis votre appareil
            </p>
            <Button onClick={onLoadContacts} size="sm">
              <Phone className="w-4 h-4" />
              Charger Contacts
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {contact.name?.[0] || 'Contact sans nom'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.email?.[0] || contact.tel?.[0] || 'Pas de contact'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAddFromContacts(contact)}
                    disabled={!contact.email?.[0] && !contact.tel?.[0]}
                  >
                    Ajouter
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun contact chargé</p>
                <p className="text-sm">Cliquez sur "Charger Contacts" pour commencer</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Invite Form Component
interface InviteFormProps {
  onSendInvitation: (email: string, message: string, method: 'email' | 'sms') => void;
  onClose: () => void;
  onGenerateQR: () => string;
  onCopyLink: () => void;
}

function InviteForm({ onSendInvitation, onClose, onGenerateQR, onCopyLink }: InviteFormProps) {
  const [inviteData, setInviteData] = useState({
    email: '',
    phone: '',
    message: 'Rejoignez notre groupe sur SplitEase pour partager nos dépenses !'
  });
  const [activeMethod, setActiveMethod] = useState<'email' | 'sms' | 'link'>('email');

  const handleSend = () => {
    if (activeMethod === 'email' && inviteData.email) {
      onSendInvitation(inviteData.email, inviteData.message, 'email');
    } else if (activeMethod === 'sms' && inviteData.phone) {
      onSendInvitation(inviteData.phone, inviteData.message, 'sms');
    }
  };

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveMethod('email')}
          className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
            activeMethod === 'email'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <Mail className="w-5 h-5 mx-auto mb-1" />
          <div className="text-sm font-medium">Email</div>
        </button>
        
        <button
          onClick={() => setActiveMethod('sms')}
          className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
            activeMethod === 'sms'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <MessageSquare className="w-5 h-5 mx-auto mb-1" />
          <div className="text-sm font-medium">SMS</div>
        </button>
        
        <button
          onClick={() => setActiveMethod('link')}
          className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
            activeMethod === 'link'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <Link className="w-5 h-5 mx-auto mb-1" />
          <div className="text-sm font-medium">Lien</div>
        </button>
      </div>

      {/* Form Content */}
      {activeMethod === 'email' && (
        <div className="space-y-4">
          <Input
            label="Email du destinataire"
            type="email"
            value={inviteData.email}
            onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemple.com"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message personnalisé
            </label>
            <textarea
              value={inviteData.message}
              onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSend} disabled={!inviteData.email}>
              <Send className="w-4 h-4" />
              Envoyer l'invitation
            </Button>
          </div>
        </div>
      )}

      {activeMethod === 'sms' && (
        <div className="space-y-4">
          <Input
            label="Numéro de téléphone"
            value={inviteData.phone}
            onChange={(e) => setInviteData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+33 6 12 34 56 78"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message SMS
            </label>
            <textarea
              value={inviteData.message}
              onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
              rows={2}
              maxLength={160}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="text-xs text-gray-500 mt-1">
              {inviteData.message.length}/160 caractères
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSend} disabled={!inviteData.phone}>
              <Send className="w-4 h-4" />
              Envoyer SMS
            </Button>
          </div>
        </div>
      )}

      {activeMethod === 'link' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img
                src={onGenerateQR()}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Scannez ce QR code ou partagez le lien ci-dessous
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/invite/${Date.now()}`}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <Button onClick={onCopyLink}>
                Copier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Member Settings Form Component
interface MemberSettingsFormProps {
  member: ExtendedMember;
  onUpdateMember: (member: Member) => void;
  onRemoveMember: (memberId: string) => void;
  onClose: () => void;
}

function MemberSettingsForm({ member, onUpdateMember, onRemoveMember, onClose }: MemberSettingsFormProps) {
  const [role, setRole] = useState<MemberRole>(member.role);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleSave = () => {
    // Update member role (in a real app, this would update the backend)
    onClose();
  };

  const handleRemove = () => {
    onRemoveMember(member.id);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={member.avatar}
          alt={member.name}
          className="w-16 h-16 rounded-full border-2"
          style={{ borderColor: member.color }}
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {member.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{member.email}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rôle dans le groupe
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="admin">Administrateur - Gestion complète</option>
          <option value="member">Membre - Ajout/modification des dépenses</option>
          <option value="viewer">Observateur - Lecture seule</option>
        </select>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Statistiques du membre
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Membre depuis :</span>
            <div className="font-medium">{member.joinedAt.toLocaleDateString('fr-FR')}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Dernière activité :</span>
            <div className="font-medium">
              {member.lastActive ? member.lastActive.toLocaleDateString('fr-FR') : 'Jamais'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="danger"
          onClick={() => setShowRemoveConfirm(true)}
          disabled={member.role === 'admin'}
        >
          Retirer du groupe
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Remove Confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir retirer {member.name} du groupe ?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleRemove}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}