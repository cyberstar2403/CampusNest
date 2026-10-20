import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { propertyService } from '../../services/propertyService';
import { Property } from '../../types';
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  ExternalLink, 
  RefreshCw,
  MapPin,
  Tag,
  ShieldCheck,
  User,
  X,
  Phone,
  MessageCircle,
  ChevronRight
} from 'lucide-react';

interface AdminPropertyManagementProps {
  onBack?: () => void;
  onSelectProperty?: (id: string) => void;
}

export const AdminPropertyManagement: React.FC<AdminPropertyManagementProps> = ({
  onBack,
  onSelectProperty,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'archived'>('all');
  
  // Selected property for inspection modal
  const [inspectProperty, setInspectProperty] = useState<Property | null>(null);

  // In-app Action Confirmation Modal (replaces browser window.confirm / prompt)
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'delete';
    property: Property;
    reason?: string;
    loading?: boolean;
  } | null>(null);

  // In-app Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllPropertiesForAdmin();
      setProperties(data || []);
    } catch (err: any) {
      console.error('Error loading properties for admin:', err);
      setToast({
        message: 'Failed to load properties: ' + (err.message || 'Unknown database error'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    const { type, property, reason } = actionModal;

    try {
      setActionModal(prev => prev ? { ...prev, loading: true } : null);

      if (type === 'approve') {
        await adminService.updatePropertyStatus(property.id, 'approved');
        setToast({
          message: `Property "${property.title}" has been approved and is now active for FUW students.`,
          type: 'success',
        });
      } else if (type === 'reject') {
        await adminService.updatePropertyStatus(property.id, 'rejected', reason || 'Listing does not satisfy quality or verification criteria.');
        setToast({
          message: `Property "${property.title}" was rejected and hidden from public search.`,
          type: 'success',
        });
      } else if (type === 'delete') {
        await propertyService.deleteProperty(property.id);
        setToast({
          message: `Property "${property.title}" was permanently removed from CampusNest.`,
          type: 'success',
        });
      }

      setActionModal(null);
      if (inspectProperty?.id === property.id) {
        setInspectProperty(null);
      }
      await loadProperties();
    } catch (err: any) {
      console.error(`Error executing ${type} action on property:`, err);
      setToast({
        message: `Action failed: ` + (err.message || 'Database error occurred'),
        type: 'error',
      });
      setActionModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (statusFilter !== 'all' && (p.status || 'approved') !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = p.title?.toLowerCase() || '';
      const area = p.area?.toLowerCase() || '';
      const address = p.address?.toLowerCase() || '';
      const agentName = p.agent?.full_name?.toLowerCase() || '';
      const type = p.property_type?.toLowerCase() || '';
      return title.includes(q) || area.includes(q) || address.includes(q) || agentName.includes(q) || type.includes(q);
    }
    return true;
  });

  const countByStatus = {
    all: properties.length,
    approved: properties.filter(p => (p.status || 'approved') === 'approved').length,
    pending: properties.filter(p => p.status === 'pending').length,
    rejected: properties.filter(p => p.status === 'rejected').length,
    archived: properties.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-4 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Property Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review, moderate, approve, and manage all student accommodation listings across FUW Wukari campus zones.
          </p>
        </div>

        <button
          onClick={loadProperties}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Listings
        </button>
      </div>

      {/* Status Filter Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === 'all'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Listings ({countByStatus.all})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Approvals ({countByStatus.pending})
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved ({countByStatus.approved})
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusFilter === 'rejected'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Rejected ({countByStatus.rejected})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, location, FUW area, property type, or agent name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Property Listings Table / Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No properties found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery 
              ? `No accommodation listings match "${searchQuery}". Try different keywords.` 
              : 'No property listings found for the selected status filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-3.5">Property</th>
                  <th className="p-3.5">Rent / Year</th>
                  <th className="p-3.5">Area & Location</th>
                  <th className="p-3.5">Assigned Agent</th>
                  <th className="p-3.5">Listing Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProperties.map((p) => {
                  const status = p.status || 'approved';
                  const cover = p.cover_image_url || (p.images && p.images[0]?.image_url);

                  return (
                    <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                      
                      {/* Property Title & Image */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            {cover ? (
                              <img src={cover} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Building2 className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 max-w-xs truncate" title={p.title}>
                              {p.title}
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
                                {p.property_type || 'Self-Contain'}
                              </span>
                              <span>&bull;</span>
                              <span>{p.bedrooms || 1} Bed &bull; {p.bathrooms || 1} Bath</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Annual Rent */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-gray-900">
                          ₦{Number(p.annual_rent || 0).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400">per annum</span>
                      </td>

                      {/* Area & Location */}
                      <td className="p-3.5 text-gray-600">
                        <div className="font-semibold text-gray-800">{p.area || 'FUW Off-Campus'}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[180px]" title={p.address}>
                          {p.address || 'Wukari, Taraba State'}
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="p-3.5 whitespace-nowrap">
                        {p.agent ? (
                          <div>
                            <div className="font-semibold text-gray-900">{p.agent.full_name}</div>
                            <div className="text-[10px] text-gray-500">{p.agent.phone_number || p.agent.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned Agent</span>
                        )}
                      </td>

                      {/* Listing Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] rounded-lg" title={p.rejection_reason || 'Rejected'}>
                            <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
                          </span>
                        )}
                        {status === 'archived' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-[11px] rounded-lg">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="p-3.5 text-[11px] text-gray-500 whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions Column */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Inspect Modal Trigger */}
                          <button
                            onClick={() => setInspectProperty(p)}
                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                            title="Inspect full listing specifications"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>

                          {/* Quick Approve button if pending or rejected */}
                          {status !== 'approved' && (
                            <button
                              onClick={() => setActionModal({ open: true, type: 'approve', property: p })}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Approve property for public discovery"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {/* Quick Reject / Moderate button if approved */}
                          {status === 'approved' && (
                            <button
                              onClick={() => setActionModal({ open: true, type: 'reject', property: p, reason: '' })}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Flag / Reject listing"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}

                          {/* Delete permanently */}
                          <button
                            onClick={() => setActionModal({ open: true, type: 'delete', property: p })}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Permanently remove listing from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED PROPERTY INSPECTION MODAL */}
      {/* ========================================================================= */}
      {inspectProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Listing Administrative Inspection</h3>
                  <p className="text-xs text-gray-400">ID: {inspectProperty.id}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectProperty(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="px-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              
              {/* Cover Image & Quick Details */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 h-36 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                  {inspectProperty.cover_image_url || (inspectProperty.images && inspectProperty.images[0]?.image_url) ? (
                    <img 
                      src={inspectProperty.cover_image_url || inspectProperty.images?.[0]?.image_url} 
                      alt={inspectProperty.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                      {inspectProperty.property_type || 'Self-Contain'}
                    </span>
                    <span className="text-xs text-gray-400">&bull;</span>
                    <span className="font-extrabold text-base text-gray-900">
                      ₦{Number(inspectProperty.annual_rent || 0).toLocaleString()} / yr
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900 leading-snug">
                    {inspectProperty.title}
                  </h4>

                  <div className="text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{inspectProperty.address || inspectProperty.area || 'Wukari, Taraba State'}</span>
                  </div>

                  {inspectProperty.distance_from_campus && (
                    <div className="text-blue-700 font-medium">
                      Distance to FUW: {inspectProperty.distance_from_campus}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between bg-gray-50 border-gray-200">
                <div>
                  <span className="text-gray-500 font-semibold block">Listing Approval Standing:</span>
                  <span className="font-bold text-gray-900 capitalize text-sm">
                    {inspectProperty.status || 'approved'}
                  </span>
                  {inspectProperty.rejection_reason && (
                    <p className="text-red-600 mt-1">Rejection reason: {inspectProperty.rejection_reason}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-gray-400 block">Total Inquiries Logged:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {(inspectProperty.whatsapp_clicks_count || 0) + (inspectProperty.phone_clicks_count || 0)} inquiries
                  </span>
                </div>
              </div>

              {/* Description */}
              {inspectProperty.description && (
                <div className="space-y-1">
                  <span className="font-bold text-gray-900 block">Property Description:</span>
                  <p className="p-3 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                    {inspectProperty.description}
                  </p>
                </div>
              )}

              {/* Facilities & Amenities */}
              {inspectProperty.facilities && inspectProperty.facilities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-gray-900 block">Facilities Included:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectProperty.facilities.map((fac, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-[11px] font-semibold border border-blue-100">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Contact Box */}
              {inspectProperty.agent && (
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2">
                  <span className="font-bold text-purple-900 block text-xs">Listing Agent Details</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">Full Name:</span>
                      <span className="font-bold text-gray-900">{inspectProperty.agent.full_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Phone:</span>
                      <span className="font-bold text-gray-900">{inspectProperty.agent.phone_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Email:</span>
                      <span className="font-medium text-gray-700">{inspectProperty.agent.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                {inspectProperty.status !== 'approved' ? (
                  <button
                    onClick={() => {
                      setActionModal({ open: true, type: 'approve', property: inspectProperty });
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Listing
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActionModal({ open: true, type: 'reject', property: inspectProperty, reason: '' });
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject / Flag Listing
                  </button>
                )}

                <button
                  onClick={() => {
                    setActionModal({ open: true, type: 'delete', property: inspectProperty });
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Listing
                </button>
              </div>

              <button
                onClick={() => setInspectProperty(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP CONFIRMATION MODAL FOR APPROVE / REJECT / DELETE */}
      {/* ========================================================================= */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                actionModal.type === 'approve'
                  ? 'bg-emerald-50 text-emerald-600'
                  : actionModal.type === 'reject'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                {actionModal.type === 'approve' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : actionModal.type === 'reject' ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <Trash2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {actionModal.type === 'approve'
                    ? 'Approve Property Listing?'
                    : actionModal.type === 'reject'
                    ? 'Reject / Flag Property?'
                    : 'Delete Property Permanently?'}
                </h3>
                <p className="text-xs text-gray-500">
                  {actionModal.type === 'approve'
                    ? 'This listing will become immediately live to all students searching CampusNest.'
                    : actionModal.type === 'reject'
                    ? 'This listing will be hidden from public discovery.'
                    : 'This action cannot be undone. All listing photos and data will be removed.'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
              <span className="font-bold text-gray-900 block">{actionModal.property.title}</span>
              <span className="text-gray-500">{actionModal.property.area} &bull; ₦{Number(actionModal.property.annual_rent || 0).toLocaleString()} / yr</span>
            </div>

            {actionModal.type === 'reject' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Rejection / Moderation Reason:
                </label>
                <textarea
                  value={actionModal.reason || ''}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  placeholder="Specify why this listing was rejected (e.g. Inaccurate photos, unrealistic price, inappropriate content)..."
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={actionModal.loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionModal.loading}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionModal.type === 'reject'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionModal.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {actionModal.type === 'approve'
                      ? 'Confirm Approval'
                      : actionModal.type === 'reject'
                      ? 'Confirm Rejection'
                      : 'Delete Listing'}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
