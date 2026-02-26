"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { AppRole } from '@/types/database';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  xp?: number;
  level?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  // Guard against stale async callbacks (race condition prevention)
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const isStale = () => !isMounted || requestIdRef.current !== currentRequestId;

    const getSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isStale()) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndRole(session.user.id, isStale);
        }
      } catch {
        // Error is handled by auth state change listener
      } finally {
        if (!isStale()) setLoading(false);
      }
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        // Bump request ID so any in-flight fetchProfileAndRole from a previous event becomes stale
        requestIdRef.current += 1;
        const callId = requestIdRef.current;
        const isCallStale = () => !isMounted || requestIdRef.current !== callId;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndRole(session.user.id, isCallStale);
        } else {
          setProfile(null);
          setRole(null);
        }
        if (!isCallStale()) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfileAndRole = async (userId: string, isStale: () => boolean = () => false) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (isStale()) return;

    if (profileError) {
      showError('Không thể tải thông tin cá nhân.');
    } else {
      setProfile(profileData);
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (isStale()) return;

    if (roleError) {
      setRole('user');
    } else {
      setRole(roleData.role);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Sign out error is non-critical; session will expire naturally
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    }
  };

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    signOut,
    refreshProfile,
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
