# SplitEase - Gestion Collaborative des Dépenses

Une Progressive Web App (PWA) moderne pour gérer facilement les dépenses partagées entre amis, lors de voyages, colocations, ou sorties en groupe.

## 🚀 Fonctionnalités

### Core Features
- **Dashboard interactif** avec vue d'ensemble des groupes et soldes
- **Gestion complète des groupes** avec membres et avatars générés
- **Suivi des dépenses** avec répartition personnalisable
- **Algorithme de simplification des dettes** pour minimiser les transactions
- **Interface de remboursements** avec suivi en temps réel
- **Système de thème** clair/sombre avec persistance
- **Export des données** en format CSV
- **Partage de groupes** via liens

### Design & UX
- **Responsive design** mobile-first (320px à 1920px+)
- **Animations fluides** et micro-interactions soignées
- **Palette de couleurs** intuitive (vert/rouge/bleu)
- **Accessibilité** conforme WCAG AA
- **Mode hors ligne** avec localStorage

## 🛠️ Technologies Utilisées

- **React 18** avec TypeScript
- **Supabase** pour la base de données et l'authentification
- **Tailwind CSS** pour le styling
- **Context API** pour la gestion d'état
- **localStorage** avec couche d'abstraction
- **PostgreSQL** via Supabase pour la persistance cloud
- **Lucide React** pour les icônes
- **Vite** comme bundler

## 📦 Installation

```bash
# Cloner le projet
git clone [repository-url]
cd splitease

# Installer les dépendances
npm install

# Configurer Supabase
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Lancer en développement
npm run dev

# Build pour production
npm run build
```

## 🔧 Configuration Supabase

1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com)
2. **Copier les clés** dans votre fichier `.env`
3. **Exécuter les migrations** dans l'éditeur SQL Supabase
4. **Configurer l'authentification** (email/password activé)

### Variables d'environnement requises

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🏗️ Architecture

### Structure des données

```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  members: Member[];
  expenses: Expense[];
  createdAt: Date;
  lastActivity: Date;
}

interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: { memberId: string; amount?: number }[];
  date: Date;
  category?: string;
  createdAt: Date;
}
```

### Couche d'abstraction données

L'application utilise deux services de données :

```typescript
// localStorage pour utilisation hors ligne
class DataService {
  async getGroups(): Promise<Group[]>
  async saveGroup(group: Group): Promise<void>
  async deleteGroup(groupId: string): Promise<void>
  async exportGroupData(groupId: string): Promise<string>
}

// Supabase pour synchronisation cloud
class SupabaseDataService {
  async getGroups(): Promise<Group[]>
  async signIn(email: string, password: string)
  async signUp(email: string, password: string, name: string)
  subscribeToGroupChanges(groupId: string, callback: Function)
}
```

## 🧮 Algorithme de Simplification des Dettes

L'application implémente un algorithme optimisé qui :

1. **Calcule les soldes nets** de chaque membre
2. **Minimise le nombre de transactions** nécessaires
3. **Propose des remboursements optimaux**

Exemple : Si A doit 20€ à B et B doit 15€ à C, l'algorithme suggère "A verse 15€ à C et 5€ à B" au lieu de deux transactions séparées.

## 📱 Progressive Web App

L'application est configurée comme PWA avec :

- **Manifest.json** pour l'installation
- **Mode hors ligne** avec localStorage (sans connexion)
- **Synchronisation cloud** avec Supabase (connecté)
- **Service Worker** pour le mode hors ligne (prêt à implémenter)
- **Design responsive** optimisé mobile
- **Performance** optimisée avec lazy loading

## 🎨 Système de Design

### Couleurs
- **Primaire** : Bleu (#3b82f6) pour les actions principales
- **Succès** : Vert (#10b981) pour les soldes positifs
- **Erreur** : Rouge (#ef4444) pour les soldes négatifs
- **Neutre** : Gris pour les éléments secondaires

### Animations
- **Transitions** fluides (0.2-0.3s)
- **Micro-interactions** sur les boutons et cartes
- **Chargements** avec spinners animés

## 🔧 Configuration

### Variables d'environnement

```env
# Configuration Supabase (optionnelle)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# L'app fonctionne sans Supabase (localStorage uniquement)
```

### Personnalisation du thème

Le thème peut être personnalisé dans `tailwind.config.js` :

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* couleurs personnalisées */ }
    }
  }
}
```

## 📊 Performances

- **Temps de chargement initial** < 3 secondes
- **Compatible** navigateurs modernes (Chrome 90+, Firefox 88+, Safari 14+)
- **Bundle size** optimisé avec tree-shaking
- **Lazy loading** des composants non-critiques

## 🧪 Tests

```bash
# Lancer les tests (à implémenter)
npm run test

# Tests avec coverage
npm run test:coverage
```

## 🚀 Déploiement

```bash
# Build optimisé
npm run build

# Preview du build
npm run preview
```

L'application peut être déployée sur :
- **Netlify**
- **Vercel** 
- **GitHub Pages**
- Tout serveur statique

## 🔮 Roadmap

### Version 2.0
- [x] Synchronisation cloud avec Supabase
- [x] Authentification utilisateur
- [x] Base de données PostgreSQL
- [ ] Notifications push
- [ ] Intégration bancaire (lecture seule)
- [ ] Photos de reçus avec OCR
- [ ] Géolocalisation des dépenses

### Version 1.1
- [x] Système de toasts amélioré
- [x] Algorithme de dettes optimisé
- [x] Interface responsive améliorée
- [ ] Catégories personnalisées
- [ ] Devises multiples
- [ ] Historique des remboursements
- [ ] Statistiques avancées

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 💡 Support

Pour toute question ou suggestion :
- Ouvrir une **issue** sur GitHub
- Consulter la **documentation** dans le wiki
- Rejoindre les **discussions** de la communauté

---

**SplitEase** - Parce que partager les frais ne devrait jamais être compliqué ! 💙