import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, Brain, Trophy, Timer } from 'lucide-react';
import { StudyTimer, TimerPresets } from '../components/StudyTimer';
import { StudyGroup, CreateGroupModal } from '../components/StudyGroup';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StudyRoom = () => {
  const { user } = useAuth();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    studyTime: 0,
    streak: 0,
    studyGroups: 0,
    activeGoals: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(20);
  const [editingGoal, setEditingGoal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchStudyGroups();
    fetchProgress();
    fetchWeeklyGoal();
    fetchSessionHistory();
  }, []);

  const fetchStudyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          members:study_group_members(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudyGroups(data || []);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      toast.error('Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', user?.id)
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const totalTime = data?.reduce((acc, session) => acc + session.duration, 0) || 0;
      setProgress(prev => ({ ...prev, studyTime: Math.round(totalTime / 60) }));
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchWeeklyGoal = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_progress')
      .select('weekly_goal')
      .eq('user_id', user.id)
      .single();
    if (!error && data && data.weekly_goal) {
      setWeeklyGoal(data.weekly_goal);
    }
  };

  const handleSaveWeeklyGoal = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('user_progress')
      .upsert({ user_id: user.id, weekly_goal: weeklyGoal, updated_at: new Date().toISOString() });
    if (!error) {
      setEditingGoal(false);
    }
  };

  const handleCreateGroup = async (data: { name: string; description: string }) => {
    setLoading(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert([{
          name: data.name,
          description: data.description,
          creator_id: user?.id
        }])
        .select()
        .single();

      if (groupError) {
        toast.error('Failed to create study group: ' + groupError.message);
        setLoading(false);
        return;
      }

      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert([{
          group_id: group.id,
          user_id: user?.id,
          role: 'creator'
        }]);

      if (memberError) {
        toast.error('Failed to add creator as group member: ' + memberError.message);
        setLoading(false);
        return;
      }

      toast.success('Study group created!');
      setShowCreateGroup(false);
      fetchStudyGroups();
    } catch (error: any) {
      toast.error('Unexpected error: ' + (error?.message || error));
      console.error('Error creating study group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert([{
          group_id: groupId,
          user_id: user?.id,
          role: 'member'
        }]);

      if (error) throw error;
      toast.success('Joined study group!');
      fetchStudyGroups();
    } catch (error) {
      console.error('Error joining study group:', error);
      toast.error('Failed to join study group');
    }
  };

  const handleTimerComplete = () => {
    toast.success('Study session completed!');
    fetchProgress();
  };

  const handleProgressUpdate = async (field: string, value: number) => {
    if (!isEditing) return;
    
    setProgress(prev => ({ ...prev, [field]: value }));
    
    try {
      // Update progress in database
      const { error } = await supabase
        .from('user_progress')
        .upsert([{
          user_id: user?.id,
          [field]: value,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('Progress updated!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  // Fetch study session history for the current week
  const fetchSessionHistory = async () => {
    if (!user) return;
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', startOfWeek.toISOString())
      .order('started_at', { ascending: false });
    if (!error && data) setSessionHistory(data);
  };

  // Update history when a session is logged
  const handleSessionLogged = () => {
    fetchProgress();
    fetchSessionHistory();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#85acc0] via-[#faf3e0] to-[#f7e9c6] flex items-center justify-center">
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
      <div className="max-w-6xl w-full px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 md:gap-[32px] items-start">
          {/* Study Session Card */}
          <div className="bg-white/70 rounded-lg p-8 flex flex-col justify-between min-h-[420px]">
            <h2 className="text-2xl font-bold mb-6">Study Session</h2>
            <div className="flex flex-col items-center">
              <StudyTimer
                duration={selectedDuration}
                onComplete={handleTimerComplete}
                onSessionLogged={handleSessionLogged}
              />
              <div className="mt-8 flex flex-col items-center w-full">
                <div className="flex justify-center gap-4 w-full mb-4">
                  <TimerPresets onSelect={setSelectedDuration} />
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: Progress and Goals */}
          <div className="flex flex-col gap-8">
            <div className="bg-white/70 rounded-lg p-6" style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Progress</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-[--color-ghibli-blue] hover:underline"
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Timer className="text-[--color-ghibli-blue]" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Study Time</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={progress.studyTime}
                        onChange={(e) => handleProgressUpdate('studyTime', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                      />
                    ) : (
                      <p className="font-semibold">{progress.studyTime}h today</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="text-[--color-ghibli-pink]" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Streak</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={progress.streak}
                        onChange={(e) => handleProgressUpdate('streak', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                      />
                    ) : (
                      <p className="font-semibold">{progress.streak} days</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg p-6" style={{ width: 300, minWidth: 300, maxWidth: 300 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold mb-0">Weekly Goals</h3>
                <button
                  onClick={() => {
                    if (editingGoal) handleSaveWeeklyGoal();
                    else setEditingGoal(true);
                  }}
                  className="text-sm text-[--color-ghibli-blue] hover:underline"
                >
                  {editingGoal ? 'Save' : 'Edit'}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain size={16} className="text-[--color-ghibli-blue]" />
                      <span className="text-sm">Study Hours</span>
                    </div>
                    {editingGoal ? (
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={weeklyGoal}
                        onChange={e => setWeeklyGoal(Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded text-right"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">{progress.studyTime}/{weeklyGoal} hours</span>
                    )}
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-[--color-ghibli-blue] rounded-full"
                      style={{ width: `${Math.min((progress.studyTime / weeklyGoal) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Study Session History moved here */}
        <div className="w-full mx-auto mt-8">
          <div className="bg-white/70 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Study Session History (This Week)</h3>
            {sessionHistory.length === 0 ? (
              <div className="text-gray-500 text-center">No sessions yet this week.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {sessionHistory.map((session) => (
                  <li key={session.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-[--color-ghibli-blue]">
                        {format(new Date(session.started_at), 'EEE, MMM d')}
                      </span>
                      <span className="ml-2 text-gray-500 text-sm">
                        {format(new Date(session.started_at), 'h:mm a')}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-800">
                      {session.duration} min
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;