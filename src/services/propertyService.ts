import { supabase } from '../lib/supabase';
import { Property, PropertyFilters, ReportReason, PropertyStatus, PropertyAvailability } from '../types';

// In-memory response cache for featured/landing queries
let propertiesCache: {
  key: string;
  timestamp: number;
  data: { properties: Property[]; totalCount: number; page: number; totalPages: number };
} | null = null;

let featuredCache: {
  timestamp: number;
  data: Property[];
} | null = null;

const CACHE_TTL_MS = 30000; // 30 seconds cache for listings

// Helper to safely inspect agent profile suspension status regardless of relation shape
function isAgentSuspended(agent: any): boolean {
  if (!agent) return false;
  const a = Array.isArray(agent) ? agent[0] : agent;
  return a?.is_suspended === true || a?.is_active === false;
}

export const propertyService = {
  // Clear in-memory caches when listings are created/modified
  clearCache() {
    propertiesCache = null;
    featuredCache = null;
  },

  // Dedicated lightweight query for homepage Featured Accommodations
  async getFeaturedProperties(limit = 6): Promise<Property[]> {
    if (featuredCache && (Date.now() - featuredCache.timestamp < CACHE_TTL_MS)) {
      return featuredCache.data;
    }

    try {
      // Lightweight query: no count: 'exact', no property_images gallery join
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id, agent_id, title, property_type, bedrooms, bathrooms, annual_rent, is_negotiable, area, distance_from_campus, cover_image_url, status, availability, created_at,
          agent:profiles!agent_id(
            id, full_name, avatar_url, role, is_active,
            agent_profile:agent_profiles(verification_status)
          )
        `)
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      if (error) {
        // Fallback query without joins if relation resolution encounters issues
        try {
          const { data: fallbackData } = await supabase
            .from('properties')
            .select('id, agent_id, title, property_type, bedrooms, bathrooms, annual_rent, is_negotiable, area, distance_from_campus, cover_image_url, status, availability, created_at')
            .eq('status', 'approved')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);

          const fallbackResult = (fallbackData || []) as unknown as Property[];
          if (fallbackResult.length > 0) {
            featuredCache = { timestamp: Date.now(), data: fallbackResult };
          }
          return fallbackResult;
        } catch {
          return featuredCache?.data || [];
        }
      }

      const rawList = (data || []) as unknown as Property[];
      // Filter out properties owned by suspended agents
      const result = rawList
        .filter(p => !isAgentSuspended(p.agent))
        .slice(0, limit);

      if (result.length > 0) {
        featuredCache = { timestamp: Date.now(), data: result };
      }
      return result;
    } catch {
      // Return cached data if available, otherwise return empty array
      return featuredCache?.data || [];
    }
  },

  // Search & filter properties
  async getProperties(filters: PropertyFilters = {}, page = 1, limit = 12) {
    const isDefaultLandingQuery = Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && filters.sortBy === 'newest');
    const cacheKey = `${JSON.stringify(filters)}_${page}_${limit}`;

    if (isDefaultLandingQuery && propertiesCache && (Date.now() - propertiesCache.timestamp < CACHE_TTL_MS) && propertiesCache.key === cacheKey) {
      return propertiesCache.data;
    }

    try {
      let query = supabase
        .from('properties')
        .select(`
          id, agent_id, title, description, property_type, bedrooms, bathrooms, annual_rent, monthly_rent, is_negotiable, additional_charges, address, area, distance_from_campus, facilities, cover_image_url, status, availability, views_count, saves_count, created_at,
          agent:profiles!agent_id(
            id, full_name, avatar_url, role, is_active,
            agent_profile:agent_profiles(verification_status)
          )
        `, { count: 'exact' });

      // Public users and students only see approved listings
      // Filter out non-approved unless custom override for agent/admin dashboards
      query = query.eq('status', 'approved').eq('is_active', true);

      // Apply Keyword search
      if (filters.keyword && filters.keyword.trim()) {
        const kw = `%${filters.keyword.trim()}%`;
        query = query.or(`title.ilike.${kw},description.ilike.${kw},address.ilike.${kw},area.ilike.${kw}`);
      }

      // Apply Area filter
      if (filters.area && filters.area !== 'all') {
        query = query.eq('area', filters.area);
      }

      // Property Type filter
      if (filters.propertyType && filters.propertyType !== 'all') {
        query = query.eq('property_type', filters.propertyType);
      }

      // Price range filters
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        query = query.gte('annual_rent', filters.minPrice);
      }
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        query = query.lte('annual_rent', filters.maxPrice);
      }

      // Distance from campus filter
      if (filters.distanceFromCampus && filters.distanceFromCampus !== 'all') {
        query = query.ilike('distance_from_campus', `%${filters.distanceFromCampus}%`);
      }

      // Availability filter
      if (filters.availability && filters.availability !== 'all' as any) {
        query = query.eq('availability', filters.availability);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'lowest_price':
          query = query.order('annual_rent', { ascending: true });
          break;
        case 'highest_price':
          query = query.order('annual_rent', { ascending: false });
          break;
        case 'most_viewed':
          query = query.order('views_count', { ascending: false });
          break;
        case 'closest':
          query = query.order('distance_from_campus', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) {
        console.warn('Property query with joins notice, executing fallback query:', error);
        const { data: fallbackData, count: fallbackCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact' })
          .eq('status', 'approved')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, to);

        return {
          properties: (fallbackData || []) as Property[],
          totalCount: fallbackCount || 0,
          page,
          totalPages: Math.ceil((fallbackCount || 0) / limit),
        };
      }

      const rawProperties = (data || []) as unknown as Property[];
      const activeProperties = rawProperties.filter(
        p => !isAgentSuspended(p.agent)
      );

      const result = {
        properties: activeProperties,
        totalCount: count ? Math.min(count, activeProperties.length) : activeProperties.length,
        page,
        totalPages: Math.max(1, Math.ceil(activeProperties.length / limit)),
      };

      if (isDefaultLandingQuery) {
        propertiesCache = {
          key: cacheKey,
          timestamp: Date.now(),
          data: result,
        };
      }

      return result;
    } catch (networkOrExecErr) {
      console.warn('Network or database notice in getProperties:', networkOrExecErr);
      if (propertiesCache) {
        return propertiesCache.data;
      }
      return { properties: [], totalCount: 0, page: 1, totalPages: 0 };
    }
  },

  // Get single property details by ID (agent contact details only queried for authenticated sessions)
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      const isAuthenticated = !!currentUser;

      // Safe fields: id, full_name, role, is_active (avoid hardcoding is_suspended which may be missing from schema cache)
      const agentProfileFields = isAuthenticated
        ? 'id, full_name, email, phone_number, avatar_url, role, is_active, agent_profile:agent_profiles(*)'
        : 'id, full_name, avatar_url, role, is_active, agent_profile:agent_profiles(*)';

      let { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          agent:profiles(${agentProfileFields}),
          images:property_images(*)
        `)
        .eq('id', id)
        .maybeSingle();

      // If join query failed or returned no data, execute resilient direct query fallback
      if (error || !data) {
        console.warn('Primary getPropertyById query notice, attempting resilient fallback:', error?.message);
        const { data: directProp, error: propErr } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (propErr || !directProp) {
          console.warn('Property not found in fallback query:', id, propErr?.message);
          return null;
        }

        // Fetch associated images and agent profile safely without strict join constraints
        const [{ data: images }, { data: agentProfile }, { data: agentDetails }] = await Promise.all([
          supabase.from('property_images').select('*').eq('property_id', id).order('created_at', { ascending: true }).then(r => r, () => ({ data: [] })),
          directProp.agent_id ? supabase.from('profiles').select('*').eq('id', directProp.agent_id).maybeSingle().then(r => r, () => ({ data: null })) : Promise.resolve({ data: null }),
          directProp.agent_id ? supabase.from('agent_profiles').select('*').eq('id', directProp.agent_id).maybeSingle().then(r => r, () => ({ data: null })) : Promise.resolve({ data: null }),
        ]);

        const fullAgent = agentProfile ? {
          ...agentProfile,
          agent_profile: agentDetails || null,
        } : null;

        data = {
          ...directProp,
          images: images || [],
          agent: fullAgent,
        } as unknown as Property;
      }

      // Check if owning agent is suspended
      const agentIsSuspended = isAgentSuspended(data.agent);
      if (agentIsSuspended) {
        const currentUserId = currentUser?.id;
        const isOwner = currentUserId && currentUserId === data.agent_id;
        let isAdmin = false;
        if (currentUserId) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUserId)
            .maybeSingle();
          isAdmin = prof?.role === 'admin';
        }
        // Public viewers, students, or other agents cannot view suspended agent's property details
        if (!isOwner && !isAdmin) {
          return null;
        }
      }

      return data as Property;
    } catch (err) {
      console.warn('Notice in getPropertyById:', err);
      return null;
    }
  },

  // Fetch agent contact details securely only for authenticated users
  async getAgentContact(agentId: string): Promise<{ phone_number?: string | null; email?: string | null } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_number, email')
        .eq('id', agentId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  // Increment view count
  async incrementViewCount(propertyId: string) {
    if (!propertyId) return;
    try {
      // 1. Try RPC increment_property_views (bypasses RLS)
      const { error: rpcErr } = await supabase.rpc('increment_property_views', { prop_id: propertyId });
      if (rpcErr) {
        // Fallback to direct update if RPC is missing or fails
        const { data: prop } = await supabase.from('properties').select('views_count').eq('id', propertyId).maybeSingle();
        if (prop) {
          await supabase.from('properties').update({ views_count: (prop.views_count || 0) + 1 }).eq('id', propertyId);
        }
      }
    } catch (e) {
      console.error('Error updating view count:', e);
    }
  },

  // Record contact inquiry (WhatsApp / Phone click - authenticated users only)
  async recordInquiry(propertyId: string, agentId: string, type: 'whatsapp' | 'phone') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      const studentId = user.id;

      // 1. Try RPC record_property_inquiry
      const { error: rpcErr } = await supabase.rpc('record_property_inquiry', {
        p_property_id: propertyId,
        p_agent_id: agentId,
        p_student_id: studentId,
        p_type: type
      });

      if (rpcErr) {
        // Fallback to direct table operations
        await supabase.from('inquiries').insert({
          property_id: propertyId,
          agent_id: agentId,
          student_id: studentId,
          type,
        });

        const col = type === 'whatsapp' ? 'whatsapp_clicks_count' : 'phone_clicks_count';
        const { data: prop } = await supabase.from('properties').select(col).eq('id', propertyId).maybeSingle();
        if (prop) {
          const current = (prop as any)[col] || 0;
          await supabase.from('properties').update({ [col]: current + 1 }).eq('id', propertyId);
        }
      }
    } catch (e) {
      console.error('Error recording inquiry:', e);
    }
  },

  // Check if student saved property
  async isPropertySaved(studentId: string, propertyId: string): Promise<boolean> {
    if (!studentId || !propertyId) return false;
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('student_id', studentId)
        .eq('property_id', propertyId)
        .maybeSingle();
      if (error) {
        return false;
      }
      return !!data;
    } catch {
      return false;
    }
  },

  // Toggle Save Property
  async toggleSaveProperty(studentId: string, propertyId: string): Promise<boolean> {
    if (!studentId || !propertyId) throw new Error('Student ID and Property ID are required');
    try {
      const isSaved = await this.isPropertySaved(studentId, propertyId);
      if (isSaved) {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('student_id', studentId)
          .eq('property_id', propertyId);

        if (error) {
          console.warn('Notice removing saved property row:', error.message);
          throw error;
        }

        // Try decrementing saves_count on property (ignore RLS error if non-owner)
        try {
          const { data: prop } = await supabase.from('properties').select('saves_count').eq('id', propertyId).maybeSingle();
          if (prop && (prop.saves_count || 0) > 0) {
            await supabase.from('properties').update({ saves_count: prop.saves_count - 1 }).eq('id', propertyId);
          }
        } catch {
          // Silently catch if RLS blocks direct property update
        }
        return false; // Now unsaved
      } else {
        const { error } = await supabase
          .from('saved_properties')
          .insert({ student_id: studentId, property_id: propertyId });

        if (error) {
          console.warn('Notice inserting saved property row:', error.message);
          throw error;
        }

        // Try incrementing saves_count on property (ignore RLS error if non-owner)
        try {
          const { data: prop } = await supabase.from('properties').select('saves_count').eq('id', propertyId).maybeSingle();
          if (prop) {
            await supabase.from('properties').update({ saves_count: (prop.saves_count || 0) + 1 }).eq('id', propertyId);
          }
        } catch {
          // Silently catch if RLS blocks direct property update
        }
        return true; // Now saved
      }
    } catch (err) {
      console.warn('Notice in toggleSaveProperty:', err);
      throw err;
    }
  },

  // Get saved properties for a student with fallback query and resilient error handling
  async getStudentSavedProperties(studentId: string): Promise<Property[]> {
    if (!studentId) return [];

    let rawData: any[] | null = null;

    // 1. Attempt primary relational query
    try {
      const { data, error } = await supabase
        .from('saved_properties')
        .select(`
          id,
          property_id,
          created_at,
          property:properties(
            id, agent_id, title, description, property_type, bedrooms, bathrooms, annual_rent, monthly_rent, is_negotiable, additional_charges, address, area, distance_from_campus, facilities, cover_image_url, status, availability, views_count, saves_count, created_at,
            agent:profiles!agent_id(
              id, full_name, email, phone_number, avatar_url, role,
              agent_profile:agent_profiles(verification_status)
            ),
            images:property_images(id, property_id, image_url, display_order)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        rawData = data;
      } else if (error) {
        console.warn('Primary saved properties join query notice:', error.message);
      }
    } catch (err) {
      console.warn('Primary saved properties query error:', err);
    }

    // 2. Secondary fallback query if join resolution fails or relation syntax errors
    if (!rawData) {
      try {
        const { data: savedRows, error: savedErr } = await supabase
          .from('saved_properties')
          .select('id, property_id, created_at')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (!savedErr && savedRows && savedRows.length > 0) {
          const propIds = savedRows.map(r => r.property_id).filter(Boolean);
          if (propIds.length > 0) {
            const { data: propData, error: propErr } = await supabase
              .from('properties')
              .select(`
                id, agent_id, title, description, property_type, bedrooms, bathrooms, annual_rent, monthly_rent, is_negotiable, additional_charges, address, area, distance_from_campus, facilities, cover_image_url, status, availability, views_count, saves_count, created_at,
                agent:profiles!agent_id(
                  id, full_name, email, phone_number, avatar_url, role,
                  agent_profile:agent_profiles(verification_status)
                ),
                images:property_images(id, property_id, image_url, display_order)
              `)
              .in('id', propIds);

            if (!propErr && propData) {
              const propMap = new Map(propData.map((p: any) => [p.id, p]));
              rawData = savedRows.map(r => ({
                id: r.id,
                created_at: r.created_at,
                property: propMap.get(r.property_id) || null
              })).filter(r => r.property !== null);
            }
          } else {
            rawData = [];
          }
        } else if (!savedErr) {
          rawData = [];
        }
      } catch (fallbackErr) {
        console.warn('Fallback saved properties resolution error:', fallbackErr);
      }
    }

    if (!rawData) return [];

    // Map the joined property object into a clean Property[] array
    const properties: Property[] = rawData
      .map((item: any) => {
        if (!item || !item.property) return null;
        return {
          ...item.property,
          saved_id: item.id,
        };
      })
      .filter((p): p is Property => p !== null);

    return properties;
  },

  // Student Report Listing
  async reportProperty(propertyId: string, reason: ReportReason, details?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to report a listing.');

    const { data, error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      property_id: propertyId,
      reason,
      details: details || null,
      status: 'pending',
    });

    if (error) throw error;

    // Send notification to admins
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (admins && admins.length > 0) {
      const notifs = admins.map(admin => ({
        user_id: admin.id,
        title: 'New Property Report',
        message: `A listing has been reported for: ${reason}`,
        type: 'new_report',
        link_url: `/admin/reports`,
      }));
      await supabase.from('notifications').insert(notifs);
    }

    return data;
  },

  // Create Property (Agents only)
  async createProperty(propertyData: any, imageUrlsParam?: string[]) {
    const agentId = propertyData.agent_id;

    if (agentId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .maybeSingle();

      if (prof?.is_suspended === true || prof?.is_active === false) {
        throw new Error('Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.');
      }

      const { data: ap } = await supabase
        .from('agent_profiles')
        .select('verification_status')
        .eq('id', agentId)
        .maybeSingle();

      const currentStatus = ap?.verification_status;
      if (currentStatus !== 'verified') {
        throw new Error('Account verification required before publishing property listing.');
      }
    }

    const imageUrls = imageUrlsParam || propertyData.images || [propertyData.cover_image_url].filter(Boolean);

    const insertPayload: Record<string, any> = {
      agent_id: agentId,
      title: propertyData.title,
      description: propertyData.description,
      property_type: propertyData.property_type,
      bedrooms: propertyData.bedrooms || 1,
      bathrooms: propertyData.bathrooms || 1,
      kitchen: propertyData.kitchen !== false,
      annual_rent: propertyData.annual_rent,
      monthly_rent: propertyData.monthly_rent || null,
      is_negotiable: propertyData.is_negotiable || false,
      additional_charges: propertyData.additional_charges || null,
      address: propertyData.address,
      area: propertyData.area,
      distance_from_campus: propertyData.distance_from_campus,
      facilities: propertyData.facilities || [],
      utilities: propertyData.utilities || [],
      cover_image_url: imageUrls[0] || propertyData.cover_image_url || null,
      status: 'approved', // Approved for prototype flexibility
      availability: propertyData.availability || 'available',
    };

    let currentPayload = { ...insertPayload };
    let newProp: any = null;
    let attempts = 0;
    const triedTypes: string[] = [insertPayload.property_type];

    while (attempts < 10) {
      attempts++;
      const { data, error } = await supabase
        .from('properties')
        .insert(currentPayload)
        .select()
        .single();

      if (!error) {
        newProp = data;
        break;
      }

      const msg = error.message || '';

      // Check if error is property_type check constraint failure
      if (msg.includes('properties_property_type_check') || (msg.includes('check constraint') && msg.includes('property_type'))) {
        const currentType = currentPayload.property_type;
        const fallbacksMap: Record<string, string[]> = {
          'Self-Contain': ['Self Contain', 'Studio', 'Flat', 'Single Room'],
          'Self Contain': ['Self-Contain', 'Studio', 'Flat', 'Single Room'],
          'Single Room': ['Single-Room', 'Room', 'Self-Contain'],
          '1 Bedroom Flat': ['1 Bedroom', '1-Bedroom', 'Flat', 'Self-Contain'],
          '2 Bedroom Flat': ['2 Bedroom', '2-Bedroom', 'Flat', 'Self-Contain'],
          'Studio': ['Self-Contain', 'Flat', 'Single Room']
        };
        const fallbacks = fallbacksMap[currentType] || ['Self Contain', 'Self-Contain', 'Studio', 'Flat'];
        const nextType = fallbacks.find(f => !triedTypes.includes(f));

        if (nextType) {
          console.warn(`Database property_type constraint mismatch for '${currentType}'. Retrying with '${nextType}'...`);
          triedTypes.push(nextType);
          currentPayload.property_type = nextType;
          continue;
        }
      }

      // Check if error is missing column in schema cache
      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column "([^"]+)"/i);
      const m3 = msg.match(/column '([^']+)'/i);
      const missingCol = m1?.[1] || m2?.[1] || m3?.[1];

      if (missingCol && missingCol in currentPayload) {
        console.warn(`Database missing column '${missingCol}', stripping '${missingCol}' and retrying property insert...`);
        delete currentPayload[missingCol];
      } else {
        console.error('Fatal property insert error:', error);
        throw error;
      }
    }

    if (!newProp) {
      throw new Error('Failed to insert property record into database.');
    }

    // 2. Insert property images
    if (imageUrls && imageUrls.length > 0 && newProp) {
      const imgRecords = imageUrls.map((url: string, idx: number) => ({
        property_id: newProp.id,
        image_url: url,
        display_order: idx,
      }));
      await supabase.from('property_images').insert(imgRecords);
    }

    this.clearCache();
    return newProp;
  },

  // Edit / Update Property
  async updateProperty(propertyId: string, propertyData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof?.role === 'agent' && (prof?.is_suspended === true || prof?.is_active === false)) {
        throw new Error('Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.');
      }
    }

    const updatePayload: Record<string, any> = {
      ...(propertyData.title ? { title: propertyData.title } : {}),
      ...(propertyData.description !== undefined ? { description: propertyData.description } : {}),
      ...(propertyData.property_type ? { property_type: propertyData.property_type } : {}),
      ...(propertyData.bedrooms !== undefined ? { bedrooms: propertyData.bedrooms } : {}),
      ...(propertyData.bathrooms !== undefined ? { bathrooms: propertyData.bathrooms } : {}),
      ...(propertyData.annual_rent !== undefined ? { annual_rent: propertyData.annual_rent } : {}),
      ...(propertyData.is_negotiable !== undefined ? { is_negotiable: propertyData.is_negotiable } : {}),
      ...(propertyData.additional_charges !== undefined ? { additional_charges: propertyData.additional_charges } : {}),
      ...(propertyData.address ? { address: propertyData.address } : {}),
      ...(propertyData.area ? { area: propertyData.area } : {}),
      ...(propertyData.distance_from_campus !== undefined ? { distance_from_campus: propertyData.distance_from_campus } : {}),
      ...(propertyData.facilities ? { facilities: propertyData.facilities } : {}),
      ...(propertyData.availability ? { availability: propertyData.availability } : {}),
      ...(propertyData.cover_image_url ? { cover_image_url: propertyData.cover_image_url } : {}),
    };

    let currentPayload = { ...updatePayload };
    let data: any = null;
    let attempts = 0;
    const triedTypes: string[] = updatePayload.property_type ? [updatePayload.property_type] : [];

    while (attempts < 10) {
      attempts++;
      const { data: updated, error } = await supabase
        .from('properties')
        .update(currentPayload)
        .eq('id', propertyId)
        .select()
        .single();

      if (!error) {
        data = updated;
        break;
      }

      const msg = error.message || '';

      // Check if error is property_type check constraint failure
      if (currentPayload.property_type && (msg.includes('properties_property_type_check') || (msg.includes('check constraint') && msg.includes('property_type')))) {
        const currentType = currentPayload.property_type;
        const fallbacksMap: Record<string, string[]> = {
          'Self-Contain': ['Self Contain', 'Studio', 'Flat', 'Single Room'],
          'Self Contain': ['Self-Contain', 'Studio', 'Flat', 'Single Room'],
          'Single Room': ['Single-Room', 'Room', 'Self-Contain'],
          '1 Bedroom Flat': ['1 Bedroom', '1-Bedroom', 'Flat', 'Self-Contain'],
          '2 Bedroom Flat': ['2 Bedroom', '2-Bedroom', 'Flat', 'Self-Contain'],
          'Studio': ['Self-Contain', 'Flat', 'Single Room']
        };
        const fallbacks = fallbacksMap[currentType] || ['Self Contain', 'Self-Contain', 'Studio', 'Flat'];
        const nextType = fallbacks.find(f => !triedTypes.includes(f));

        if (nextType) {
          console.warn(`Database property_type constraint mismatch for '${currentType}'. Retrying update with '${nextType}'...`);
          triedTypes.push(nextType);
          currentPayload.property_type = nextType;
          continue;
        }
      }

      const m1 = msg.match(/Could not find the '([^']+)' column/i);
      const m2 = msg.match(/column "([^"]+)"/i);
      const m3 = msg.match(/column '([^']+)'/i);
      const missingCol = m1?.[1] || m2?.[1] || m3?.[1];

      if (missingCol && missingCol in currentPayload) {
        console.warn(`Database missing column '${missingCol}', stripping '${missingCol}' and retrying property update...`);
        delete currentPayload[missingCol];
      } else {
        console.error('Fatal property update error:', error);
        throw error;
      }
    }

    if (propertyData.images && Array.isArray(propertyData.images) && propertyData.images.length > 0) {
      await supabase.from('property_images').delete().eq('property_id', propertyId);
      const imgRecords = propertyData.images.map((url: string, idx: number) => ({
        property_id: propertyId,
        image_url: url,
        display_order: idx,
      }));
      await supabase.from('property_images').insert(imgRecords);
    }

    this.clearCache();
    return data;
  },

  async editProperty(propertyId: string, agentId: string, propertyData: Partial<Property>, newImageUrls?: string[]) {
    return this.updateProperty(propertyId, { ...propertyData, images: newImageUrls });
  },

  // Delete / Archive Property
  async deleteProperty(propertyId: string, agentId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof?.role === 'agent' && (prof?.is_suspended === true || prof?.is_active === false)) {
        throw new Error('Your agent account has been suspended. You cannot perform property modifications.');
      }
    }

    let query = supabase.from('properties').delete().eq('id', propertyId);
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { error } = await query;
    if (error) throw error;
    this.clearCache();
    return true;
  },

  // Get Agent Properties
  async getAgentProperties(agentId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Property[];
  },
};
