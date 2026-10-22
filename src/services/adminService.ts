import { supabase } from '../lib/supabase';
import { storageService } from './storageService';
import { propertyService } from './propertyService';
import { Profile, Property, Report, VerificationRequest, AuditLog } from '../types';

export const adminService = {
  // Get live platform metrics
  async getDashboardStats() {
    const [
      { count: totalUsers },
      { count: totalStudents },
      { count: totalAgents },
      { count: totalAdmins },
      { count: verifiedAgents },
      { count: pendingAgents },
      { count: suspendedAgents },
      { count: totalProperties },
      { count: approvedProperties },
      { count: pendingProperties },
      { count: pendingReports },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).then(r => r, () => ({ count: 0 })),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').then(r => r, () => ({ count: 0 })),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent').then(r => r, () => ({ count: 0 })),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin').then(r => r, () => ({ count: 0 })),
      supabase.from('agent_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified').then(r => r, () => ({ count: 0 })),
      supabase.from('agent_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending').then(r => r, () => ({ count: 0 })),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent').eq('is_active', false).then(r => r, () => ({ count: 0 })),
      supabase.from('properties').select('id', { count: 'exact', head: true }).then(r => r, () => ({ count: 0 })),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'approved').then(r => r, () => ({ count: 0 })),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(r => r, () => ({ count: 0 })),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(r => r, () => ({ count: 0 })),
    ]);

    return {
      totalUsers: totalUsers || 0,
      totalStudents: totalStudents || 0,
      totalAgents: totalAgents || 0,
      totalAdmins: totalAdmins || 0,
      verifiedAgents: verifiedAgents || 0,
      pendingAgents: pendingAgents || 0,
      suspendedAgents: suspendedAgents || 0,
      totalProperties: totalProperties || 0,
      approvedProperties: approvedProperties || 0,
      pendingProperties: pendingProperties || 0,
      pendingReports: pendingReports || 0,
      pendingVerifications: pendingAgents || 0,
    };
  },

  async getAdminDashboardStats() {
    return this.getDashboardStats();
  },

  // Get agent verification applications safely with full agent & agent_profile attached
  async getVerificationRequests(statusFilter?: 'pending' | 'approved' | 'rejected') {
    try {
      let query = supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: vReqs, error } = await query;
      if (error) {
        console.warn('getVerificationRequests query notice:', error.message);
        return [] as VerificationRequest[];
      }
      if (!vReqs || vReqs.length === 0) return [] as VerificationRequest[];

      // Retrieve corresponding profiles and agent_profiles safely
      const agentIds = Array.from(new Set(vReqs.map(r => r.agent_id)));
      const [{ data: profiles }, { data: agentProfiles }] = await Promise.all([
        supabase.from('profiles').select('*').in('id', agentIds).then(r => r, () => ({ data: [] })),
        supabase.from('agent_profiles').select('*').in('id', agentIds).then(r => r, () => ({ data: [] })),
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const agentProfileMap = new Map((agentProfiles || []).map(ap => [ap.id, ap]));

      return Promise.all(vReqs.map(async (req) => {
        const prof = profileMap.get(req.agent_id);
        const ap = agentProfileMap.get(req.agent_id);

        const govIdRaw = req.government_id_url || ap?.government_id_url;
        const selfieRaw = req.selfie_url || ap?.selfie_url;

        let signedGovId = null;
        let signedSelfie = null;
        try {
          [signedGovId, signedSelfie] = await Promise.all([
            storageService.getSignedDocumentUrl(govIdRaw),
            storageService.getSignedDocumentUrl(selfieRaw),
          ]);
        } catch (e) {
          console.warn('Skip document signing:', e);
        }

        return {
          ...req,
          government_id_url: signedGovId || req.government_id_url,
          selfie_url: signedSelfie || req.selfie_url,
          agent: prof ? {
            ...prof,
            agent_profile: ap ? {
              ...ap,
              government_id_url: signedGovId || ap.government_id_url,
              selfie_url: signedSelfie || ap.selfie_url,
            } : null,
          } : null,
        };
      })) as Promise<VerificationRequest[]>;
    } catch (err) {
      console.warn('getVerificationRequests fallback:', err);
      return [] as VerificationRequest[];
    }
  },

  async getPendingVerificationRequests() {
    return this.getVerificationRequests('pending');
  },

  // Fetch full details for a specific agent by Agent User ID
  async getAgentDetails(agentId: string) {
    const [{ data: profile, error: pErr }, { data: agentProfile }, { data: vReqs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', agentId).single(),
      supabase.from('agent_profiles').select('*').eq('id', agentId).maybeSingle(),
      supabase.from('verification_requests').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }),
    ]);

    if (pErr) throw pErr;

    const latestRequest = vReqs && vReqs.length > 0 ? vReqs[0] : null;

    const govIdRaw = agentProfile?.government_id_url || latestRequest?.government_id_url;
    const selfieRaw = agentProfile?.selfie_url || latestRequest?.selfie_url;

    const [signedGovId, signedSelfie] = await Promise.all([
      storageService.getSignedDocumentUrl(govIdRaw),
      storageService.getSignedDocumentUrl(selfieRaw),
    ]);

    const resolvedAgentProfile = agentProfile ? {
      ...agentProfile,
      government_id_url: signedGovId || agentProfile.government_id_url,
      selfie_url: signedSelfie || agentProfile.selfie_url,
    } : null;

    const resolvedLatestRequest = latestRequest ? {
      ...latestRequest,
      government_id_url: signedGovId || latestRequest.government_id_url,
      selfie_url: signedSelfie || latestRequest.selfie_url,
    } : null;

    return {
      profile: profile as Profile,
      agentProfile: resolvedAgentProfile,
      verificationRequest: resolvedLatestRequest as VerificationRequest | null,
      allRequests: (vReqs || []) as VerificationRequest[],
    };
  },

  // Approve or Reject Agent Verification
  async reviewAgentVerification(requestId: string, agentId: string, status: 'approved' | 'rejected', adminNotes?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Update verification_requests table
    if (requestId) {
      await supabase
        .from('verification_requests')
        .update({
          status,
          admin_notes: adminNotes || null,
        })
        .eq('id', requestId);
    } else {
      await supabase
        .from('verification_requests')
        .update({
          status,
          admin_notes: adminNotes || null,
        })
        .eq('agent_id', agentId)
        .eq('status', 'pending');
    }

    // 2. Update agent_profiles verification_status safely
    const targetStatus = status === 'approved' ? 'verified' : 'rejected';
    const apPayload: any = {
      verification_status: targetStatus,
      verification_rejection_reason: status === 'rejected' ? adminNotes : null,
      rejection_reason: status === 'rejected' ? adminNotes : null,
    };

    let apAttempts = 0;
    while (apAttempts < 5) {
      apAttempts++;
      const { error: apErr } = await supabase
        .from('agent_profiles')
        .update(apPayload)
        .eq('id', agentId);

      if (!apErr) break;

      const msg = apErr.message || '';
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column "([^"]+)"/i);
      const m3 = msg.match(/column '([^']+)'/i);
      const missingCol = m1?.[1] || m2?.[1] || m3?.[1];

      if (missingCol && missingCol in apPayload) {
        console.warn(`Column '${missingCol}' missing in agent_profiles during update, stripping...`);
        delete apPayload[missingCol];
      } else {
        console.error('Error updating agent_profiles verification status:', apErr);
        throw apErr;
      }
    }

    // 3. Notify the agent
    await supabase.from('notifications').insert({
      user_id: agentId,
      title: status === 'approved' ? 'Identity Verification Approved' : 'Verification Request Rejected',
      message: status === 'approved' 
        ? 'Congratulations! Your agent identity verification has been approved. You can now publish property listings.' 
        : `Your verification request was rejected. Reason: ${adminNotes || 'Information provided did not meet criteria.'}`,
      type: status === 'approved' ? 'verification_approved' : 'verification_rejected',
      link_url: '/agent/profile',
    });

    // 4. Audit Log
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `AGENT_VERIFICATION_${status.toUpperCase()}`,
        entity_type: 'agent_profiles',
        entity_id: agentId,
        details: { admin_notes: adminNotes },
      });
    }

    return true;
  },

  async approveAgentVerification(requestId: string, agentId: string) {
    return this.reviewAgentVerification(requestId, agentId, 'approved');
  },

  async rejectAgentVerification(requestId: string, agentId: string, reason?: string) {
    return this.reviewAgentVerification(requestId, agentId, 'rejected', reason);
  },

  // Get all property listings for moderation
  async getAllPropertiesForAdmin() {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        agent:profiles(
          id, full_name, email, phone_number,
          agent_profile:agent_profiles(*)
        ),
        images:property_images(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin getAllProperties join error, falling back:', error);
      const { data: fallbackData } = await supabase
        .from('properties')
        .select('*, images:property_images(*)')
        .order('created_at', { ascending: false });
      return (fallbackData || []) as Property[];
    }
    return data as Property[];
  },

  // Approve / Reject / Archive Property Listing
  async updatePropertyStatus(propertyId: string, status: 'approved' | 'rejected' | 'archived', reason?: string) {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: prop, error } = await supabase
      .from('properties')
      .update({
        status,
        rejection_reason: status === 'rejected' ? reason : null,
      })
      .eq('id', propertyId)
      .select('agent_id, title')
      .single();

    if (error) throw error;

    // Send notification to agent
    if (prop) {
      await supabase.from('notifications').insert({
        user_id: prop.agent_id,
        title: status === 'approved' ? 'Property Listing Approved' : status === 'rejected' ? 'Listing Rejection Notice' : 'Listing Archived',
        message: status === 'approved'
          ? `Your property "${prop.title}" has been approved and is now live on CampusNest.`
          : status === 'rejected'
          ? `Your property "${prop.title}" was not approved. Reason: ${reason || 'Does not meet listing standards.'}`
          : `Your property "${prop.title}" has been archived by administrator.`,
        type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
        link_url: '/agent/properties',
      });
    }

    // Audit Log
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `PROPERTY_STATUS_${status.toUpperCase()}`,
        entity_type: 'properties',
        entity_id: propertyId,
        details: { reason },
      });
    }

    return true;
  },

  // Get reports with optional status filter
  async getReports(statusFilter?: string) {
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles(id, full_name, email, role),
        property:properties(
          id, title, annual_rent, area, status,
          agent:profiles(id, full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Get reports join error, falling back:', error);
      let fbQuery = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter) {
        fbQuery = fbQuery.eq('status', statusFilter);
      }
      const { data: fallbackData } = await fbQuery;
      return (fallbackData || []) as Report[];
    }
    return data as Report[];
  },

  async getPendingReports() {
    return this.getReports('pending');
  },

  // Resolve / Dismiss Report
  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed' | 'under_review') {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId);

    if (error) throw error;

    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `REPORT_STATUS_${status.toUpperCase()}`,
        entity_type: 'reports',
        entity_id: reportId,
      });
    }

    return true;
  },

  async resolveReport(reportId: string, action: 'dismissed' | 'property_removed' | 'resolved') {
    return this.updateReportStatus(reportId, action === 'dismissed' ? 'dismissed' : 'resolved');
  },

  async getAllAgents() {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('getAllAgents query notice:', error.message);
        return [] as Profile[];
      }
      if (!profiles || profiles.length === 0) return [] as Profile[];

      const agentIds = profiles.map(p => p.id);

      const [{ data: agentProfiles }] = await Promise.all([
        supabase.from('agent_profiles').select('*').in('id', agentIds).then(r => r, () => ({ data: [] })),
      ]);

      const apMap = new Map((agentProfiles || []).map(ap => [ap.id, ap]));

      return profiles.map(p => ({
        ...p,
        agent_profile: apMap.get(p.id) || null,
      })) as Profile[];
    } catch (err) {
      console.warn('getAllAgents error fallback:', err);
      return [] as Profile[];
    }
  },

  // Get all registered users (Students, Agents, and Admins) with resilient fallback
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          student_profile:student_profiles(*),
          agent_profile:agent_profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as any[];
      }
    } catch (err) {
      console.warn('Primary getUsers join query notice:', err);
    }

    try {
      // Robust fallback: fetch profiles and merge associated profiles in JS
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.id);
      const [{ data: sProfiles }, { data: aProfiles }] = await Promise.all([
        supabase.from('student_profiles').select('*').in('id', userIds).then(r => r, () => ({ data: [] })),
        supabase.from('agent_profiles').select('*').in('id', userIds).then(r => r, () => ({ data: [] })),
      ]);

      const spMap = new Map((sProfiles || []).map(sp => [sp.id, sp]));
      const apMap = new Map((aProfiles || []).map(ap => [ap.id, ap]));

      return profiles.map(p => ({
        ...p,
        student_profile: spMap.get(p.id) || null,
        agent_profile: apMap.get(p.id) || null,
      }));
    } catch (fallbackErr) {
      console.error('Error fetching users in fallback:', fallbackErr);
      throw fallbackErr;
    }
  },

  // Fetch full details for any registered user (student, agent, or admin)
  async getUserDetails(userId: string) {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (pErr) throw pErr;

    let studentProfile = null;
    let agentProfile = null;
    let propertiesCount = 0;
    let inquiries: any[] = [];
    let savedProperties: any[] = [];
    let agentProperties: any[] = [];

    if (profile.role === 'student') {
      const [{ data: sp }, { data: inqData }, { data: savedData }] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('inquiries')
          .select(`
            id, type, created_at,
            property:properties(
              id, title, annual_rent, property_type, area, address, cover_image_url, status,
              agent:profiles(id, full_name, phone_number, email)
            )
          `)
          .eq('student_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('saved_properties')
          .select(`
            id, created_at,
            property:properties(
              id, title, annual_rent, property_type, area, address, cover_image_url, status
            )
          `)
          .eq('student_id', userId)
          .order('created_at', { ascending: false }),
      ]);
      studentProfile = sp;
      inquiries = inqData || [];
      savedProperties = savedData || [];
    } else if (profile.role === 'agent') {
      const [{ data: ap }, { count: pCount }, { data: props }] = await Promise.all([
        supabase.from('agent_profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', userId),
        supabase
          .from('properties')
          .select('id, title, annual_rent, property_type, area, status, views_count, created_at, cover_image_url')
          .eq('agent_id', userId)
          .order('created_at', { ascending: false }),
      ]);
      agentProfile = ap;
      propertiesCount = pCount || 0;
      agentProperties = props || [];
    }

    return {
      profile,
      studentProfile,
      agentProfile,
      propertiesCount,
      inquiries,
      savedProperties,
      agentProperties,
    };
  },

  // Suspend Agent / User
  async suspendAgent(agentId: string) {
    // Attempt updating both is_suspended and is_active
    let { error } = await supabase
      .from('profiles')
      .update({ is_suspended: true, is_active: false })
      .eq('id', agentId);

    // If 'is_suspended' column does not exist in schema cache, fall back to updating is_active: false
    if (error && (error.message?.includes('is_suspended') || (error as any).code === 'PGRST204')) {
      console.warn('is_suspended column missing in profiles table, falling back to is_active: false');
      const fallbackRes = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', agentId);
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Error suspending agent in profiles table:', error);
      throw error;
    }

    // Bust in-memory query caches immediately so public listings update
    propertyService.clearCache();

    // Audit Log attempt (non-blocking)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert([
          {
            actor_id: user.id,
            user_id: user.id,
            action: 'AGENT_SUSPENDED',
            entity_type: 'profiles',
            entity_id: agentId,
            details: { is_active: false },
          }
        ]);
      }
    } catch (auditErr) {
      console.warn('Non-blocking audit log notice on suspend:', auditErr);
    }

    return true;
  },

  // Reactivate Agent / User
  async reactivateAgent(agentId: string) {
    let { error } = await supabase
      .from('profiles')
      .update({ is_suspended: false, is_active: true })
      .eq('id', agentId);

    // If 'is_suspended' column does not exist in schema cache, fall back to updating is_active: true
    if (error && (error.message?.includes('is_suspended') || (error as any).code === 'PGRST204')) {
      console.warn('is_suspended column missing in profiles table, falling back to is_active: true');
      const fallbackRes = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', agentId);
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Error reactivating agent in profiles table:', error);
      throw error;
    }

    // Bust in-memory query caches immediately so public listings reappear
    propertyService.clearCache();

    // Audit Log attempt (non-blocking)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('audit_logs').insert([
          {
            actor_id: user.id,
            user_id: user.id,
            action: 'AGENT_REACTIVATED',
            entity_type: 'profiles',
            entity_id: agentId,
            details: { is_active: true },
          }
        ]);
      }
    } catch (auditErr) {
      console.warn('Non-blocking audit log notice on reactivate:', auditErr);
    }

    return true;
  },

  // Suspend or Reactivate user account (synchronizes is_suspended and is_active)
  async toggleUserActiveStatus(userId: string, isActive: boolean) {
    if (!isActive) {
      return this.suspendAgent(userId);
    } else {
      return this.reactivateAgent(userId);
    }
  },

  // Get audit logs
  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles(id, full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data as AuditLog[];
  },
};
