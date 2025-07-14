import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { AppRole } from '@/types/database';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndRole(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndRole(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfileAndRole = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      showError('Không thể tải thông tin cá nhân.');
      console.error('Error fetching profile:', profileError);
    } else {
      setProfile(profileData);
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      setRole('user'); // Default to 'user' if not found
    } else {
      setRole(roleData.role);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};