import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, 
  Search, 
  Heart, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  ShieldAlert,
  LayoutDashboard,
  PlusCircle,
  LogIn,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate?: (view: any) => void;
  setCurrentView?: (view: any) => void;
  onOpenAuth: (mode?: 'login' | 'student_register' | 'agent_register' | 'admin_login') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, setCurrentView, onOpenAuth }) => {
  const { user, profile, agentProfile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (view: string) => {
    const handler = onNavigate || setCurrentView;
    if (handler) handler(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAgentVerified = profile?.role === 'agent' && agentProfile?.verification_status === 'verified';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => navigateTo(profile?.role === 'admin' ? 'admin-dashboard' : 'home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-gray-900">CampusNest</span>
                <span className="text-[10px] font-semibold tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md uppercase">FUW</span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">Federal University Wukari</p>
            </div>
          </div>

          {/* Desktop Navigation Links (Public, Student, Agent only - hidden for Admin) */}
          {profile?.role !== 'admin' && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigateTo('home')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'home' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo('search')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'search' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Search className="w-4 h-4" />
                Find Apartments
              </button>
              <button
                onClick={() => navigateTo('about')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'about' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                About
              </button>
              <button
                onClick={() => navigateTo('faq')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'faq' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => navigateTo('contact')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'contact' ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Contact
              </button>
            </nav>
          )}

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('student_register')}
                  className="px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Student Register
                </button>
                <button
                  onClick={() => onOpenAuth('agent_register')}
                  className="px-3.5 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Agent Signup
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {profile?.role === 'student' && (
                  <>
                    <button
                      onClick={() => navigateTo('student-dashboard')}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors relative"
                      title="Saved Properties"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigateTo('student-dashboard')}
                      className="px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Student Dashboard
                    </button>
                  </>
                )}

                {profile?.role === 'agent' && (
                  <>
                    {isAgentVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Agent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                        <ShieldAlert className="w-3.5 h-3.5" /> Verification Pending
                      </span>
                    )}
                    <button
                      onClick={() => navigateTo('agent-dashboard')}
                      className="px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Agent Portal
                    </button>
                  </>
                )}

                {profile?.role === 'admin' && (
                  <button
                    onClick={() => navigateTo('admin-dashboard')}
                    className="px-3.5 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5 font-semibold"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Control
                  </button>
                )}

                <button
                  onClick={signOut}
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {profile?.role !== 'admin' && (
            <>
              <button
                onClick={() => navigateTo('home')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentView === 'home' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo('search')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentView === 'search' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                }`}
              >
                <Search className="w-4 h-4" /> Find Apartments
              </button>
              <button
                onClick={() => navigateTo('about')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700"
              >
                About
              </button>
              <button
                onClick={() => navigateTo('faq')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700"
              >
                FAQ
              </button>
              <button
                onClick={() => navigateTo('contact')}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700"
              >
                Contact
              </button>
            </>
          )}

          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1.5 text-xs text-gray-500 font-semibold uppercase">
                  Logged in as {profile?.full_name} ({profile?.role})
                </div>
                {profile?.role === 'student' && (
                  <button
                    onClick={() => navigateTo('student-dashboard')}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Student Dashboard
                  </button>
                )}
                {profile?.role === 'agent' && (
                  <button
                    onClick={() => navigateTo('agent-dashboard')}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Agent Dashboard
                  </button>
                )}
                {profile?.role === 'admin' && (
                  <button
                    onClick={() => navigateTo('admin-dashboard')}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Admin Portal
                  </button>
                )}
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { onOpenAuth('student_register'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 text-center text-sm font-medium text-white bg-blue-600 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
