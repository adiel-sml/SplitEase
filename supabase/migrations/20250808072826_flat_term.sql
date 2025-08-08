/*
  # Système d'authentification et notifications complet

  1. Nouvelles Tables
    - `user_profiles` - Profils utilisateurs étendus
    - `user_contacts` - Carnet d'adresses utilisateur
    - `notification_preferences` - Préférences de notifications
    - `notification_logs` - Historique des notifications
    - `group_invitations` - Invitations aux groupes (améliorée)
    - `reminder_schedules` - Planification des rappels

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques granulaires par utilisateur
    - Validation des emails obligatoires

  3. Fonctions
    - Triggers pour la création automatique de profils
    - Fonctions de nettoyage automatique
    - Validation des données
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs étendus
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  timezone text DEFAULT 'Europe/Paris',
  language text DEFAULT 'fr',
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des contacts utilisateur
CREATE TABLE IF NOT EXISTS user_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  source text DEFAULT 'manual', -- 'manual', 'device', 'csv'
  is_splitease_user boolean DEFAULT false,
  splitease_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contact_has_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Table des préférences de notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  -- Fréquences
  expense_notifications text DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'disabled'
  reminder_notifications text DEFAULT 'daily',
  group_activity text DEFAULT 'immediate',
  -- Types de notifications
  new_expense boolean DEFAULT true,
  expense_updated boolean DEFAULT true,
  debt_reminder boolean DEFAULT true,
  payment_received boolean DEFAULT true,
  group_invitation boolean DEFAULT true,
  group_activity_summary boolean DEFAULT true,
  -- Paramètres avancés
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  weekend_notifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des logs de notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'email', 'push', 'sms'
  channel text NOT NULL, -- 'expense', 'reminder', 'invitation', etc.
  status text NOT NULL, -- 'sent', 'delivered', 'failed', 'bounced'
  recipient text NOT NULL, -- email, phone, or push token
  subject text,
  content text,
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  error_message text
);

-- Amélioration de la table group_invitations existante
ALTER TABLE group_invitations 
ADD COLUMN IF NOT EXISTS invitation_type text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS custom_message text,
ADD COLUMN IF NOT EXISTS magic_token text UNIQUE,
ADD COLUMN IF NOT EXISTS qr_code_data text,
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS declined_at timestamptz;

-- Table de planification des rappels
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL, -- 'debt', 'expense_approval', 'group_activity'
  frequency text NOT NULL, -- 'daily', 'weekly', 'monthly'
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mise à jour de la table members pour rendre l'email obligatoire
ALTER TABLE members 
ALTER COLUMN email SET NOT NULL,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email": true, "push": false, "sms": false}';

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_email ON user_contacts(email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_next_run ON reminder_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_group_invitations_magic_token ON group_invitations(magic_token);
CREATE INDEX IF NOT EXISTS idx_group_invitations_expires_at ON group_invitations(expires_at);

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour user_contacts
CREATE POLICY "Users can manage own contacts"
  ON user_contacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour notification_preferences
CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour notification_logs
CREATE POLICY "Users can read own notification logs"
  ON notification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour reminder_schedules
CREATE POLICY "Users can manage own reminder schedules"
  ON reminder_schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, full_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_contacts_updated_at
  BEFORE UPDATE ON user_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction de nettoyage des invitations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  DELETE FROM group_invitations 
  WHERE expires_at < now() 
  AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour synchroniser les contacts avec les utilisateurs SplitEase
CREATE OR REPLACE FUNCTION sync_contacts_with_users()
RETURNS void AS $$
BEGIN
  UPDATE user_contacts 
  SET 
    is_splitease_user = true,
    splitease_user_id = u.id
  FROM auth.users u
  WHERE user_contacts.email = u.email
  AND user_contacts.is_splitease_user = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;