import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface StudyTimerProps {
  duration: number; // in minutes
  onComplete: () => void;
  onSessionLogged?: () => void;
}

export const StudyTimer = ({ duration, onComplete, onSessionLogged }: StudyTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const { user } = useAuth();
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      if (!sessionStart) setSessionStart(new Date());
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    onComplete();
    // Log session to backend
    if (user && sessionStart) {
      const started_at = sessionStart.toISOString();
      const ended_at = new Date().toISOString();
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          duration,
          subject: null,
          started_at,
          ended_at,
        });
      if (!error && onSessionLogged) onSessionLogged();
    }
    setSessionStart(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setSessionStart(null);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Animated minimal book icon */}
      <motion.svg
        width="64" height="48" viewBox="0 0 64 48"
        className="mb-4"
        initial={false}
        animate={isRunning ? { rotate: [0, -15, 15, 0] } : { rotate: 0 }}
        transition={isRunning ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
        style={{ originX: 0.5, originY: 1 }}
      >
        {/* Book base */}
        <rect x="8" y="12" width="48" height="28" rx="4" fill="#fff" stroke="#2c4a6b" strokeWidth="2" />
        {/* Book cover (flapping) */}
        <motion.rect
          x="8" y="12" width="24" height="28" rx="4"
          fill="#85acc0"
          stroke="#2c4a6b"
          strokeWidth="2"
          style={{ originX: 1, originY: 1 }}
          animate={isRunning ? { rotate: [0, -25, 0] } : { rotate: 0 }}
          transition={isRunning ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
        />
        {/* Book spine */}
        <rect x="30" y="12" width="4" height="28" fill="#2c4a6b" opacity="0.2" />
      </motion.svg>
      <div className="w-48 h-48 mb-6">
        <CircularProgressbar
          value={progress}
          text={formatTime(timeLeft)}
          styles={buildStyles({
            pathColor: '#85acc0',
            textColor: '#2c4a6b',
            trailColor: '#f3f4f6',
          })}
        />
      </div>
      <div className="flex gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning(!isRunning)}
          className="ghibli-button !p-3"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={reset}
          className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <RotateCcw size={24} />
        </motion.button>
      </div>
    </div>
  );
};

export const TimerPresets = ({
  onSelect
}: {
  onSelect: (minutes: number) => void;
}) => {
  const presets = [25, 45, 60];

  return (
    <div className="flex gap-3 justify-center">
      {presets.map(preset => (
        <button
          key={preset}
          onClick={() => onSelect(preset)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full hover:bg-gray-50 transition-colors"
        >
          <Clock size={16} />
          <span>{preset}m</span>
        </button>
      ))}
    </div>
  );
};