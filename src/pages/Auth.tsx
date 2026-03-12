import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mail, Lock, Eye, EyeOff, Cloud, User, ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Utility function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

interface FormErrors {
  email?: string;
  username?: string;
  fullName?: string;
  password?: string;
  confirmPassword?: string;
}

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showEmailVerificationBanner, setShowEmailVerificationBanner] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, verifyOtp, user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        break;
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters long';
        if (value.length > 30) return 'Username must be less than 30 characters';
        if (!/^[a-z0-9_]+$/.test(value)) return 'Username can only contain lowercase letters, numbers, and underscores';
        break;
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters long';
        if (value.trim().length > 50) return 'Full name must be less than 50 characters';
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters long';
        if (value.length > 128) return 'Password must be less than 128 characters';
        break;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        break;
    }
    return undefined;
  };

  const checkUsername = async (username: string) => {
    if (username.length < 3) return;
    
    try {
      setCheckingUsername(true);
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if ((error && error.code === 'PGRST116') || !data) {
        // No user found with this username
        setUsernameAvailable(true);
      } else {
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'username') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }

    switch (field) {
      case 'email':
        setEmail(processedValue);
        break;
      case 'username':
        setUsername(processedValue);
        if (processedValue.length >= 3) {
          checkUsername(processedValue);
        } else {
          setUsernameAvailable(true);
        }
        break;
      case 'fullName':
        setFullName(processedValue);
        break;
      case 'password':
        setPassword(processedValue);
        // Re-validate confirm password if it exists
        if (confirmPassword) {
          const confirmError = validateField('confirmPassword', confirmPassword);
          setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
        break;
      case 'confirmPassword':
        setConfirmPassword(processedValue);
        break;
    }

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Validate field if it's been touched
    if (touched[field]) {
      const error = validateField(field, processedValue);
      setErrors(prev => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  const retryOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a captcha verification error
        if (error.message?.includes('captcha verification process failed')) {
          if (attempt < RETRY_ATTEMPTS) {
            await delay(RETRY_DELAY * attempt); // Exponential backoff
            continue;
          }
        } else {
          // If it's not a captcha error, throw immediately
          throw error;
        }
      }
    }
    
    throw lastError;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {};

    if (mode === 'signup') {
      const fields = ['email', 'username', 'fullName', 'password', 'confirmPassword'];
      fields.forEach(field => {
        const value = field === 'email' ? email :
                     field === 'username' ? username :
                     field === 'fullName' ? fullName :
                     field === 'password' ? password :
                     confirmPassword;
        
        const error = validateField(field, value);
        if (error) {
          newErrors[field as keyof FormErrors] = error;
          isValid = false;
        }
      });
      
      if (!usernameAvailable) {
        newErrors.username = 'Username is already taken';
        isValid = false;
      }
    } else if (mode === 'login') {
      const emailError = validateField('email', email);
      const passwordError = validateField('password', password);
      
      if (emailError) {
        newErrors.email = emailError;
        isValid = false;
      }
      if (passwordError) {
        newErrors.password = passwordError;
        isValid = false;
      }
    } else if (mode === 'forgot') {
      const emailError = validateField('email', email);
      if (emailError) {
        newErrors.email = emailError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all relevant fields as touched
    const fieldsToTouch = mode === 'signup' 
      ? ['email', 'username', 'fullName', 'password', 'confirmPassword']
      : mode === 'login' 
      ? ['email', 'password']
      : ['email'];
    
    const touchedFields = fieldsToTouch.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(prev => ({ ...prev, ...touchedFields }));

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await retryOperation(async () => {
          await signIn(email, password);
        });
        console.log('Sign-in successful, navigating to /');
        toast.success('Welcome back!');
        navigate('/');
      } else if (mode === 'signup') {
        await retryOperation(async () => {
          await signUp(email, password, username, fullName);
        });
        setShowEmailVerificationBanner(true);
        toast.success('Account created successfully! Please check your email and confirm your account before signing in.');
        // Do not navigate to /marketplace
      } else if (mode === 'forgot') {
        if (!otpSent) {
          await resetPassword(email);
          setOtpSent(true);
          toast.success('OTP sent to your email');
        } else {
          await verifyOtp(email, otp);
          toast.success('Password reset successful!');
          setMode('login');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('Auth error:', errorMessage, error);
      toast.error(errorMessage);
      if (errorMessage.toLowerCase().includes('user already registered') || 
          errorMessage.toLowerCase().includes('user already exists')) {
        setMode('login');
      } else if (errorMessage.includes('captcha verification process failed')) {
        toast.error('Authentication temporarily unavailable. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === 'forgot' && otpSent) {
      setOtpSent(false);
    } else {
      setMode('login');
    }
    setOtp('');
    setErrors({});
    setTouched({});
  };

  const getFieldError = (field: keyof FormErrors) => touched[field] ? errors[field] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2c4a6b] via-[#85acc0] to-[#faf3e0] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated clouds */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: '-100%', opacity: 0.8 }}
          animate={{
            x: '100%',
            opacity: [0.8, 1, 0.8],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'linear',
            y: {
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatType: 'reverse',
            },
          }}
          style={{
            top: `${20 + i * 15}%`,
            left: `-${100 + i * 50}px`,
          }}
        >
          <Cloud className="text-white/30" size={48 + i * 16} />
        </motion.div>
      ))}

      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ opacity: 0.2 }}
          animate={{
            opacity: [0.2, 1, 0.2],
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode + (mode === 'forgot' ? otpSent : '')}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-8"
          >
            {showEmailVerificationBanner && (
              <div className="mb-4 px-4 py-2 rounded bg-yellow-100 border border-yellow-300 text-yellow-800 flex items-center justify-between text-sm">
                <span>
                  Please authorize your email ID from the email sent to you to activate your account.
                </span>
                <button
                  className="ml-4 text-yellow-700 hover:text-yellow-900 font-bold"
                  onClick={() => setShowEmailVerificationBanner(false)}
                  aria-label="Dismiss email verification banner"
                >
                  ×
                </button>
              </div>
            )}
            {mode !== 'login' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
              >
                <ArrowLeft size={20} />
                <span>Back to {otpSent ? 'email' : 'login'}</span>
              </button>
            )}

            <div className="flex justify-center mb-8">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                <BookOpen className="text-[--color-ghibli-blue] w-16 h-16" />
              </motion.div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2 text-[--color-kiki-navy]">
              {mode === 'login' ? 'Welcome Back!' : mode === 'signup' ? 'Join ShelfSwap' : 'Reset Password'}
            </h1>
            <p className="text-center text-gray-600 mb-8">
              {mode === 'login' ? 'Continue your book journey' : 
               mode === 'signup' ? 'Start your book journey today' : 
               otpSent ? 'Enter the OTP sent to your email' : 'Enter your email to receive OTP'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(!otpSent || mode !== 'forgot') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      className={`ghibli-input pl-10 ${getFieldError('email') ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="your@email.com"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  {getFieldError('email') && (
                    <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle size={16} />
                      <span>{getFieldError('email')}</span>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        onBlur={(e) => handleBlur('username', e.target.value)}
                        className={`ghibli-input pl-10 pr-10 ${
                          getFieldError('username') || (!usernameAvailable && username.length >= 3) ? 'border-red-500 focus:border-red-500' : 
                          usernameAvailable && username.length >= 3 ? 'border-green-500 focus:border-green-500' : ''
                        }`}
                        placeholder="Choose a username"
                        required
                        minLength={3}
                        maxLength={30}
                        pattern="[a-z0-9_]+"
                        title="Username can only contain lowercase letters, numbers, and underscores"
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      {username.length >= 3 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {checkingUsername ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-[--color-ghibli-blue] rounded-full animate-spin"></div>
                          ) : usernameAvailable ? (
                            <Check className="text-green-500" size={20} />
                          ) : (
                            <X className="text-red-500" size={20} />
                          )}
                        </div>
                      )}
                    </div>
                    {getFieldError('username') && (
                      <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        <span>{getFieldError('username')}</span>
                      </div>
                    )}
                    {username.length >= 3 && !usernameAvailable && !getFieldError('username') && (
                      <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        <span>This username is already taken</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Username must be 3-30 characters long and can only contain lowercase letters, numbers, and underscores
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        onBlur={(e) => handleBlur('fullName', e.target.value)}
                        className={`ghibli-input pl-10 ${getFieldError('fullName') ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="Your full name"
                        required
                        minLength={2}
                        maxLength={50}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    {getFieldError('fullName') && (
                      <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        <span>{getFieldError('fullName')}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {mode !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onBlur={(e) => handleBlur('password', e.target.value)}
                      className={`ghibli-input pl-10 pr-10 ${getFieldError('password') ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle size={16} />
                      <span>{getFieldError('password')}</span>
                    </div>
                  )}
                  {mode === 'signup' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Password must be 6-128 characters long
                    </p>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                      className={`ghibli-input pl-10 ${getFieldError('confirmPassword') ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                  {getFieldError('confirmPassword') && (
                    <div className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle size={16} />
                      <span>{getFieldError('confirmPassword')}</span>
                    </div>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[--color-ghibli-blue] focus:ring-[--color-ghibli-blue] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me for 30 days
                  </label>
                </div>
              )}

              {mode === 'forgot' && otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="ghibli-input"
                    placeholder="Enter OTP"
                    required
                  />
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading || (mode === 'signup' && (!usernameAvailable || checkingUsername))}
                className="ghibli-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Please wait...
                  </div>
                ) : (
                  mode === 'login' ? 'Sign In' : 
                  mode === 'signup' ? 'Create Account' : 
                  otpSent ? 'Verify OTP' : 'Send OTP'
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => {
                      setMode('signup');
                      setErrors({});
                      setTouched({});
                    }}
                    className="text-[--color-ghibli-blue] hover:underline block"
                  >
                    Don't have an account? Sign Up
                  </button>
                  <button
                    onClick={() => {
                      setMode('forgot');
                      setErrors({});
                      setTouched({});
                    }}
                    className="text-gray-600 hover:underline block"
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                    setTouched({});
                  }}
                  className="text-[--color-ghibli-blue] hover:underline"
                >
                  Already have an account? Sign In
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;