import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import { Profile, StudentProfile, AgentProfile, UserRole } from '../types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://zowpgsfupecvzxirzqti.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HtwW8FpC1YE97ceq0dzwfQ_i7gxAwFd';

export interface StudentSignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  matricNumber?: string;
  department?: string;
  level?: string;
}

export interface AgentCreateData {
  email: string;
  temporaryPassword: string;
  fullName: string;
  phoneNumber: string;
  agencyName?: string;
  officeAddress?: string;
}

export interface AgentSignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  agencyName?: string;
  officeAddress?: string;
  nin: string;
  idType?: string;
  govIdUrl?: string;
  selfieUrl?: string;
  govIdFile?: File | null;
  selfieFile?: File | null;
  operatingLocations?: string[];
}

// Memory profile cache to reduce redundant network hits during re-renders
let cachedProfileResult: {
  userId: string;
  data: {
    user: any;
    profile: Profile | null;
    studentProfile: StudentProfile | null;
    agentProfile: AgentProfile | null;
  };
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 3500; // 3.5 seconds

// Exponential backoff helper for network resilience
async function retryOperation<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isNetworkError =
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('fetch');
    if (retries > 0 && isNetworkError) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return retryOperation(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

export const authService = {
  // Clear in-memory profile cache
  clearProfileCache() {
    cachedProfileResult = null;
  },

  // Get currently logged-in user profile with detailed role info
  async getCurrentProfile(forceRefresh = false): Promise<{
    user: any;
    profile: Profile | null;
    studentProfile: StudentProfile | null;
    agentProfile: AgentProfile | null;
  } | null> {
    try {
      // Fast check for existing session before triggering network request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        cachedProfileResult = null;
        return null;
      }
      const user = session.user;

      // Check cache if not forcing refresh
      if (
        !forceRefresh &&
        cachedProfileResult &&
        cachedProfileResult.userId === user.id &&
        Date.now() - cachedProfileResult.timestamp < CACHE_TTL_MS
      ) {
        return cachedProfileResult.data;
      }

      // 1. Fetch main profile from DB (database is authoritative source) with retry
      let profileData: Profile | null = null;
      let profileError: any = null;

      try {
        const result = await retryOperation(async () => {
          const res = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          if (res.error && res.error.message?.includes('Failed to fetch')) {
            throw res.error;
          }
          return res;
        });
        profileData = result.data;
        profileError = result.error;
      } catch (networkErr: any) {
        profileError = networkErr;
      }

      // If there was a database/network/RLS query error, do NOT assume missing profile,
      // and DO NOT silently create/downgrade to student.
      if (profileError) {
        console.warn('Profile retrieval notice for user ID:', user.id, profileError.message || profileError);
        // If we have previous cache for this user, reuse it during temporary network hiccup
        if (cachedProfileResult && cachedProfileResult.userId === user.id) {
          return cachedProfileResult.data;
        }
        return null;
      }

      let profile: Profile | null = profileData;

      // 2. Only if the profile record genuinely does not exist (query succeeded with 0 rows returned)
      if (!profile) {
        const meta = user.user_metadata || {};
        let rawRole = meta.role || 'student';
        
        // PRIVILEGE ESCALATION PREVENTION:
        // Never allow user_metadata.role = 'admin' to grant admin profile privileges.
        // Admin profile rows must be inserted directly in the database.
        if (rawRole === 'admin') {
          rawRole = 'student';
        }

        const role = rawRole as UserRole;
        const fullName = meta.full_name || meta.fullName || user.email?.split('@')[0] || 'User';
        const phone = meta.phone_number || meta.phoneNumber || null;

        const { data: newP, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            phone_number: phone,
            role: role,
            is_active: true,
          })
          .select()
          .maybeSingle();

        if (insertError) {
          console.warn('Notice creating default non-admin profile:', insertError.message);
          return null;
        }

        profile = newP;

        if (role === 'student' && profile) {
          await supabase.from('student_profiles').upsert({
            id: user.id,
            matric_number: meta.matric_number || meta.matricNumber || null,
            department: meta.department || null,
            level: meta.level || null,
          });
        } else if (role === 'agent' && profile) {
          await supabase.from('agent_profiles').upsert({
            id: user.id,
            agency_name: meta.agency_name || meta.agencyName || null,
            office_address: meta.office_address || meta.officeAddress || null,
          });
        }
      }

      if (!profile) {
        return null;
      }

      let studentProfile: StudentProfile | null = null;
      let agentProfile: AgentProfile | null = null;

      // Fetch role-specific details based strictly on the database profile.role
      if (profile.role === 'student') {
        const { data: sp, error: spErr } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (!spErr && sp) {
          studentProfile = sp;
        }
      } else if (profile.role === 'agent') {
        const { data: ap, error: apErr } = await supabase
          .from('agent_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (!apErr && ap) {
          agentProfile = ap;
          profile = { ...profile, agent_profile: ap };
        }
      } else if (profile.role === 'admin') {
        // Admin sessions must have null studentProfile and agentProfile for strict state consistency
        studentProfile = null;
        agentProfile = null;
      }

      const resultPayload = { user, profile, studentProfile, agentProfile };
      cachedProfileResult = {
        userId: user.id,
        data: resultPayload,
        timestamp: Date.now(),
      };

      return resultPayload;
    } catch (err: any) {
      console.warn('Notice getting current profile:', err?.message || err);
      return null;
    }
  },

  // Student self-registration
  async registerStudent(data: StudentSignUpData) {
    const cleanEmail = data.email.trim().toLowerCase();

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            role: 'student',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Student registration failed.');

      // Check if email already exists in auth.users (Supabase returns empty identities array when user exists)
      if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please sign in with your existing credentials.');
      }

      const userId = authData.user.id;

      // 2. Insert profiles record
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: data.fullName,
          email: cleanEmail,
          phone_number: data.phoneNumber,
          role: 'student',
          is_active: true,
        });

      if (profileError) console.warn('Profiles insert notice:', profileError.message);

      // 3. Insert student_profiles record
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          id: userId,
          matric_number: data.matricNumber || null,
          department: data.department || null,
          level: data.level || null,
        });

      if (studentError) console.warn('Student profile insert notice:', studentError.message);

      return authData;
    } catch (err: any) {
      if (err.message && (err.message.includes('email rate limit') || err.message.includes('over_email_send_rate_limit') || err.message.includes('rate limit exceeded') || err.message.includes('rate exceeded'))) {
        throw new Error('Supabase email rate limit exceeded. MANUAL ACTION REQUIRED: In Supabase Dashboard -> Authentication -> Providers -> Email, turn OFF "Confirm email" to enable instant registration without rate limits.');
      }
      throw err;
    }
  },

  // Agent self-registration with pending verification status
  async registerAgent(data: AgentSignUpData) {
    const cleanEmail = data.email.trim().toLowerCase();

    try {
      // 1. SignUp user in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            role: 'agent',
            agency_name: data.agencyName || null,
            office_address: data.officeAddress || null,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Agent registration failed.');

      // Check if email already exists in auth.users
      if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please sign in with your existing credentials.');
      }

      const userId = authData.user.id;

      // 2. Upload verification documents if files provided
      let govIdUrl = data.govIdUrl || null;
      let selfieUrl = data.selfieUrl || null;

      if (data.govIdFile) {
        try {
          govIdUrl = await storageService.uploadFile('agent-documents', data.govIdFile);
        } catch (e) {
          console.warn('Government ID upload notice:', e);
        }
      }

      if (data.selfieFile) {
        try {
          selfieUrl = await storageService.uploadFile('agent-documents', data.selfieFile);
        } catch (e) {
          console.warn('Selfie upload notice:', e);
        }
      }

      // 3. Upsert profiles row
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: data.fullName,
        email: cleanEmail,
        phone_number: data.phoneNumber,
        role: 'agent',
        is_active: true,
      });
      if (pErr) console.warn('Profiles upsert warning:', pErr.message);

      // 4. Upsert agent_profiles row with verification_status = 'pending'
      const { error: apErr } = await supabase.from('agent_profiles').upsert({
        id: userId,
        agency_name: data.agencyName || 'Independent Agent',
        office_address: data.officeAddress || 'Wukari, Taraba State',
        verification_status: 'pending',
        nin: data.nin || null,
        government_id_url: govIdUrl,
        selfie_url: selfieUrl,
        must_change_password: false,
      });
      if (apErr) console.warn('Agent profiles upsert warning:', apErr.message);

      // 5. Insert verification_requests record for Admin review
      const { error: vrErr } = await supabase.from('verification_requests').insert({
        agent_id: userId,
        agency_name: data.agencyName || 'Independent Agent',
        office_address: data.officeAddress || 'Wukari, Taraba State',
        nin: data.nin || null,
        government_id_url: govIdUrl,
        selfie_url: selfieUrl,
        status: 'pending',
      });
      if (vrErr) console.warn('Verification requests insert warning:', vrErr.message);

      return authData;
    } catch (err: any) {
      if (err.message && (err.message.includes('email rate limit') || err.message.includes('over_email_send_rate_limit') || err.message.includes('rate limit exceeded') || err.message.includes('rate exceeded'))) {
        throw new Error('Supabase email rate limit exceeded. MANUAL ACTION REQUIRED: In Supabase Dashboard -> Authentication -> Providers -> Email, turn OFF "Confirm email" to enable instant registration without rate limits.');
      }
      throw err;
    }
  },

  // Login
  async signIn(email: string, password: string) {
    this.clearProfileCache();
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;

    return data;
  },

  // Resend confirmation email for unverified user
  async resendConfirmationEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    if (error) throw error;
    return data;
  },

  // Logout
  async signOut() {
    this.clearProfileCache();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Change Agent Temporary Password
  async updatePassword(newPassword: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: updateAuthErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateAuthErr) throw updateAuthErr;

    // Set must_change_password = false in agent_profiles
    const { error: agentErr } = await supabase
      .from('agent_profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    if (agentErr) console.error('Error updating must_change_password:', agentErr);

    return true;
  },

  // Admin creating an Agent Account without overwriting current admin session
  async adminCreateAgent(data: AgentCreateData) {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Verify caller is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Unauthorized');

    const { data: adminProf } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (adminProf?.role !== 'admin') {
      throw new Error('Only administrators can create agent accounts.');
    }

    // 2. Create isolated client so session in browser is not replaced
    const tempAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });

    try {
      const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
        email: cleanEmail,
        password: data.temporaryPassword,
        options: {
          data: {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            role: 'agent',
            created_by_admin: true,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Agent account creation failed.');

      if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please select a different email address.');
      }

      const newAgentId = authData.user.id;

      // 3. Insert profile using temp client (or admin client)
      const { error: pErr } = await tempAuthClient.from('profiles').upsert({
        id: newAgentId,
        full_name: data.fullName,
        email: cleanEmail,
        phone_number: data.phoneNumber,
        role: 'agent',
        is_active: true,
      });

      if (pErr) console.error('Error inserting profiles for new agent:', pErr);

      // 4. Insert agent_profile
      const { error: apErr } = await tempAuthClient.from('agent_profiles').upsert({
        id: newAgentId,
        agency_name: data.agencyName || null,
        office_address: data.officeAddress || null,
        verification_status: 'unverified',
        must_change_password: true,
      });

      if (apErr) console.error('Error inserting agent_profiles for new agent:', apErr);

      // 5. Log action in audit logs with active admin client
      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        action: 'ADMIN_CREATE_AGENT',
        entity_type: 'profiles',
        entity_id: newAgentId,
        details: { agent_email: data.email, agent_name: data.fullName },
      });

      return authData;
    } catch (err: any) {
      if (err.message && (err.message.includes('email rate limit') || err.message.includes('over_email_send_rate_limit') || err.message.includes('rate limit exceeded') || err.message.includes('rate exceeded'))) {
        throw new Error('Supabase email rate limit exceeded. MANUAL ACTION REQUIRED: In Supabase Dashboard -> Authentication -> Providers -> Email, turn OFF "Confirm email" to enable instant agent creation without rate limits.');
      }
      throw err;
    }
  },
};
