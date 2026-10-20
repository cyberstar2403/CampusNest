export type UserRole = 'student' | 'agent' | 'admin';

export type PropertyType = 'Self-Contain' | 'Single Room' | '1 Bedroom Flat' | '2 Bedroom Flat' | 'Studio' | string;

export type PropertyArea = 'Back Gate' | 'Exit Gate' | 'New Site' | 'Town' | 'Sangere' | 'Hospital Road' | string;

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type PropertyStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export type PropertyAvailability = 'available' | 'rented' | 'maintenance';

export type ReportReason = 
  | 'Fake Property' 
  | 'Wrong Price' 
  | 'Already Rented' 
  | 'Scam Attempt' 
  | 'Duplicate Listing' 
  | 'Inappropriate Content' 
  | 'Other';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export type NotificationType = 
  | 'listing_approved' 
  | 'listing_rejected' 
  | 'verification_approved' 
  | 'verification_rejected' 
  | 'new_application' 
  | 'new_report' 
  | 'saved_property_update' 
  | 'general';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  is_suspended?: boolean;
  created_at: string;
  updated_at: string;
  agent_profile?: AgentProfile | null;
}

export interface StudentProfile {
  id: string;
  matric_number?: string | null;
  department?: string | null;
  level?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentProfile {
  id: string;
  agency_name?: string | null;
  office_address?: string | null;
  bio?: string | null;
  verification_status: VerificationStatus;
  verification_rejection_reason?: string | null;
  must_change_password: boolean;
  government_id_url?: string | null;
  nin?: string | null;
  selfie_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  agent_id: string;
  university_id?: string | null;
  title: string;
  description: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  annual_rent: number;
  monthly_rent?: number | null;
  is_negotiable: boolean;
  additional_charges?: string | null;
  address: string;
  area: string;
  distance_from_campus: string;
  latitude?: number | null;
  longitude?: number | null;
  facilities: string[];
  utilities: string[];
  cover_image_url?: string | null;
  status: PropertyStatus;
  rejection_reason?: string | null;
  availability: PropertyAvailability;
  views_count: number;
  whatsapp_clicks_count: number;
  phone_clicks_count: number;
  saves_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  agent?: (Profile & { agent_profile?: AgentProfile }) | null;
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path?: string | null;
  display_order: number;
  created_at: string;
}

export interface SavedProperty {
  id: string;
  student_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface Report {
  id: string;
  reporter_id: string;
  property_id: string;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  property?: Property;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  agent_id: string;
  government_id_url: string;
  nin: string;
  selfie_url: string;
  agency_name?: string | null;
  office_address?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  agent?: Profile & { agent_profile?: AgentProfile };
}

export type PropertyReport = Report;
export type AgentVerificationRequest = VerificationRequest;

export interface Inquiry {
  id: string;
  student_id?: string | null;
  property_id: string;
  agent_id: string;
  type: 'whatsapp' | 'phone';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
  user?: Profile;
}

export interface PropertyFilters {
  keyword?: string;
  area?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  distanceFromCampus?: string;
  availability?: PropertyAvailability;
  verifiedOnly?: boolean;
  sortBy?: 'newest' | 'lowest_price' | 'highest_price' | 'closest' | 'most_viewed';
}
