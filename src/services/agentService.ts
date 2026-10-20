import { supabase } from '../lib/supabase';
import { AgentProfile, VerificationRequest } from '../types';

export interface VerificationSubmissionData {
  governmentIdUrl: string;
  nin: string;
  selfieUrl: string;
  agencyName?: string;
  officeAddress?: string;
}

export const agentService = {
  // Submit verification request
  async submitVerification(agentId: string, data: VerificationSubmissionData) {
    // 1. Update agent_profile record to 'pending' safely
    const updatePayload: any = {
      government_id_url: data.governmentIdUrl,
      nin: data.nin,
      selfie_url: data.selfieUrl,
      agency_name: data.agencyName || null,
      office_address: data.officeAddress || null,
      verification_status: 'pending',
      verification_rejection_reason: null,
      rejection_reason: null,
    };

    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      const { error: profileErr } = await supabase
        .from('agent_profiles')
        .update(updatePayload)
        .eq('id', agentId);

      if (!profileErr) break;

      const msg = profileErr.message || '';
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column "([^"]+)"/i);
      const m3 = msg.match(/column '([^']+)'/i);
      const missingCol = m1?.[1] || m2?.[1] || m3?.[1];

      if (missingCol && missingCol in updatePayload) {
        console.warn(`Column '${missingCol}' missing in agent_profiles during verification submit, stripping...`);
        delete updatePayload[missingCol];
      } else {
        console.error('Error updating agent_profiles for verification:', profileErr);
        throw profileErr;
      }
    }

    // 2. Insert into verification_requests table
    const { data: request, error: reqErr } = await supabase
      .from('verification_requests')
      .insert({
        agent_id: agentId,
        government_id_url: data.governmentIdUrl,
        nin: data.nin,
        selfie_url: data.selfieUrl,
        agency_name: data.agencyName || null,
        office_address: data.officeAddress || null,
        status: 'pending',
      })
      .select()
      .single();

    if (reqErr) throw reqErr;

    // 3. Notify Admins
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (admins && admins.length > 0) {
      const notifs = admins.map(a => ({
        user_id: a.id,
        title: 'New Verification Application',
        message: 'An accommodation agent has submitted verification documents for review.',
        type: 'new_application',
        link_url: '/admin/agents',
      }));
      await supabase.from('notifications').insert(notifs);
    }

    return request;
  },

  // Update Agent Profile details
  async updateAgentProfile(agentId: string, profileData: {
    fullName?: string;
    agencyName?: string;
    officeAddress?: string;
    bio?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  }) {
    // 1. Update profiles table (full_name, phone_number, avatar_url)
    if (
      profileData.fullName !== undefined ||
      profileData.phoneNumber !== undefined ||
      profileData.avatarUrl !== undefined
    ) {
      const profileUpdates: any = {};
      if (profileData.fullName !== undefined) profileUpdates.full_name = profileData.fullName.trim();
      if (profileData.phoneNumber !== undefined) profileUpdates.phone_number = profileData.phoneNumber.trim() || null;
      if (profileData.avatarUrl !== undefined) profileUpdates.avatar_url = profileData.avatarUrl || null;

      const { error: pErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', agentId);

      if (pErr) {
        console.error('Error updating profile phone/name:', pErr);
        throw pErr;
      }
    }

    // 2. Upsert agent_profiles table
    const { data, error } = await supabase
      .from('agent_profiles')
      .upsert({
        id: agentId,
        agency_name: profileData.agencyName ? profileData.agencyName.trim() : null,
        office_address: profileData.officeAddress ? profileData.officeAddress.trim() : null,
        bio: profileData.bio ? profileData.bio.trim() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating agent_profiles:', error);
      throw error;
    }

    return data;
  },

  // Get Agent Properties
  async getAgentProperties(agentId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*, images:property_images(*)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get Agent Stats
  async getAgentStats(agentId: string) {
    const analytics = await this.getAgentAnalytics(agentId);
    return {
      totalListings: analytics.totalProperties,
      activeListings: analytics.activeProperties,
      totalViews: analytics.totalViews,
      totalInquiries: analytics.totalInquiries,
    };
  },

  // Get Agent Analytics
  async getAgentAnalytics(agentId: string) {
    const { data: props, error } = await supabase
      .from('properties')
      .select('id, title, status, availability, views_count, whatsapp_clicks_count, phone_clicks_count, saves_count, is_active')
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error in getAgentAnalytics:', error);
      throw error;
    }

    const properties = props || [];
    const totalProperties = properties.length;
    
    // Active property listings: properties that are active, not rented, and approved or pending (not rejected)
    const activeProperties = properties.filter(p => 
      p.is_active !== false && 
      p.availability !== 'rented' && 
      p.status !== 'rejected'
    ).length;

    const availableProperties = properties.filter(p => (p.availability === 'available' || !p.availability) && (p.status === 'approved' || !p.status)).length;
    const rentedProperties = properties.filter(p => p.availability === 'rented').length;
    const pendingApproval = properties.filter(p => p.status === 'pending').length;

    const totalViews = properties.reduce((acc, p) => acc + (Number(p.views_count) || 0), 0);
    const totalWhatsAppClicks = properties.reduce((acc, p) => acc + (Number(p.whatsapp_clicks_count) || 0), 0);
    const totalPhoneClicks = properties.reduce((acc, p) => acc + (Number(p.phone_clicks_count) || 0), 0);
    const totalSaves = properties.reduce((acc, p) => acc + (Number(p.saves_count) || 0), 0);
    const totalInquiries = totalWhatsAppClicks + totalPhoneClicks;

    return {
      totalProperties,
      activeProperties,
      availableProperties,
      rentedProperties,
      pendingApproval,
      totalViews,
      totalWhatsAppClicks,
      totalPhoneClicks,
      totalSaves,
      totalInquiries,
      properties,
    };
  },
};
