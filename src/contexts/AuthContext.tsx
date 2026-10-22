import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, StudentProfile, AgentProfile } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  studentProfile: StudentProfile | null;
  agentProfile: AgentProfile | null;
  loading: boolean;
  mustChangePassword: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  studentProfile: null,
  agentProfile: null,
  loading: true,
  mustChangePassword: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentProfile = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const res = await authService.getCurrentProfile(forceRefresh);
      if (res && res.profile) {
        setUser(res.user);
        setProfile(res.profile);
        setStudentProfile(res.profile.role === 'student' ? res.studentProfile : null);
        setAgentProfile(res.profile.role === 'agent' ? res.agentProfile : null);
      } else {
        setUser(null);
        setProfile(null);
        setStudentProfile(null);
        setAgentProfile(null);
      }
    } catch (err) {
      console.warn('Notice in AuthProvider fetchCurrentProfile:', err);
      setUser(null);
      setProfile(null);
      setStudentProfile(null);
      setAgentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await fetchCurrentProfile();
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (session?.user) {
        fetchCurrentProfile();
      } else {
        setUser(null);
        setProfile(null);
        setStudentProfile(null);
        setAgentProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setStudentProfile(null);
    setAgentProfile(null);
  };

  const mustChangePassword = !!(
    profile?.role === 'agent' &&
    agentProfile?.must_change_password
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        studentProfile,
        agentProfile,
        loading,
        mustChangePassword,
        refreshProfile: () => fetchCurrentProfile(true),
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
