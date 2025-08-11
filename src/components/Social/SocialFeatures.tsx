import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ThumbsUp, 
  Laugh, 
  MessageCircle, 
  Trophy, 
  Star,
  Award,
  Target,
  TrendingUp,
  Calendar,
  Users,
  Send,
  Smile
} from 'lucide-react';
import { Group, Expense } from '../../types';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

interface SocialFeaturesProps {
  group: Group;
  onUpdateGroup: (group: Group) => void;
}

interface Reaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'love' | 'laugh';
  createdAt: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: Date;
}

interface Achievement {
  id: string;
  type: 'spender' | 'saver' | 'organizer' | 'contributor' | 'streak';
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
}

interface ActivityItem {
  id: string;
  type: 'expense_added' | 'expense_updated' | 'member_joined' | 'achievement_unlocked';
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  metadata?: any;
  createdAt: Date;
  reactions: Reaction[];
  comments: Comment[];
}

export function SocialFeatures({ group, onUpdateGroup }: SocialFeaturesProps) {
  const { user } = useAuthContext();
  const { addToast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    generateActivities();
    generateAchievements();
  }, [group]);

  const generateActivities = () => {
    const mockActivities: ActivityItem[] = group.expenses.slice(0, 10).map((expense, index) => ({
      id: expense.id,
      type: 'expense_added',
      userId: expense.paidBy,
      userName: group.members.find(m => m.id === expense.paidBy)?.name || 'Utilisateur',
      userAvatar: group.members.find(m => m.id === expense.paidBy)?.avatar || '',
      content: `a ajouté une dépense "${expense.description}" de ${expense.amount}€`,
      metadata: { expense },
      createdAt: expense.createdAt,
      reactions: [],
      comments: []
    }));

    setActivities(mockActivities);
  };

  const generateAchievements = () => {
    const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const userExpenses = group.expenses.filter(exp => exp.paidBy === user?.id);
    const userTotal = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const mockAchievements: Achievement[] = [];

    // Achievement: First Expense
    if (userExpenses.length >= 1) {
      mockAchievements.push({
        id: 'first-expense',
        type: 'contributor',
        title: 'Premier Pas',
        description: 'Première dépense ajoutée',
        icon: '🎯',
        color: 'bg-blue-500',
        unlockedAt: userExpenses[0].createdAt
      });
    }

    // Achievement: Big Spender
    if (userTotal > 100) {
      mockAchievements.push({
        id: 'big-spender',
        type: 'spender',
        title: 'Gros Dépensier',
        description: 'Plus de 100€ dépensés',
        icon: '💰',
        color: 'bg-yellow-500',
        unlockedAt: new Date()
      });
    }

    // Achievement: Group Organizer
    if (userExpenses.length >= 5) {
      mockAchievements.push({
        id: 'organizer',
        type: 'organizer',
        title: 'Organisateur',
        description: '5 dépenses ou plus',
        icon: '📋',
        color: 'bg-green-500',
        unlockedAt: new Date()
      });
    }

    // Achievement: Streak
    const recentExpenses = userExpenses.filter(exp => {
      const daysDiff = (new Date().getTime() - new Date(exp.date).getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7;
    });

    if (recentExpenses.length >= 3) {
      mockAchievements.push({
        id: 'streak',
        type: 'streak',
        title: 'En Série',
        description: '3 dépenses cette semaine',
        icon: '🔥',
        color: 'bg-red-500',
        unlockedAt: new Date()
      });
    }

    setAchievements(mockAchievements);
  };

  const addReaction = (activityId: string, reactionType: 'like' | 'love' | 'laugh') => {
    if (!user) return;

    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        const existingReaction = activity.reactions.find(r => r.userId === user.id);
        
        if (existingReaction) {
          // Remove existing reaction if same type, otherwise update
          if (existingReaction.type === reactionType) {
            return {
              ...activity,
              reactions: activity.reactions.filter(r => r.userId !== user.id)
            };
          } else {
            return {
              ...activity,
              reactions: activity.reactions.map(r => 
                r.userId === user.id ? { ...r, type: reactionType } : r
              )
            };
          }
        } else {
          // Add new reaction
          const newReaction: Reaction = {
            id: Date.now().toString(),
            userId: user.id,
            userName: user.user_metadata?.name || user.email || 'Utilisateur',
            type: reactionType,
            createdAt: new Date()
          };
          
          return {
            ...activity,
            reactions: [...activity.reactions, newReaction]
          };
        }
      }
      return activity;
    }));

    addToast({
      type: 'success',
      title: 'Réaction ajoutée',
      message: 'Votre réaction a été enregistrée',
      duration: 2000
    });
  };

  const addComment = (activityId: string) => {
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.user_metadata?.name || user.email || 'Utilisateur',
      userAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email || 'U')}&background=3b82f6&color=fff`,
      content: newComment.trim(),
      createdAt: new Date()
    };

    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          comments: [...activity.comments, comment]
        };
      }
      return activity;
    }));

    setNewComment('');
    addToast({
      type: 'success',
      title: 'Commentaire ajouté',
      message: 'Votre commentaire a été publié',
      duration: 2000
    });
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'laugh': return '😂';
      default: return '👍';
    }
  };

  const getReactionCount = (reactions: Reaction[], type: string) => {
    return reactions.filter(r => r.type === type).length;
  };

  const hasUserReacted = (reactions: Reaction[], type: string) => {
    return reactions.some(r => r.userId === user?.id && r.type === type);
  };

  return (
    <div className="space-y-6">
      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Vos Succès ({achievements.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className={`w-12 h-12 ${achievement.color} rounded-full flex items-center justify-center text-white text-xl`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Débloqué le {achievement.unlockedAt.toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Fil d'Activité
        </h3>
        
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
              {/* Activity Header */}
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={activity.userAvatar}
                  alt={activity.userName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {activity.userName}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.content}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.createdAt.toLocaleDateString('fr-FR')} à {activity.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Expense Details (if applicable) */}
              {activity.type === 'expense_added' && activity.metadata?.expense && (
                <div className="ml-13 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {activity.metadata.expense.description}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Catégorie: {activity.metadata.expense.category || 'Non catégorisé'}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {activity.metadata.expense.amount}€
                    </div>
                  </div>
                </div>
              )}

              {/* Reactions */}
              <div className="ml-13 flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addReaction(activity.id, 'like')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                      hasUserReacted(activity.reactions, 'like')
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>👍</span>
                    <span>{getReactionCount(activity.reactions, 'like')}</span>
                  </button>
                  
                  <button
                    onClick={() => addReaction(activity.id, 'love')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                      hasUserReacted(activity.reactions, 'love')
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>❤️</span>
                    <span>{getReactionCount(activity.reactions, 'love')}</span>
                  </button>
                  
                  <button
                    onClick={() => addReaction(activity.id, 'laugh')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                      hasUserReacted(activity.reactions, 'laugh')
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>😂</span>
                    <span>{getReactionCount(activity.reactions, 'laugh')}</span>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowComments(showComments === activity.id ? null : activity.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{activity.comments.length}</span>
                </button>
              </div>

              {/* Comments */}
              {showComments === activity.id && (
                <div className="ml-13 space-y-3">
                  {activity.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2">
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comment.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Comment */}
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.name || user?.email || 'U')}&background=3b82f6&color=fff`}
                      alt="Vous"
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(activity.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => addComment(activity.id)}
                        disabled={!newComment.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}