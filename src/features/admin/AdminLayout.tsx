import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  LayoutDashboard, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  X, 
  Clock, 
  Shield, 
  UserCheck, 
  FileCheck2, 
  Activity, 
  ChevronRight,
  Database,
  Lock,
  Mail,
  Phone,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export type AdminSection = 'overview' | 'users' | 'properties' | 'reports' | 'account';

interface AdminLayoutProps {
  currentSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onNavigateSection,
  children,
}) => {
  const { user, profile, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAgents: 0,
    totalProperties: 0,
    pendingProperties: 0,
    suspendedAgents: 0,
    pendingReports: 0,
    pendingVerifications: 0,
  });

  const loadStats = async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats({
        totalUsers: data.totalUsers,
        totalStudents: data.totalStudents,
        totalAgents: data.totalAgents,
        totalProperties: data.totalProperties,
        pendingProperties: data.pendingProperties,
        suspendedAgents: data.suspendedAgents,
        pendingReports: data.pendingReports,
        pendingVerifications: data.pendingVerifications,
      });
    } catch (e) {
      console.warn('Admin layout stats refresh notice:', e);
    }
  };

  useEffect(() => {
    loadStats();
    // Poll stats periodically for live badges
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [currentSection]);

  const handleSelectSection = (section: AdminSection) => {
    onNavigateSection(section);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: {
    id: AdminSection;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      description: 'Platform metrics & status',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Students, agents & suspension',
      icon: Users,
      badge: stats.pendingVerifications > 0 ? stats.pendingVerifications : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'properties',
      label: 'Property Management',
      description: 'Listings, approvals & moderation',
      icon: Building2,
      badge: stats.pendingProperties > 0 ? stats.pendingProperties : undefined,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'reports',
      label: 'Reports & Moderation',
      description: 'Scam & listing complaints',
      icon: AlertTriangle,
      badge: stats.pendingReports > 0 ? stats.pendingReports : undefined,
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      id: 'account',
      label: 'Account & Security',
      description: 'Admin profile & credentials',
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950 border-r border-slate-800 shrink-0 select-none">
        
        {/* Sidebar Brand Header */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/50">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">CampusNest</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 uppercase">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Administrative Control Centre</p>
          </div>
        </div>

        {/* Admin Authority Banner */}
        <div className="px-5 py-4 border-b border-slate-800/60 bg-gradient-to-r from-purple-950/40 to-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {profile?.full_name || 'System Administrator'}
              </div>
              <div className="text-[10px] text-purple-400 font-medium truncate">
                {profile?.email || user?.email || 'admin@campusnest.ng'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Administrative Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'}`} />
                  <div className="min-w-0">
                    <div className="text-xs leading-none truncate">{item.label}</div>
                    <div className={`text-[10px] mt-1 truncate ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    isActive 
                      ? 'bg-white text-purple-900 border-white' 
                      : item.badgeColor || 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Realtime Status Badges in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-3">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-[11px] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Control Status
              </span>
              <span className="font-bold text-emerald-400">Active</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px]">
              <div>
                <span className="text-slate-400 block">Total Users:</span>
                <span className="font-bold text-white text-xs">{stats.totalUsers}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Properties:</span>
                <span className="font-bold text-white text-xs">{stats.totalProperties}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Suspended:</span>
                <span className={`font-bold text-xs ${stats.suspendedAgents > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {stats.suspendedAgents}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Pending:</span>
                <span className={`font-bold text-xs ${stats.pendingProperties > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {stats.pendingProperties}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Sign Out */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-900/50 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Control Centre
          </button>
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER SIDEBAR */}
      {/* ========================================================================= */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-950 border-r border-slate-800 text-white z-10 p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-500" />
                <span className="font-bold text-base">CampusNest Admin</span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isActive ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={signOut}
                className="w-full py-2.5 bg-red-950/40 text-red-300 border border-red-900/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN ADMIN WORKSPACE */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 text-slate-900">
        
        {/* Dedicated Admin Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-2xs px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                Admin Control
              </span>
              <span className="text-gray-300 hidden sm:inline">&bull;</span>
              <span className="font-semibold text-gray-700 capitalize hidden sm:inline">
                {currentSection === 'overview' && 'Overview Dashboard'}
                {currentSection === 'users' && 'User Management & Verification'}
                {currentSection === 'properties' && 'Accommodations & Listings Moderation'}
                {currentSection === 'reports' && 'Scam Reports & Flagged Listings'}
                {currentSection === 'account' && 'Administrator Profile & Security'}
              </span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="text-right">
                <div className="font-bold text-gray-900 leading-tight">
                  {profile?.full_name || 'Admin'}
                </div>
                <div className="text-[10px] text-gray-500">
                  Super Administrator
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
            </div>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors shadow-2xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Admin Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
};
