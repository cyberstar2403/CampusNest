import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AgentVerificationRequest, PropertyReport, Property } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  ExternalLink,
  ChevronRight,
  FileText,
  GraduationCap
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateAgents: () => void;
  onNavigateUsers?: () => void;
  onNavigateReports: () => void;
  onNavigateProperties: () => void;
  onSelectProperty: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateAgents,
  onNavigateUsers,
  onNavigateReports,
  onNavigateProperties,
  onSelectProperty,
}) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAgents: 0,
    totalAdmins: 0,
    verifiedAgents: 0,
    pendingVerifications: 0,
    suspendedAgents: 0,
    totalProperties: 0,
    pendingReports: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<AgentVerificationRequest[]>([]);
  const [pendingReports, setPendingReports] = useState<PropertyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [sData, reqsData, repsData] = await Promise.all([
        adminService.getAdminDashboardStats(),
        adminService.getPendingVerificationRequests(),
        adminService.getPendingReports(),
      ]);
      setStats(sData as any);
      setPendingRequests(reqsData.slice(0, 5)); // show top 5
      setPendingReports(repsData.slice(0, 5)); // show top 5
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveAgent = async (requestId: string, agentId: string) => {
    try {
      await adminService.approveAgentVerification(requestId, agentId);
      loadAdminData();
    } catch (err) {
      console.error('Error approving agent:', err);
    }
  };

  const handleRejectAgent = async (requestId: string, agentId: string) => {
    const reason = window.prompt('Enter rejection reason for agent:');
    if (reason === null) return;
    try {
      await adminService.rejectAgentVerification(requestId, agentId, reason);
      loadAdminData();
    } catch (err) {
      console.error('Error rejecting agent:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            FUW Accommodation Moderation Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            System Admin Controls: Verify agent credentials, manage users & suspensions, moderate reported scam listings, and maintain platform security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateUsers || onNavigateAgents}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" /> All Users Directory
          </button>
          <button
            onClick={onNavigateAgents}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Agent Verifications
          </button>
        </div>
      </div>

      {/* Admin Quick Metric Cards (Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Registered Users */}
        <div 
          onClick={onNavigateUsers || onNavigateAgents}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          title="Click to view and manage all registered users"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-purple-700 transition-colors">
              Total Registered Users &rarr;
            </span>
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{stats.totalUsers}</div>
          <p className="text-[11px] text-purple-700 font-medium">
            Active CampusNest User Accounts
          </p>
        </div>

        {/* Total Students */}
        <div 
          onClick={onNavigateUsers}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          title="Click to view all registered students"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-700 transition-colors">
              Total Students &rarr;
            </span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{stats.totalStudents}</div>
          <p className="text-[11px] text-blue-600 font-medium">
            FUW Undergraduates & Postgraduates
          </p>
        </div>

        {/* Total Agents */}
        <div 
          onClick={onNavigateAgents}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          title="Click to view accommodation agents"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-700 transition-colors">
              Total Agents &bull; {stats.verifiedAgents} Verified
            </span>
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{stats.totalAgents}</div>
          <p className="text-[11px] text-indigo-600 font-medium">
            {stats.pendingVerifications} Pending Verification
          </p>
        </div>

        {/* Total Properties */}
        <div 
          onClick={onNavigateProperties}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          title="Click to view all property listings"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-emerald-700 transition-colors">
              Total Properties &bull; Manage &rarr;
            </span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{stats.totalProperties}</div>
          <p className="text-[11px] text-emerald-600 font-medium">
            {stats.approvedProperties} Approved & Live on Site
          </p>
        </div>

        {/* Pending Property Approvals */}
        <div 
          onClick={onNavigateProperties}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          title="Click to review pending property listings"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-amber-700 transition-colors">
              Pending Property Approvals
            </span>
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{stats.pendingProperties}</div>
          <p className="text-[11px] text-amber-700 font-medium">
            Awaiting administrative review
          </p>
        </div>

        {/* Suspended Agents */}
        <div 
          onClick={onNavigateAgents}
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-red-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          title="Click to view suspended agents"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-red-700 transition-colors">
              Suspended Agents
            </span>
            <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-600">{stats.suspendedAgents}</div>
          <p className="text-[11px] text-red-600 font-medium">
            Barred from posting listings
          </p>
        </div>

      </div>

      {/* Two Column Layout: Verification Queue + Scam Reports Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending Agent Verifications Box */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> Pending Agent Verifications
            </h2>
            <button
              onClick={onNavigateAgents}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No pending agent verification submissions at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{req.agent?.full_name}</span>
                      <p className="text-gray-500">{req.agent?.phone_number} • NIN: <span className="font-semibold text-gray-800">{req.nin || 'N/A'}</span></p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {req.government_id_url && (
                        <a
                          href={req.government_id_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-gray-100 flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Govt ID
                        </a>
                      )}
                      {req.selfie_url && (
                        <a
                          href={req.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-purple-600 font-medium hover:bg-gray-100 flex items-center gap-1"
                        >
                          Selfie
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleRejectAgent(req.id, req.agent_id)}
                      className="px-3 py-1 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-semibold"
                    >
                      Reject ID
                    </button>
                    <button
                      onClick={() => handleApproveAgent(req.id, req.agent_id)}
                      className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold shadow-2xs"
                    >
                      Approve & Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Student Scam Reports Box */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Recent Student Flagged Listings
            </h2>
            <button
              onClick={onNavigateReports}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No unhandled student reports. All listings are clean!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 bg-red-50/50 rounded-xl border border-red-100 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-red-900 capitalize">{rep.reason.replace('_', ' ')}</span>
                      <p className="text-gray-700 mt-0.5">{rep.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Reported by student: {rep.reporter?.full_name}</p>
                    </div>

                    {rep.property && (
                      <button
                        onClick={() => onSelectProperty(rep.property_id)}
                        className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-gray-800 font-semibold hover:bg-gray-100 shrink-0"
                      >
                        Inspect Property
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
