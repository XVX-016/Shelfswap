import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session and user from localStorage on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Create user profile if it doesn't exist
      if (session?.user && (event === 'SIGNED_IN' || event === 'SIGNED_UP')) {
        ensureUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserProfile = async (user: User) => {
    try {
      // Fetch current user row
      const { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('avatar_url, username, full_name')
        .eq('id', user.id)
        .single();

      let username = user.user_metadata?.username || dbUser?.username || user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'user_' + Math.random().toString(36).substring(2, 8);
      let full_name = user.user_metadata?.full_name || dbUser?.full_name || username;
      let avatar_url = user.user_metadata?.avatar_url || dbUser?.avatar_url || "/anonymous-avatar.png";

      const userData = {
        id: user.id,
        email: user.email!,
        username,
        full_name,
        avatar_url,
      };
      console.log('Upserting user data (patched):', userData);
      const { error: upsertError } = await supabase
        .from('users')
        .upsert([userData], { onConflict: ['id'] });
      if (upsertError) {
        console.error('Error upserting user profile:', upsertError);
        throw upsertError;
      } else {
        console.log('User profile upserted successfully');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      toast.error('Could not create your profile: ' + (error?.message || error));
      // Don't throw the error to prevent auth flow interruption
      // The user can complete their profile later
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    let emailToUse = emailOrUsername;
    // If not a valid email, treat as username and look up email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrUsername)) {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('username', emailOrUsername)
        .single();
      if (error || !data?.email) {
        throw new Error('No account found with that username');
      }
      emailToUse = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    try {
      console.log('Starting signup process...');
      
      // First, sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || username,
          },
        },
      });
      
      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }

      console.log('Signup successful:', authData.user?.id);
      
      // The user profile will be created in the auth state change handler
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth',
    });
    if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    verifyOtp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}