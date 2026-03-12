import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Target, Plus, X, UserPlus, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useFriends } from '../hooks/useSupabase';

interface StudyGroupProps {
  group: {
    id: string;
    name: string;
    description?: string;
    members: any[];
  };
  onJoin: (groupId: string) => void;
}

export const StudyGroup = ({ group, onJoin }: StudyGroupProps) => {
  const { user } = useAuth();
  const isMember = group.members.some(member => member.user_id === user?.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{group.name}</h3>
        {!isMember && (
          <button
            onClick={() => onJoin(group.id)}
            className="ghibli-button !py-2"
          >
            <Plus size={20} />
            Join Group
          </button>
        )}
      </div>
      {group.description && (
        <p className="text-gray-600 mb-4">{group.description}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>{group.members.length} members</span>
        </div>
      </div>
    </motion.div>
  );
};

export const CreateGroupModal = ({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}) => {
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create Study Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="ghibli-input"
              placeholder="e.g., Physics Study Group"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="ghibli-input !rounded-2xl"
              placeholder="What will your group focus on?"
              rows={3}
            />
          </div>

          <button type="submit" className="ghibli-button w-full">
            Create Group
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};