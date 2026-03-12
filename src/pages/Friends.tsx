import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, MessageSquare, Clock, BookOpen, Users, Filter, Heart } from 'lucide-react';
import { useUser, useFriends } from '../hooks/useSupabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user: currentUser } = useAuth();
  const { searchUsers } = useUser();
  const { friends, loading, sendFriendRequest } = useFriends();

  // Dummy friend data
  const dummyFriends = [
    {
      id: 'friend1',
      friend: {
        username: 'kiki_delivery',
        full_name: 'Kiki',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
      }
    },
    {
      id: 'friend2',
      friend: {
        username: 'totoro_forest',
        full_name: 'Totoro',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
      }
    }
  ];

  const displayFriends = friends.length > 0 ? friends : dummyFriends;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results?.filter(user => user.id !== currentUser?.id) || []);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      toast.error('Failed to send friend request');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#2c4a6b] via-[#85acc0] to-[#faf3e0]">
      {/* Animated stars like Hero */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: Infinity,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
          }}
        />
      ))}
      <div className="max-w-4xl mx-auto p-6 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Study Buddies</h1>
        </div>
        
        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-gray-200 focus:border-[--color-ghibli-blue] focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          {['all', 'online', 'studying', 'suggested'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-4 capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-[--color-ghibli-blue] text-[--color-ghibli-blue]'
                  : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="loading-sprite mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayFriends.map((friend) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <img
                    src={friend.friend.avatar_url}
                    alt={friend.friend.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold">{friend.friend.username}</h3>
                  {friend.friend.full_name && (
                    <p className="text-sm text-gray-500">{friend.friend.full_name}</p>
                  )}
                </div>

                <div className="flex items-center gap-6 text-gray-500">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <MessageSquare size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;