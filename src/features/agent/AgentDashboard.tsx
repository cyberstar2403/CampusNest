import React, { useEffect, useState } from 'react';
import { Property } from '../../types';
import { agentService } from '../../services/agentService';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';
import { AgentVerificationModal } from '../../components/AgentVerificationModal';
import { OptimizedImage } from '../../components/OptimizedImage';
import { 
  Building2, 
  Plus, 
  Eye, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  TrendingUp,
  AlertCircle,
  FileCheck,
  Phone,
  User,
  MapPin,
  Save,
  X
} from 'lucide-react';

interface AgentDashboardProps {
  onNavigateCreate: () => void;
  onNavigateEdit: (propertyId: string) => void;
  onSelectProperty: (propertyId: string) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  onNavigateCreate,
  onNavigateEdit,
  onSelectProperty,
}) => {
  const { user, profile, agentProfile, refreshProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState({ totalListings: 0, totalViews: 0, totalInquiries: 0 });
  const [loading, setLoading] = useState(true);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile & Contact Phone editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formPhone, setFormPhone] = useState(profile?.phone_number || '');
  const [formFullName, setFormFullName] = useState(profile?.full_name || '');
  const [formAgencyName, setFormAgencyName] = useState(agentProfile?.agency_name || profile?.agent_profile?.agency_name || '');
  const [formOfficeAddress, setFormOfficeAddress] = useState(agentProfile?.office_address || profile?.agent_profile?.office_address || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile || agentProfile) {
      setFormPhone(profile?.phone_number || '');
      setFormFullName(profile?.full_name || '');
      setFormAgencyName(agentProfile?.agency_name || profile?.agent_profile?.agency_name || '');
      setFormOfficeAddress(agentProfile?.office_address || profile?.agent_profile?.office_address || '');
    }
  }, [profile, agentProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formPhone.trim()) {
      alert('Please enter a valid contact phone number.');
      return;
    }

    try {
      setSavingProfile(true);
      setSaveSuccessMsg(null);

      await agentService.updateAgentProfile(user.id, {
        fullName: formFullName,
        phoneNumber: formPhone,
        agencyName: formAgencyName,
        officeAddress: formOfficeAddress,
      });

      await refreshProfile();
      setIsEditingProfile(false);
      setSaveSuccessMsg('Your contact phone number and profile were updated successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error updating agent profile:', err);
      alert('Failed to update profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const verificationStatus = agentProfile?.verification_status || profile?.agent_profile?.verification_status || 'unverified';
  const isSuspended = profile?.is_suspended === true || profile?.is_active === false;

  const loadAgentData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [propsData, statsData] = await Promise.all([
        agentService.getAgentProperties(user.id),
        agentService.getAgentStats(user.id),
      ]);
      setProperties(propsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading agent dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [user]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    try {
      setDeletingId(propertyId);
      await propertyService.deleteProperty(propertyId);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Failed to delete property listing');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (property: Property) => {
    const newStatus = property.availability === 'available' ? 'rented' : 'available';
    try {
      await propertyService.updateProperty(property.id, { availability: newStatus });
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, availability: newStatus } : p));
      if (user) {
        const newStats = await agentService.getAgentStats(user.id);
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Agent Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your FUW off-campus property listings, monitor inquiries, and track verification status.
          </p>
        </div>

        <button
          onClick={onNavigateCreate}
          disabled={isSuspended || verificationStatus !== 'verified'}
          title={
            isSuspended
              ? 'Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.'
              : verificationStatus !== 'verified'
              ? 'Account verification required before publishing property listings'
              : 'Add new property'
          }
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add New Accommodation
        </button>
      </div>

      {/* Account Suspension Banner */}
      {isSuspended && (
        <div className="bg-red-50 border-2 border-red-300 p-5 rounded-2xl flex items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-red-900 uppercase tracking-wide">
                  Agent Account Suspended
                </h3>
                <span className="px-2.5 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold rounded-md">
                  Suspended
                </span>
              </div>
              <p className="text-xs text-red-800 mt-1 font-semibold">
                Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.
              </p>
              <p className="text-[11px] text-red-600 mt-0.5">
                Your existing listings remain visible to you inside your dashboard for historical record, but public visibility is blocked from student search results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Status Banner */}
      {verificationStatus === 'verified' && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">Identity Verified Agent</h3>
              <p className="text-xs text-emerald-700">
                Your agent profile is verified by FUW accommodation moderation. Your listings feature the green verification shield.
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Verification Under Review</h3>
              <p className="text-xs text-amber-700">
                Your identity document submission is currently being reviewed by admin. You can create listings, but verification badge is pending.
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus === 'unverified' && (
        <div className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900">Get Verified as an Official FUW Agent</h3>
              <p className="text-xs text-blue-700">
                Upload your ID document (NIN / Driver's License / Voter's Card) to gain student trust and increase inquiries.
              </p>
            </div>
          </div>

          <button
            onClick={() => setVerificationModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 shadow-xs"
          >
            Submit ID Verification
          </button>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-700 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">Verification Request Rejected</h3>
              <p className="text-xs text-red-700">
                {agentProfile?.verification_rejection_reason || agentProfile?.rejection_reason || profile?.agent_profile?.verification_rejection_reason || (profile?.agent_profile as any)?.rejection_reason || 'Your submitted verification documents could not be verified. Please re-submit clear documents.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setVerificationModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
          >
            Re-submit ID
          </button>
        </div>
      )}

      {/* Agent Profile & Contact Phone Management */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" /> Agent Contact Phone & Business Profile
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Students will reach you at this contact number via WhatsApp and Direct Call when viewing your property listings.
            </p>
          </div>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Edit Contact & Profile
            </button>
          )}
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {saveSuccessMsg}
          </div>
        )}

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 08012345678 or +2348012345678"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Nigerian formats accepted: 08012345678 or +2348012345678.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name / Agent Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Agency / Brand Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formAgencyName}
                    onChange={(e) => setFormAgencyName(e.target.value)}
                    placeholder="e.g. Wukari Housing Agency"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Office / Business Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formOfficeAddress}
                    onChange={(e) => setFormOfficeAddress(e.target.value)}
                    placeholder="e.g. Near FUW Gate 2, Wukari"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {savingProfile ? 'Saving...' : 'Save Profile & Phone Number'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  if (profile) {
                    setFormPhone(profile.phone_number || '');
                    setFormFullName(profile.full_name || '');
                    setFormAgencyName(agentProfile?.agency_name || profile?.agent_profile?.agency_name || '');
                    setFormOfficeAddress(agentProfile?.office_address || profile?.agent_profile?.office_address || '');
                  }
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider block">Contact Phone Number</span>
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                {profile?.phone_number || (
                  <span className="text-amber-600 font-normal italic">No Phone Number Set</span>
                )}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider block">Agent Full Name</span>
              <span className="font-bold text-gray-900 text-sm">{profile?.full_name || 'N/A'}</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider block">Agency Name</span>
              <span className="font-bold text-gray-900 text-sm">{agentProfile?.agency_name || profile?.agent_profile?.agency_name || 'Independent Agent'}</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider block">Office Address</span>
              <span className="font-bold text-gray-900 text-sm">{agentProfile?.office_address || profile?.agent_profile?.office_address || 'Wukari, Taraba State'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Performance Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(stats as any).activeListings ?? stats.totalListings}</div>
            <div className="text-xs text-gray-500 font-medium">Active Property Listings</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
            <div className="text-xs text-gray-500 font-medium">Total Student Views</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalInquiries}</div>
            <div className="text-xs text-gray-500 font-medium">Direct WhatsApp/Call Leads</div>
          </div>
        </div>
      </div>

      {/* Property List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your Property Listings</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No Listings Uploaded Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start adding student self-contains, single rooms, or flats around FUW Wukari to get instant student inquiries.
            </p>
            <button
              onClick={onNavigateCreate}
              className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs"
            >
              Add First Listing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gray-300 transition-colors"
              >
                {/* Thumbnail & Basic Info */}
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onSelectProperty(prop.id)}>
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <OptimizedImage
                      src={prop.cover_image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=160&q=65'}
                      alt={prop.title}
                      width={160}
                      height={160}
                      quality={65}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-600">
                        ₦{Number(prop.annual_rent).toLocaleString()}/yr
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        prop.availability === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {prop.availability === 'available' ? 'Available' : 'Rented'}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        prop.status === 'approved' ? 'bg-blue-50 text-blue-700' : prop.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {(prop.status || 'APPROVED').toUpperCase()}
                      </span>
                      {isSuspended && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-700 border border-red-200">
                          Hidden from Public (Agent Suspended)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 hover:text-blue-600 line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {prop.area} • {prop.property_type} • {prop.views_count || 0} views
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleToggleAvailability(prop)}
                    disabled={isSuspended}
                    title={isSuspended ? 'Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.' : undefined}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Mark as {prop.availability === 'available' ? 'Rented' : 'Available'}
                  </button>

                  <button
                    onClick={() => onNavigateEdit(prop.id)}
                    disabled={isSuspended}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isSuspended ? 'Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.' : 'Edit listing'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteProperty(prop.id)}
                    disabled={isSuspended || deletingId === prop.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isSuspended ? 'Account suspended' : 'Delete listing'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Verification Modal */}
      <AgentVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onSuccess={() => {
          refreshProfile();
          loadAgentData();
        }}
      />

    </div>
  );
};
