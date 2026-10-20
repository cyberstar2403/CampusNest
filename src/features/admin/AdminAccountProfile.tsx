import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  Key, 
  ShieldAlert, 
  Users, 
  Building2, 
  AlertTriangle 
} from 'lucide-react';

export const AdminAccountProfile: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Profile & System Authority</h1>
        <p className="text-xs text-gray-500 mt-1">
          Authorized administrative credentials, platform permissions, and security settings for CampusNest.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'System Administrator'}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-[10px] uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">CampusNest FUW Platform Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Active Admin Session
            </span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Email:</span>
            </div>
            <div className="font-bold text-gray-900 break-all">
              {profile?.email || user?.email || 'admin@campusnest.ng'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Phone className="w-3.5 h-3.5 text-purple-600" />
              <span>Phone Contact:</span>
            </div>
            <div className="font-bold text-gray-900">
              {profile?.phone_number || '+234 812 650 5066'}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Registration Date:</span>
            </div>
            <div className="font-bold text-gray-900">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'August 2026'}
            </div>
          </div>
        </div>

        {/* Permissions & Security Box */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Administrative Authority & Capabilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-950 block">User Management</span>
                <p className="text-purple-800/80 text-[11px] mt-0.5">
                  Inspect all registered students & agents, review student booking history, suspend or reactivate agent accounts.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-950 block">Property Listings Moderation</span>
                <p className="text-blue-800/80 text-[11px] mt-0.5">
                  Review and approve or reject accommodation submissions, inspect full listing specs, and delete inappropriate content.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950 block">Agent Verification Review</span>
                <p className="text-amber-800/80 text-[11px] mt-0.5">
                  Examine government ID documents, selfies, and NIN credentials to approve or reject agent certification.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/50 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-950 block">Scam & Quality Moderation</span>
                <p className="text-red-800/80 text-[11px] mt-0.5">
                  Investigate student-reported scam listings, dismiss false reports, or purge reported listings from the database.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900 block text-xs">End Administrative Session</span>
            <span className="text-[11px] text-gray-500">Securely sign out of the CampusNest Control Centre.</span>
          </div>

          {confirmSignOut ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmSignOut(false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={signOut}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Yes, Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmSignOut(true)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
