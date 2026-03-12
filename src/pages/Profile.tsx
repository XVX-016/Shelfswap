import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mail, User, Edit2, Save, X, Calendar, BookOpen, Trophy, Star, Upload, Check, AlertCircle, Settings, Moon, Sun, Book } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useSupabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import BookManager from '../components/BookManager';
import clsx from 'clsx';
import React from 'react';

const Profile = () => {
  const { user } = useAuth();
  const { user: userProfile, updateUser, checkUsername } = useUser(user?.id);
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({ username: '', full_name: '', avatar_url: '' });
  const [stats, setStats] = useState({ totalBooks: 0, soldBooks: 0, totalViews: 0, joinDate: '' });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name || '',
        avatar_url: userProfile.avatar_url || '',
      });
      setStats(prev => ({ ...prev, joinDate: userProfile.created_at }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (user) fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const { data: books, error } = await supabase.from('books').select('status').eq('seller_id', user.id);
      if (error) throw error;
      setStats(prev => ({
        ...prev,
        totalBooks: books?.length || 0,
        soldBooks: books?.filter(book => book.status === 'sold').length || 0,
      }));
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = async (e: any) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'username') processedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (name === 'username' && processedValue !== userProfile?.username) {
      if (processedValue.length >= 3) {
        setCheckingUsername(true);
        try {
          const available = await checkUsername(processedValue);
          setUsernameAvailable(available);
        } catch {
          setUsernameAvailable(false);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(true);
      }
    }
  };

  const handleImageSelect = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); setShowImageUpload(false); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image size must be less than 10MB'); setShowImageUpload(false); return; }
    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) { toast.error('Failed to upload image. Please try again.'); setShowImageUpload(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Profile picture uploaded successfully');
      setShowImageUpload(false);
    } catch (error: any) {
      toast.error('Failed to upload image'); setShowImageUpload(false);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.username.trim() || !formData.full_name.trim()) { toast.error('Username and Full Name are required.'); return; }
    if (!usernameAvailable && formData.username !== userProfile?.username) { toast.error('Username is already taken'); return; }
    try {
      setLoading(true);
      const updateData = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        avatar_url: formData.avatar_url,
      };
      await updateUser(updateData);
      setEditing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name || '',
        avatar_url: userProfile.avatar_url || '',
      });
    }
    setEditing(false);
    setUsernameAvailable(true);
    setTouched({});
    setErrors({});
  };

  // Animated stat count-up
  const AnimatedStat = ({ value }: { value: number }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = value;
      if (start === end) return;
      let incrementTime = 20;
      let timer = setInterval(() => {
        start += Math.ceil(end / 20);
        if (start >= end) { start = end; clearInterval(timer); }
        setCount(start);
      }, incrementTime);
      return () => clearInterval(timer);
    }, [value]);
    return <span>{count}</span>;
  };

  return (
    <div className={clsx('min-h-screen pt-20 relative overflow-hidden transition-colors', darkMode ? 'bg-gradient-to-b from-[#232946] via-[#2c4a6b] to-[#232946]' : 'bg-gradient-to-b from-[#2c4a6b] via-[#85acc0] to-[#faf3e0]') + ' font-[Inter,sans-serif]'}>
      {/* Optional: Profile Banner */}
      {/* <div className="w-full h-40 bg-gradient-to-r from-blue-400 to-green-300 rounded-b-3xl mb-8"></div> */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Glassmorphism Profile Header Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="backdrop-blur-lg bg-white/60 dark:bg-[#232946]/60 rounded-3xl shadow-2xl p-8 border border-white/30 relative">
            {/* Dark Mode Toggle */}
            <button onClick={() => setDarkMode(d => !d)} className="absolute top-6 right-6 p-2 rounded-full bg-white/40 hover:bg-white/70 dark:bg-[#232946]/40 dark:hover:bg-[#232946]/70 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-8 mb-8">
              <div className="relative w-32 h-32">
                <img src={formData.avatar_url || "/anonymous-avatar.png"} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white/60 shadow-lg" />
                {editing && (
                  <button type="button" onClick={() => setShowImageUpload(true)} className="absolute bottom-2 right-2 p-2 bg-white/80 dark:bg-[#232946]/80 rounded-full shadow-lg hover:shadow-xl transition-all border border-white/60">
                    <Camera size={20} />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Username *</label>
                  <div className="relative">
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={!editing} className={clsx('w-full px-4 py-2 rounded-full border-2 bg-white/40 dark:bg-[#232946]/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all', editing ? 'border-blue-300 focus:border-blue-500' : 'border-white/20')} placeholder="Choose a username" pattern="[a-z0-9_]+" title="Username can only contain lowercase letters, numbers, and underscores" />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    {editing && formData.username.length >= 3 && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        {checkingUsername ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : usernameAvailable || formData.username === userProfile?.username ? (
                          <Check className="text-green-400" size={20} />
                        ) : (
                          <X className="text-red-400" size={20} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full Name *</label>
                  <div className="relative">
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} disabled={!editing} className={clsx('w-full px-4 py-2 rounded-full border-2 bg-white/40 dark:bg-[#232946]/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all', editing ? 'border-blue-300 focus:border-blue-500' : 'border-white/20')} placeholder="Your full name" />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                  <div className="relative">
                    <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2 rounded-full border-2 bg-white/20 dark:bg-[#232946]/20 text-gray-500 dark:text-gray-400 border-white/20" />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                </div>
                {user && editing && (
                  <div className="flex gap-4 mt-6">
                    <button type="button" onClick={handleCancel} disabled={loading} className="flex-1 py-2 rounded-full bg-gray-200 dark:bg-[#232946]/40 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-[#232946]/60 transition-colors disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={loading || !usernameAvailable || checkingUsername} className="flex-1 py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
                {user && !editing && (
                  <button type="button" onClick={() => setEditing(true)} className="mt-6 w-full py-2 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                    <Edit2 size={20} /> Edit Profile
                  </button>
                )}
                {!user && (
                   <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-3">
                     <AlertCircle size={20} />
                     <p>Please <a href="/auth" className="underline font-bold">sign in</a> to manage your profile and listings.</p>
                   </div>
                )}
              </form>
            </div>
            {/* Toast/Snackbar for save confirmation */}
            <AnimatePresence>
              {showToast && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
                  Profile updated successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Profile Statistics Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 tracking-tight">Profile Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: BookOpen, value: stats.totalBooks, label: 'Books Listed' },
                { icon: Trophy, value: stats.soldBooks, label: 'Books Sold' },
                { icon: Star, value: stats.totalViews, label: 'Total Views' },
                { icon: Calendar, value: stats.joinDate && !isNaN(new Date(stats.joinDate).getTime()) ? format(new Date(stats.joinDate), 'MMM yyyy') : '—', label: 'Member Since' },
              ].map((stat, i) => (
                <motion.div key={stat.label} whileHover={{ y: -4, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)' }} className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-[#232946]/60 shadow-md transition-all cursor-pointer">
                  {React.createElement(stat.icon, { className: "w-8 h-8 text-blue-400 dark:text-blue-300" })}
                  <div className="flex-1 text-right">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {typeof stat.value === 'number' ? <AnimatedStat value={stat.value} /> : stat.value}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-10 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-2">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all', 
                  activeTab === 'profile' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-blue-500'
                )}
              >
                <Settings size={18} />
                <span>Profile Settings</span>
              </button>
              <button 
                onClick={() => setActiveTab('books')} 
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all', 
                  activeTab === 'books' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-blue-500'
                )}
              >
                <Book size={18} />
                <span>My Books</span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Account Settings</h3>
                <div className="bg-gray-50 dark:bg-[#232946]/40 rounded-lg p-6">
                  <p className="text-gray-600 dark:text-gray-300">
                    Your profile information is displayed to other users when you list books for sale. Keep your information up to date to build trust with potential buyers.
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'books' && (
              <BookManager onEditBook={(book) => {}} onCreateBook={() => { window.location.href = '/sell'; }} />
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-[#232946] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Profile Picture</h3>
                <button onClick={() => setShowImageUpload(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Choose an image file</p>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="avatar-upload" />
                  <label htmlFor="avatar-upload" className="ghibli-button cursor-pointer">Select Image</label>
                </div>
                <p className="text-sm text-gray-500 text-center">Maximum file size: 10MB. Supported formats: JPG, PNG, WebP</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;