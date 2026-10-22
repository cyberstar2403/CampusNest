import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { AgentVerificationRequest, Profile, UserRole } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Search, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  User, 
  Phone,
  Building2,
  ChevronLeft,
  UserPlus,
  X,
  Eye,
  RefreshCw,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  ExternalLink,
  Users,
  GraduationCap,
  Shield,
  AlertTriangle,
  Check,
  Filter,
  Heart
} from 'lucide-react';

interface AdminAgentManagementProps {
  onBack: () => void;
  initialTab?: 'users' | 'agents';
}

export const AdminAgentManagement: React.FC<AdminAgentManagementProps> = ({ 
  onBack, 
  initialTab = 'users' 
}) => {
  // Navigation Tabs: 'users' (Every Registered User) vs 'agents' (Agents & KYC Verifications)
  const [activeTab, setActiveTab] = useState<'users' | 'agents'>(initialTab);

  // Data states
  const [agents, setAgents] = useState<Profile[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<AgentVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Agents Tab
  const [agentStatusFilter, setAgentStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending' | 'verified' | 'unverified'>('all');
  const [agentSearch, setAgentSearch] = useState('');

  // Filters for All Users Tab
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'agent' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userSearch, setUserSearch] = useState('');

  // Agent detail modal state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentDetails, setAgentDetails] = useState<{
    profile: Profile;
    agentProfile: any;
    verificationRequest: AgentVerificationRequest | null;
    allRequests: AgentVerificationRequest[];
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Generic User detail modal state (for All Users directory)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userBookingsData, setUserBookingsData] = useState<any | null>(null);

  // Custom In-App Confirmation Dialog State (replaces window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'suspend' | 'reactivate';
    targetUser: Profile;
    loading: boolean;
  } | null>(null);

  // Toast / Feedback message state (replaces window.alert)
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentsData, usersData, requestsData] = await Promise.all([
        adminService.getAllAgents().catch(() => []),
        adminService.getUsers().catch(() => []),
        adminService.getPendingVerificationRequests().catch(() => []),
      ]);
      setAgents(agentsData || []);
      setUsers(usersData || []);
      setRequests(requestsData || []);
    } catch (err) {
      console.warn('Notice loading admin management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update tab if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const openAgentDetails = async (agentId: string) => {
    try {
      setSelectedAgentId(agentId);
      setDetailsLoading(true);
      const details = await adminService.getAgentDetails(agentId);
      setAgentDetails(details);
    } catch (err) {
      console.error('Error loading agent details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openUserDetails = async (userToView: any) => {
    try {
      setSelectedUserForDetails(userToView);
      setUserDetailsLoading(true);
      setUserBookingsData(null);
      const details = await adminService.getUserDetails(userToView.id);
      setUserBookingsData(details);
    } catch (err) {
      console.warn('Error fetching full user booking details:', err);
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleApprove = async (requestId: string, agentId: string) => {
    try {
      await adminService.approveAgentVerification(requestId, agentId);
      setToastMessage({
        text: 'Agent verification approved successfully! Agent can now publish accommodations.',
        type: 'success',
      });
      await loadData();
      if (selectedAgentId === agentId) {
        await openAgentDetails(agentId);
      }
    } catch (err: any) {
      console.error('Error approving agent:', err);
      setToastMessage({
        text: 'Failed to approve agent: ' + (err.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  const handleReject = async (requestId: string, agentId: string) => {
    const reason = window.prompt('Provide rejection reason for agent:');
    if (reason === null) return;
    try {
      await adminService.rejectAgentVerification(requestId, agentId, reason);
      setToastMessage({
        text: 'Agent verification rejected.',
        type: 'success',
      });
      await loadData();
      if (selectedAgentId === agentId) {
        await openAgentDetails(agentId);
      }
    } catch (err: any) {
      console.error('Error rejecting agent:', err);
      setToastMessage({
        text: 'Failed to reject agent: ' + (err.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  // Open confirmation modal for Suspend action
  const requestSuspendUser = (userToSuspend: Profile) => {
    setConfirmModal({
      open: true,
      type: 'suspend',
      targetUser: userToSuspend,
      loading: false,
    });
  };

  // Open confirmation modal for Reactivate action
  const requestReactivateUser = (userToReactivate: Profile) => {
    setConfirmModal({
      open: true,
      type: 'reactivate',
      targetUser: userToReactivate,
      loading: false,
    });
  };

  // Execute the confirmed Suspend or Reactivate action
  const executeConfirmationAction = async () => {
    if (!confirmModal || !confirmModal.targetUser) return;
    const { type, targetUser } = confirmModal;

    try {
      setConfirmModal(prev => prev ? { ...prev, loading: true } : null);

      if (type === 'suspend') {
        await adminService.suspendAgent(targetUser.id);
        
        // Optimistically update lists immediately
        setAgents(prev => prev.map(a => a.id === targetUser.id ? { ...a, is_suspended: true, is_active: false } : a));
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_suspended: true, is_active: false } : u));
        
        if (selectedAgentId === targetUser.id && agentDetails) {
          setAgentDetails({
            ...agentDetails,
            profile: { ...agentDetails.profile, is_suspended: true, is_active: false }
          });
        }
        if (selectedUserForDetails && selectedUserForDetails.id === targetUser.id) {
          setSelectedUserForDetails({ ...selectedUserForDetails, is_suspended: true, is_active: false });
        }

        setToastMessage({
          text: `Account for "${targetUser.full_name}" has been suspended. Listings are hidden from public search.`,
          type: 'success',
        });
      } else {
        await adminService.reactivateAgent(targetUser.id);

        // Optimistically update lists immediately
        setAgents(prev => prev.map(a => a.id === targetUser.id ? { ...a, is_suspended: false, is_active: true } : a));
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_suspended: false, is_active: true } : u));
        
        if (selectedAgentId === targetUser.id && agentDetails) {
          setAgentDetails({
            ...agentDetails,
            profile: { ...agentDetails.profile, is_suspended: false, is_active: true }
          });
        }
        if (selectedUserForDetails && selectedUserForDetails.id === targetUser.id) {
          setSelectedUserForDetails({ ...selectedUserForDetails, is_suspended: false, is_active: true });
        }

        setToastMessage({
          text: `Account for "${targetUser.full_name}" has been reactivated. Eligible listings are restored to public search.`,
          type: 'success',
        });
      }

      // Close modal and fetch clean server state
      setConfirmModal(null);
      await loadData();
      if (selectedAgentId === targetUser.id) {
        await openAgentDetails(targetUser.id);
      }
    } catch (err: any) {
      console.error(`Error during ${type} user:`, err);
      setToastMessage({
        text: `Failed to ${type} account: ` + (err.message || 'Unknown database error'),
        type: 'error',
      });
      setConfirmModal(null);
    }
  };

  // Agent Creation state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newTempPassword, setNewTempPassword] = useState('AgentPass123!');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAgency, setNewAgency] = useState('');
  const [newOffice, setNewOffice] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newTempPassword || !newFullName || !newPhone) {
      setCreateError('Please fill in all required fields.');
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError(null);
      await authService.adminCreateAgent({
        email: newEmail,
        temporaryPassword: newTempPassword,
        fullName: newFullName,
        phoneNumber: newPhone,
        agencyName: newAgency,
        officeAddress: newOffice,
      });
      setCreatedCredentials({ email: newEmail, pass: newTempPassword });
      setNewEmail('');
      setNewFullName('');
      setNewPhone('');
      setNewAgency('');
      setNewOffice('');
      await loadData();
    } catch (err: any) {
      console.error('Error creating agent:', err);
      setCreateError(err.message || 'Failed to create agent account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtered Agents for Agents Tab
  const filteredAgents = agents.filter(agent => {
    const isSuspended = agent.is_suspended === true || agent.is_active === false;
    if (agentStatusFilter === 'active' && isSuspended) return false;
    if (agentStatusFilter === 'suspended' && !isSuspended) return false;
    const status = agent.agent_profile?.verification_status || 'unverified';
    if (['pending', 'verified', 'unverified'].includes(agentStatusFilter) && status !== agentStatusFilter) return false;
    
    if (agentSearch.trim()) {
      const q = agentSearch.toLowerCase();
      const name = agent.full_name?.toLowerCase() || '';
      const phone = agent.phone_number?.toLowerCase() || '';
      const email = agent.email?.toLowerCase() || '';
      const agency = agent.agent_profile?.agency_name?.toLowerCase() || '';
      return name.includes(q) || phone.includes(q) || email.includes(q) || agency.includes(q);
    }
    return true;
  });

  // Filtered Users for All Registered Users Tab
  const filteredUsers = users.filter(u => {
    // Role filter
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;

    // Status filter
    const isSuspended = u.is_suspended === true || u.is_active === false;
    if (userStatusFilter === 'active' && isSuspended) return false;
    if (userStatusFilter === 'suspended' && !isSuspended) return false;

    // Search query
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const name = u.full_name?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const phone = u.phone_number?.toLowerCase() || '';
      const matric = u.student_profile?.matric_number?.toLowerCase() || '';
      const dept = u.student_profile?.department?.toLowerCase() || '';
      const agency = u.agent_profile?.agency_name?.toLowerCase() || '';
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        matric.includes(q) ||
        dept.includes(q) ||
        agency.includes(q)
      );
    }
    return true;
  });

  // User counts calculations
  const totalStudentsCount = users.filter(u => u.role === 'student').length;
  const totalAgentsCount = users.filter(u => u.role === 'agent').length;
  const totalAdminsCount = users.filter(u => u.role === 'admin').length;
  const totalSuspendedUsersCount = users.filter(u => u.is_suspended === true || u.is_active === false).length;
  const suspendedAgentsCount = agents.filter(a => a.is_suspended === true || a.is_active === false).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Feedback Notification Banner */}
      {toastMessage && (
        <div 
          className={`fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <p className="text-xs font-bold flex-1">{toastMessage.text}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Moderation Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            User Directory & Agent Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage every registered campus user, moderate agents, inspect KYC verification documents, and control account suspension.
          </p>
        </div>

        {/* Action button: provision agent */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Provision Agent Account
          </button>
        </div>
      </div>

      {/* Main Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Registered Users</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'users' ? 'bg-purple-800 text-purple-100' : 'bg-gray-100 text-gray-600'
          }`}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'agents'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Agents & Verifications</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'agents' ? 'bg-blue-800 text-blue-100' : 'bg-gray-100 text-gray-600'
          }`}>
            {agents.length}
          </span>
          {requests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {requests.length} pending
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL REGISTERED USERS DIRECTORY (Requirement 6) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-gray-500">Total Users</span>
              <div className="text-2xl font-extrabold text-gray-900">{users.length}</div>
              <p className="text-[10px] text-gray-400">All registered campus accounts</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Students
              </span>
              <div className="text-2xl font-extrabold text-blue-900">{totalStudentsCount}</div>
              <p className="text-[10px] text-gray-400">Undergraduate & postgraduate</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Agents
              </span>
              <div className="text-2xl font-extrabold text-purple-900">{totalAgentsCount}</div>
              <p className="text-[10px] text-purple-700 font-medium">
                {suspendedAgentsCount > 0 ? `${suspendedAgentsCount} currently suspended` : 'All agents active'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Administrators
              </span>
              <div className="text-2xl font-extrabold text-amber-900">{totalAdminsCount}</div>
              <p className="text-[10px] text-gray-400">Moderators & admins</p>
            </div>
          </div>

          {/* User Search & Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search every user by name, email, phone number, matric number, or agency..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-semibold text-gray-500">Status:</span>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Statuses ({users.length})</option>
                  <option value="active">Active Only ({users.length - totalSuspendedUsersCount})</option>
                  <option value="suspended">Suspended Only ({totalSuspendedUsersCount})</option>
                </select>
              </div>
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Role:</span>
              <button
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  userRoleFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('student')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  userRoleFilter === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Students ({totalStudentsCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('agent')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  userRoleFilter === 'agent'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Agents ({totalAgentsCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('admin')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                  userRoleFilter === 'admin'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Admins ({totalAdminsCount})
              </button>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-gray-900">Registered Users Directory</h3>
                <span className="text-xs font-semibold text-gray-500">
                  Showing {filteredUsers.length} of {users.length} accounts
                </span>
              </div>
              <button
                onClick={loadData}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh users directory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-gray-500">Loading registered users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500 space-y-2">
                <Users className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">No users match your search and filter criteria.</p>
                <button
                  onClick={() => { setUserSearch(''); setUserRoleFilter('all'); setUserStatusFilter('all'); }}
                  className="text-purple-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Profile Info</th>
                      <th className="p-3.5">Account Status</th>
                      <th className="p-3.5">Registered</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => {
                      const isSuspended = u.is_suspended === true || u.is_active === false;
                      const role: UserRole = u.role || 'student';

                      return (
                        <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                          
                          {/* User Column */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0 ${
                                role === 'admin' 
                                  ? 'bg-amber-600' 
                                  : role === 'agent' 
                                  ? 'bg-purple-600' 
                                  : 'bg-blue-600'
                              }`}>
                                {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                  <span>{u.full_name || 'Anonymous User'}</span>
                                  {role === 'admin' && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span>{u.email || 'No email registered'}</span>
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                                  ID: {u.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge Column */}
                          <td className="p-3.5">
                            {role === 'student' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] rounded-lg">
                                <GraduationCap className="w-3.5 h-3.5" /> Student
                              </span>
                            )}
                            {role === 'agent' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px] rounded-lg">
                                <Building2 className="w-3.5 h-3.5" /> Agent
                              </span>
                            )}
                            {role === 'admin' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] rounded-lg">
                                <Shield className="w-3.5 h-3.5 text-amber-600" /> Admin
                              </span>
                            )}
                          </td>

                          {/* Contact Phone */}
                          <td className="p-3.5 text-gray-700 font-medium whitespace-nowrap">
                            {u.phone_number ? (
                              <span className="font-semibold text-gray-900">{u.phone_number}</span>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>

                          {/* Profile Specific Column */}
                          <td className="p-3.5 text-[11px] text-gray-600">
                            {role === 'student' && (
                              <div className="space-y-0.5">
                                <div><strong className="text-gray-700">Dept:</strong> {u.student_profile?.department || 'N/A'}</div>
                                <div><strong className="text-gray-700">Matric:</strong> {u.student_profile?.matric_number || 'N/A'} &bull; {u.student_profile?.level || 'N/A'}</div>
                              </div>
                            )}
                            {role === 'agent' && (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-gray-800">{u.agent_profile?.agency_name || 'Independent Agent'}</div>
                                <div>
                                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    u.agent_profile?.verification_status === 'verified'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : u.agent_profile?.verification_status === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {u.agent_profile?.verification_status || 'unverified'}
                                  </span>
                                </div>
                              </div>
                            )}
                            {role === 'admin' && (
                              <span className="text-gray-500 italic">Full Platform Administrator</span>
                            )}
                          </td>

                          {/* Account Status Badge */}
                          <td className="p-3.5 whitespace-nowrap">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] rounded-lg">
                                <XCircle className="w-3.5 h-3.5 text-red-600" /> Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                              </span>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="p-3.5 text-[11px] text-gray-500 whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>

                          {/* Actions Column */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => {
                                  if (role === 'agent') {
                                    openAgentDetails(u.id);
                                  } else {
                                    openUserDetails(u);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                                title="View detailed profile"
                              >
                                <Eye className="w-3.5 h-3.5" /> Details
                              </button>

                              {/* Suspend or Reactivate (Disabled for admins) */}
                              {role !== 'admin' && (
                                isSuspended ? (
                                  <button
                                    onClick={() => requestReactivateUser(u)}
                                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                                    title="Reactivate this account"
                                  >
                                    <Unlock className="w-3.5 h-3.5" /> Reactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => requestSuspendUser(u)}
                                    className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                                    title="Suspend this account"
                                  >
                                    <Lock className="w-3.5 h-3.5" /> Suspend
                                  </button>
                                )
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AGENTS & KYC VERIFICATIONS (Existing Deep Verification Queue) */}
      {/* ========================================================================= */}
      {activeTab === 'agents' && (
        <div className="space-y-6">

          {/* Pending Verification Application Queue */}
          {requests.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Verification Queue ({requests.length} Pending Review)
                </h3>
                <span className="text-[11px] font-semibold text-amber-700">Requires Admin Identity Approval</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{req.agent?.full_name}</span>
                        <div className="text-gray-500 text-[11px]">{req.agency_name || 'Independent Agent'}</div>
                        <div className="text-gray-600 text-[11px] mt-0.5">NIN: <span className="font-mono font-bold text-gray-800">{req.nin || 'N/A'}</span></div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                        Pending
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {req.government_id_url && (
                        <a
                          href={req.government_id_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-blue-100"
                        >
                          <FileText className="w-3 h-3" /> Govt ID
                        </a>
                      )}
                      {req.selfie_url && (
                        <a
                          href={req.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-purple-100"
                        >
                          <Eye className="w-3 h-3" /> Selfie
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleReject(req.id, req.agent_id)}
                        className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-bold text-xs"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id, req.agent_id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                      >
                        Approve & Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter and Search Bar for Agents */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search accommodation agents by name, phone, email, or agency..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'active', 'suspended', 'verified', 'pending', 'unverified'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAgentStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                    agentStatusFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Agents Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Accommodation Agents Directory ({filteredAgents.length})
              </h3>
              <button
                onClick={loadData}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh agents"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-gray-500">Loading agent accounts...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-500 space-y-2">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700">No agents found matching this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Agent</th>
                      <th className="p-4">Contact Phone</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAgents.map((agent) => {
                      const isSuspended = agent.is_suspended === true || agent.is_active === false;
                      const status = agent.agent_profile?.verification_status || 'unverified';
                      const req = requests.find(r => r.agent_id === agent.id);

                      return (
                        <tr key={agent.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                                {agent.full_name?.charAt(0) || 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm hover:text-blue-600 flex items-center gap-1">
                                  {agent.full_name}
                                </div>
                                <div className="text-gray-500 text-[11px]">{agent.agent_profile?.agency_name || 'Independent Agent'}</div>
                                <div className="text-gray-400 text-[10px]">{agent.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-gray-800 font-semibold whitespace-nowrap">
                            {agent.phone_number || 'N/A'}
                          </td>

                          {/* Account Status Badge */}
                          <td className="p-4 whitespace-nowrap">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] rounded-lg">
                                <XCircle className="w-3.5 h-3.5 text-red-600" /> Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                              </span>
                            )}
                          </td>

                          {/* Verification Status */}
                          <td className="p-4 whitespace-nowrap">
                            {status === 'verified' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-lg">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                              </span>
                            )}
                            {status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                              </span>
                            )}
                            {status === 'unverified' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-[11px] rounded-lg">
                                Unverified
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 font-semibold text-[11px] rounded-lg">
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openAgentDetails(agent.id)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Details
                              </button>

                              {/* Proper In-App Suspend / Reactivate Trigger */}
                              {isSuspended ? (
                                <button
                                  onClick={() => requestReactivateUser(agent)}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                                  title="Reactivate agent account"
                                >
                                  <Unlock className="w-3.5 h-3.5" /> Reactivate Agent
                                </button>
                              ) : (
                                <button
                                  onClick={() => requestSuspendUser(agent)}
                                  className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                                  title="Suspend agent account"
                                >
                                  <Lock className="w-3.5 h-3.5" /> Suspend Agent
                                </button>
                              )}

                              {req?.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(req.id, agent.id)}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(req.id, agent.id)}
                                    className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM IN-APP CONFIRMATION DIALOG MODAL (Part 1 & Part 2) */}
      {/* ========================================================================= */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-6 space-y-5">
            
            {/* Header with Icon */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.type === 'suspend'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {confirmModal.type === 'suspend' ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <Unlock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  {confirmModal.type === 'suspend' 
                    ? `Suspend ${confirmModal.targetUser.role === 'agent' ? 'Agent' : 'User'} Account` 
                    : `Reactivate ${confirmModal.targetUser.role === 'agent' ? 'Agent' : 'User'} Account`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Action confirmation required by administrator
                </p>
              </div>
            </div>

            {/* Target User Details Box */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">
                  {confirmModal.targetUser.full_name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold capitalize bg-gray-200 text-gray-700">
                  {confirmModal.targetUser.role}
                </span>
              </div>
              <div className="text-gray-500 text-[11px]">
                Email: <span className="font-medium text-gray-700">{confirmModal.targetUser.email || 'N/A'}</span>
              </div>
              {confirmModal.targetUser.phone_number && (
                <div className="text-gray-500 text-[11px]">
                  Phone: <span className="font-medium text-gray-700">{confirmModal.targetUser.phone_number}</span>
                </div>
              )}
            </div>

            {/* Impact Explanation */}
            <div className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 ${
              confirmModal.type === 'suspend'
                ? 'bg-red-50/70 border-red-200 text-red-800'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {confirmModal.type === 'suspend' ? 'Account Suspension Consequences:' : 'Reactivation Effects:'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-700">
                {confirmModal.type === 'suspend' ? (
                  <>
                    <li>The user will immediately be barred from creating or publishing listings.</li>
                    <li>All active property listings owned by this agent will immediately disappear from student search results and public browse pages.</li>
                    <li>The agent status will visibly show as &quot;Suspended&quot; throughout the system.</li>
                  </>
                ) : (
                  <>
                    <li>The user account will be restored to active standing.</li>
                    <li>Eligible property listings will immediately become visible to FUW students again.</li>
                    <li>The user will regain listing management and publishing privileges.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={confirmModal.loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeConfirmationAction}
                disabled={confirmModal.loading}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50 ${
                  confirmModal.type === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Database...</span>
                  </>
                ) : confirmModal.type === 'suspend' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Yes, Suspend Account</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Yes, Reactivate Account</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GENERIC USER DETAILS MODAL (For Students & Admins) */}
      {/* ========================================================================= */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base ${
                  selectedUserForDetails.role === 'student' ? 'bg-blue-600' : 'bg-amber-600'
                }`}>
                  {selectedUserForDetails.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{selectedUserForDetails.full_name}</h3>
                  <span className="text-xs text-gray-500 capitalize">{selectedUserForDetails.role} Profile</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[65vh] overflow-y-auto pr-1">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 font-medium block">Email:</span>
                  <span className="font-semibold text-gray-900">{selectedUserForDetails.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Phone:</span>
                  <span className="font-semibold text-gray-900">{selectedUserForDetails.phone_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Account Status:</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    selectedUserForDetails.is_suspended === true || selectedUserForDetails.is_active === false
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  }`}>
                    {selectedUserForDetails.is_suspended === true || selectedUserForDetails.is_active === false ? 'Suspended' : 'Active'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium block">Joined Date:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedUserForDetails.created_at ? new Date(selectedUserForDetails.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {selectedUserForDetails.student_profile && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2">
                  <h4 className="font-bold text-blue-900 text-xs">FUW Student Academic Record</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">Department:</span>
                      <span className="font-semibold text-gray-800">{selectedUserForDetails.student_profile.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Matric Number:</span>
                      <span className="font-mono font-bold text-gray-800">{selectedUserForDetails.student_profile.matric_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Academic Level:</span>
                      <span className="font-semibold text-gray-800">{selectedUserForDetails.student_profile.level || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Apartment Inquiries & Bookings (Student) */}
              {selectedUserForDetails.role === 'student' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      Apartment Inquiries & Bookings
                    </h4>
                    {userBookingsData?.inquiries && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {userBookingsData.inquiries.length} Inquiries Logged
                      </span>
                    )}
                  </div>

                  {userDetailsLoading ? (
                    <div className="p-4 bg-gray-50 rounded-xl text-center space-y-2">
                      <RefreshCw className="w-4 h-4 text-purple-600 animate-spin mx-auto" />
                      <p className="text-gray-500 text-[11px]">Loading user apartment bookings & inquiries...</p>
                    </div>
                  ) : userBookingsData?.inquiries && userBookingsData.inquiries.length > 0 ? (
                    <div className="space-y-2">
                      {userBookingsData.inquiries.map((inq: any) => (
                        <div key={inq.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                              {inq.property?.cover_image_url ? (
                                <img src={inq.property.cover_image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Building2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-gray-900 block truncate">
                                {inq.property?.title || 'Accommodating Property'}
                              </span>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">
                                {inq.property?.annual_rent && (
                                  <span className="font-semibold text-gray-800">
                                    ₦{Number(inq.property.annual_rent).toLocaleString()}/yr
                                  </span>
                                )}
                                <span>&bull;</span>
                                <span>{inq.property?.area || 'FUW Area'}</span>
                                {inq.property?.agent && (
                                  <>
                                    <span>&bull;</span>
                                    <span>Agent: {inq.property.agent.full_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                              {inq.type}
                            </span>
                            <span className="block text-[10px] text-gray-400 mt-0.5">
                              {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-gray-500 text-[11px]">
                      No apartment inquiries or bookings recorded yet for this student.
                    </div>
                  )}

                  {/* Saved Properties Count */}
                  {userBookingsData?.savedProperties && userBookingsData.savedProperties.length > 0 && (
                    <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-red-900 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
                        Saved Accommodations Bookmarks
                      </span>
                      <span className="font-bold text-red-700">
                        {userBookingsData.savedProperties.length} Saved
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Agent Properties Summary (if Agent) */}
              {selectedUserForDetails.role === 'agent' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs">Agent Accommodations Portfolio</h4>
                  {userDetailsLoading ? (
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <RefreshCw className="w-4 h-4 text-purple-600 animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Listed Properties:</span>
                        <span className="font-bold text-purple-900">{userBookingsData?.propertiesCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Agency:</span>
                        <span className="font-semibold text-gray-800">{selectedUserForDetails.agent_profile?.agency_name || 'Independent Agent'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verification Status:</span>
                        <span className="font-bold capitalize text-emerald-700">{selectedUserForDetails.agent_profile?.verification_status || 'unverified'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {selectedUserForDetails.role !== 'admin' && (
                (selectedUserForDetails.is_suspended === true || selectedUserForDetails.is_active === false) ? (
                  <button
                    onClick={() => {
                      requestReactivateUser(selectedUserForDetails);
                      setSelectedUserForDetails(null);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Reactivate Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      requestSuspendUser(selectedUserForDetails);
                      setSelectedUserForDetails(null);
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Suspend Account
                  </button>
                )
              )}

              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AGENT DETAIL & REVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedAgentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                  {agentDetails?.profile?.full_name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {agentDetails?.profile?.full_name || 'Agent Details'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Agent ID: <span className="font-mono text-gray-700">{selectedAgentId}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedAgentId(null); setAgentDetails(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading || !agentDetails ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-gray-500">Loading complete agent profile & KYC records...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
                
                {/* Status Alert Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  (agentDetails.profile.is_suspended === true || agentDetails.profile.is_active === false)
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {(agentDetails.profile.is_suspended === true || agentDetails.profile.is_active === false) ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="font-bold text-sm">
                      Account Status: {(agentDetails.profile.is_suspended === true || agentDetails.profile.is_active === false) ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                  <span className="font-semibold text-xs">
                    Verification: {agentDetails.agentProfile?.verification_status || 'unverified'}
                  </span>
                </div>

                {/* Section 1: Agent Personal Info */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-blue-600 border-b pb-1">
                    1. Contact & Account Identity
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-500 font-medium block">Full Name:</span>
                      <span className="font-bold text-gray-900 text-sm">{agentDetails.profile.full_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Email Address:</span>
                      <span className="font-semibold text-gray-800">{agentDetails.profile.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Phone Number:</span>
                      <span className="font-semibold text-gray-800">{agentDetails.profile.phone_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Registration Date:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(agentDetails.profile.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Agency Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-blue-600 border-b pb-1">
                    2. Agency / Business Profile
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-500 font-medium block">Agency Name:</span>
                      <span className="font-bold text-gray-900">
                        {agentDetails.agentProfile?.agency_name || agentDetails.verificationRequest?.agency_name || 'Independent Agent'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Office Address:</span>
                      <span className="font-semibold text-gray-800">
                        {agentDetails.agentProfile?.office_address || agentDetails.verificationRequest?.office_address || 'Not Provided'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 font-medium block">Agent Bio:</span>
                      <span className="font-medium text-gray-700">
                        {agentDetails.agentProfile?.bio || 'No agency bio provided.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Verification & NIN Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-blue-600 border-b pb-1">
                    3. Verification & NIN Audit
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-gray-500 font-medium block">National Identity Number (NIN):</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {agentDetails.agentProfile?.nin || agentDetails.verificationRequest?.nin || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">NIMC Verified Status:</span>
                      <span className="font-semibold text-gray-800">
                        {agentDetails.agentProfile?.nin_verified ? 'Verified via NIMC Hash' : 'Pending Admin Inspection'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Submission Date:</span>
                      <span className="font-semibold text-gray-800">
                        {agentDetails.verificationRequest?.created_at
                          ? new Date(agentDetails.verificationRequest.created_at).toLocaleString()
                          : 'No submission record'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Admin Review Notes / Rejection Reason:</span>
                      <span className="font-semibold text-amber-900">
                        {agentDetails.verificationRequest?.admin_notes || agentDetails.agentProfile?.verification_rejection_reason || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Submitted KYC Documents */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider text-blue-600 border-b pb-1">
                    4. Verification Documents (Government ID & Live Selfie)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Government ID Document */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                      <span className="font-bold text-gray-900 block">Government ID Document</span>
                      {(agentDetails.verificationRequest?.government_id_url || agentDetails.agentProfile?.government_id_url) ? (
                        <div className="space-y-2">
                          <a
                            href={agentDetails.verificationRequest?.government_id_url || agentDetails.agentProfile?.government_id_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" /> View Full ID Document
                          </a>
                          <img
                            src={agentDetails.verificationRequest?.government_id_url || agentDetails.agentProfile?.government_id_url}
                            alt="Government ID Preview"
                            className="w-full h-40 object-cover rounded-lg border border-gray-300"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No government ID document uploaded.</p>
                      )}
                    </div>

                    {/* Live Selfie Photo */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                      <span className="font-bold text-gray-900 block">Live Facial Selfie</span>
                      {(agentDetails.verificationRequest?.selfie_url || agentDetails.agentProfile?.selfie_url) ? (
                        <div className="space-y-2">
                          <a
                            href={agentDetails.verificationRequest?.selfie_url || agentDetails.agentProfile?.selfie_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-purple-600 font-bold hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" /> View Full Selfie Photo
                          </a>
                          <img
                            src={agentDetails.verificationRequest?.selfie_url || agentDetails.agentProfile?.selfie_url}
                            alt="Selfie Photo Preview"
                            className="w-full h-40 object-cover rounded-lg border border-gray-300"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No selfie photo uploaded.</p>
                      )}
                    </div>

                  </div>
                </div>

                {/* Section 5: Admin Review Actions */}
                <div className="p-4 bg-gray-100 rounded-xl border border-gray-300 flex flex-wrap items-center justify-between gap-3">
                  {(agentDetails.profile.is_suspended === true || agentDetails.profile.is_active === false) ? (
                    <button
                      onClick={() => requestReactivateUser(agentDetails.profile)}
                      className="px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      <Unlock className="w-4 h-4" /> Reactivate Agent
                    </button>
                  ) : (
                    <button
                      onClick={() => requestSuspendUser(agentDetails.profile)}
                      className="px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    >
                      <Lock className="w-4 h-4" /> Suspend Agent
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(agentDetails.verificationRequest?.id || '', agentDetails.profile.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <XCircle className="w-4 h-4" /> Reject Agent Verification
                    </button>

                    <button
                      onClick={() => handleApprove(agentDetails.verificationRequest?.id || '', agentDetails.profile.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Verify Agent
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROVISION AGENT ACCOUNT MODAL */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Provision Agent Account
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Agent Account Provisioned!
                </div>
                <p className="text-xs text-emerald-700">
                  Provide these initial credentials to the agent. They will be prompted to change their temporary password upon first login.
                </p>
                <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs font-mono space-y-1">
                  <div><strong>Email:</strong> {createdCredentials.email}</div>
                  <div><strong>Temporary Password:</strong> {createdCredentials.pass}</div>
                </div>
                <button
                  onClick={() => { setCreatedCredentials(null); setCreateModalOpen(false); }}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Agent Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Samuel Danjuma"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="agent@example.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Phone Number (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Agency Name</label>
                    <input
                      type="text"
                      value={newAgency}
                      onChange={(e) => setNewAgency(e.target.value)}
                      placeholder="e.g. Wukari Realty"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Office Address</label>
                    <input
                      type="text"
                      value={newOffice}
                      onChange={(e) => setNewOffice(e.target.value)}
                      placeholder="e.g. Back Gate"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Agent will be required to change password on first login.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {createLoading ? 'Provisioning...' : 'Provision Account'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
