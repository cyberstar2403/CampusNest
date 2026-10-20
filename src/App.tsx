import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Critical Landing Page loaded immediately
import { LandingPage } from './features/home/LandingPage';

// Lazy-loaded secondary pages & modals
const SearchResultsPage = lazy(() => import('./features/search/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const PropertyDetailsPage = lazy(() => import('./features/properties/PropertyDetailsPage').then(m => ({ default: m.PropertyDetailsPage })));
const StudentDashboard = lazy(() => import('./features/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const AgentDashboard = lazy(() => import('./features/agent/AgentDashboard').then(m => ({ default: m.AgentDashboard })));
const AgentCreateProperty = lazy(() => import('./features/agent/AgentCreateProperty').then(m => ({ default: m.AgentCreateProperty })));
const AgentEditProperty = lazy(() => import('./features/agent/AgentEditProperty').then(m => ({ default: m.AgentEditProperty })));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminAgentManagement = lazy(() => import('./features/admin/AdminAgentManagement').then(m => ({ default: m.AdminAgentManagement })));
const AdminPropertyManagement = lazy(() => import('./features/admin/AdminPropertyManagement').then(m => ({ default: m.AdminPropertyManagement })));
const AdminReportsModeration = lazy(() => import('./features/admin/AdminReportsModeration').then(m => ({ default: m.AdminReportsModeration })));
const AdminAccountProfile = lazy(() => import('./features/admin/AdminAccountProfile').then(m => ({ default: m.AdminAccountProfile })));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AboutPage = lazy(() => import('./features/public/AboutPage').then(m => ({ default: m.AboutPage })));
const FaqPage = lazy(() => import('./features/public/FaqPage').then(m => ({ default: m.FaqPage })));
const ContactPage = lazy(() => import('./features/public/ContactPage').then(m => ({ default: m.ContactPage })));

const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const ForcePasswordChangeModal = lazy(() => import('./components/ForcePasswordChangeModal').then(m => ({ default: m.ForcePasswordChangeModal })));

import { PropertyFilters } from './types';

export type AppView = 
  | 'home'
  | 'search'
  | 'property-details'
  | 'student-dashboard'
  | 'agent-dashboard'
  | 'agent-create-property'
  | 'agent-edit-property'
  | 'admin-dashboard'
  | 'admin-agents'
  | 'admin-properties'
  | 'admin-reports'
  | 'admin-account'
  | 'about'
  | 'faq'
  | 'contact';

function MainAppContent() {
  const { user, profile } = useAuth();
  
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<PropertyFilters>({});

  // Auth Modal controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'student_register' | 'agent_register' | 'admin_login'>('login');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);
  const [adminInitialTab, setAdminInitialTab] = useState<'users' | 'agents'>('users');

  const handleOpenAuth = (
    mode: 'login' | 'student_register' | 'agent_register' | 'admin_login' = 'login',
    prompt?: string
  ) => {
    setAuthModalMode(mode);
    setAuthPromptMessage(prompt);
    setAuthModalOpen(true);
  };

  const handleNavigateSearch = (filters?: PropertyFilters) => {
    if (filters) {
      setSearchFilters(filters);
    }
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setCurrentView('property-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateEdit = (propertyId: string) => {
    setEditingPropertyId(propertyId);
    setCurrentView('agent-edit-property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderProtectedView = (requiredRole: 'student' | 'agent' | 'admin', component: React.ReactNode) => {
    if (!user || profile?.role !== requiredRole) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto font-bold text-xl">
            🔒
          </div>
          <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
          <p className="text-xs text-gray-500">
            This dashboard requires an authenticated <span className="font-bold uppercase text-gray-800">{requiredRole}</span> account on CampusNest.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => handleOpenAuth('login')}
              className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700"
            >
              Sign In as {requiredRole.toUpperCase()}
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="w-full py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return component;
  };

  const [adminSection, setAdminSection] = useState<'overview' | 'users' | 'properties' | 'reports' | 'account'>('overview');

  // Sync adminSection with currentView
  React.useEffect(() => {
    if (currentView === 'admin-dashboard') setAdminSection('overview');
    else if (currentView === 'admin-agents') setAdminSection('users');
    else if (currentView === 'admin-properties') setAdminSection('properties');
    else if (currentView === 'admin-reports') setAdminSection('reports');
    else if (currentView === 'admin-account') setAdminSection('account');
  }, [currentView]);

  // Route admin directly to admin dashboard if on home view
  React.useEffect(() => {
    if (user && profile?.role === 'admin' && currentView === 'home') {
      setCurrentView('admin-dashboard');
      setAdminSection('overview');
    }
  }, [user, profile?.role]);

  // Dedicated Admin Interface Layout (Isolated from public navigation)
  const isAdminArea = user && profile?.role === 'admin' && (currentView.startsWith('admin-') || currentView === 'home');

  if (isAdminArea) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans antialiased">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <AdminLayout
            currentSection={adminSection}
            onNavigateSection={(sec) => {
              setAdminSection(sec);
              if (sec === 'overview') setCurrentView('admin-dashboard');
              else if (sec === 'users') setCurrentView('admin-agents');
              else if (sec === 'properties') setCurrentView('admin-properties');
              else if (sec === 'reports') setCurrentView('admin-reports');
              else if (sec === 'account') setCurrentView('admin-account');
            }}
          >
            {adminSection === 'overview' && (
              <AdminDashboard
                onNavigateAgents={() => {
                  setAdminInitialTab('agents');
                  setAdminSection('users');
                  setCurrentView('admin-agents');
                }}
                onNavigateUsers={() => {
                  setAdminInitialTab('users');
                  setAdminSection('users');
                  setCurrentView('admin-agents');
                }}
                onNavigateReports={() => {
                  setAdminSection('reports');
                  setCurrentView('admin-reports');
                }}
                onNavigateProperties={() => {
                  setAdminSection('properties');
                  setCurrentView('admin-properties');
                }}
                onSelectProperty={handleSelectProperty}
              />
            )}

            {adminSection === 'users' && (
              <AdminAgentManagement
                initialTab={adminInitialTab}
                onBack={() => {
                  setAdminSection('overview');
                  setCurrentView('admin-dashboard');
                }}
              />
            )}

            {adminSection === 'properties' && (
              <AdminPropertyManagement
                onBack={() => {
                  setAdminSection('overview');
                  setCurrentView('admin-dashboard');
                }}
                onSelectProperty={handleSelectProperty}
              />
            )}

            {adminSection === 'reports' && (
              <AdminReportsModeration
                onBack={() => {
                  setAdminSection('overview');
                  setCurrentView('admin-dashboard');
                }}
                onSelectProperty={handleSelectProperty}
              />
            )}

            {adminSection === 'account' && (
              <AdminAccountProfile />
            )}
          </AdminLayout>
        </Suspense>

        {/* Lazy Modals */}
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModalOpen}
            initialMode={authModalMode}
            promptMessage={authPromptMessage}
            onClose={() => {
              setAuthModalOpen(false);
              setAuthPromptMessage(undefined);
            }}
            onSuccess={(role) => {
              setAuthPromptMessage(undefined);
              if (role === 'admin') setCurrentView('admin-dashboard');
              else if (role === 'agent') setCurrentView('agent-dashboard');
              else if (role === 'student') setCurrentView('student-dashboard');
              else setCurrentView('home');
            }}
          />
          <ForcePasswordChangeModal />
        </Suspense>
      </div>
    );
  }

  // Public / Student / Agent Layout (Shared Navbar & Footer)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* Global Navigation Header (shows role-appropriate actions) */}
      <Navbar
        currentView={currentView}
        onNavigate={handleViewChange}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Render */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {currentView === 'home' && (
            <LandingPage
              onSearch={handleNavigateSearch}
              onSelectProperty={handleSelectProperty}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {currentView === 'search' && (
            <SearchResultsPage
              initialFilters={searchFilters}
              onSelectProperty={handleSelectProperty}
            />
          )}

          {currentView === 'property-details' && selectedPropertyId && (
            <PropertyDetailsPage
              propertyId={selectedPropertyId}
              onBack={() => setCurrentView('search')}
              onSelectProperty={handleSelectProperty}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {currentView === 'student-dashboard' && renderProtectedView('student', (
            <StudentDashboard
              onSelectProperty={handleSelectProperty}
              onNavigateSearch={() => handleNavigateSearch()}
            />
          ))}

          {currentView === 'agent-dashboard' && renderProtectedView('agent', (
            <AgentDashboard
              onNavigateCreate={() => handleViewChange('agent-create-property')}
              onNavigateEdit={handleNavigateEdit}
              onSelectProperty={handleSelectProperty}
            />
          ))}

          {currentView === 'agent-create-property' && renderProtectedView('agent', (
            <AgentCreateProperty
              onBack={() => setCurrentView('agent-dashboard')}
              onSuccess={() => setCurrentView('agent-dashboard')}
            />
          ))}

          {currentView === 'agent-edit-property' && editingPropertyId && renderProtectedView('agent', (
            <AgentEditProperty
              propertyId={editingPropertyId}
              onBack={() => setCurrentView('agent-dashboard')}
              onSuccess={() => setCurrentView('agent-dashboard')}
            />
          ))}

          {/* Admin fallback views if rendered within standard shell */}
          {currentView === 'admin-dashboard' && renderProtectedView('admin', (
            <AdminDashboard
              onNavigateAgents={() => {
                setAdminInitialTab('agents');
                setCurrentView('admin-agents');
              }}
              onNavigateUsers={() => {
                setAdminInitialTab('users');
                setCurrentView('admin-agents');
              }}
              onNavigateReports={() => setCurrentView('admin-reports')}
              onNavigateProperties={() => setCurrentView('admin-properties')}
              onSelectProperty={handleSelectProperty}
            />
          ))}

          {currentView === 'admin-agents' && renderProtectedView('admin', (
            <AdminAgentManagement
              initialTab={adminInitialTab}
              onBack={() => setCurrentView('admin-dashboard')}
            />
          ))}

          {currentView === 'admin-properties' && renderProtectedView('admin', (
            <AdminPropertyManagement
              onBack={() => setCurrentView('admin-dashboard')}
              onSelectProperty={handleSelectProperty}
            />
          ))}

          {currentView === 'admin-reports' && renderProtectedView('admin', (
            <AdminReportsModeration
              onBack={() => setCurrentView('admin-dashboard')}
              onSelectProperty={handleSelectProperty}
            />
          ))}

          {currentView === 'admin-account' && renderProtectedView('admin', (
            <AdminAccountProfile />
          ))}

          {currentView === 'about' && <AboutPage />}
          {currentView === 'faq' && <FaqPage />}
          {currentView === 'contact' && <ContactPage />}
        </Suspense>
      </main>

      {/* Global Footer (shown for public website visitors, students, and agents) */}
      <Footer
        onNavigate={handleViewChange}
        onOpenAuth={handleOpenAuth}
      />

      {/* Lazy Modals */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          promptMessage={authPromptMessage}
          onClose={() => {
            setAuthModalOpen(false);
            setAuthPromptMessage(undefined);
          }}
          onSuccess={(role) => {
            setAuthPromptMessage(undefined);
            if (currentView === 'property-details' && selectedPropertyId) {
              return;
            }
            if (role === 'admin') setCurrentView('admin-dashboard');
            else if (role === 'agent') setCurrentView('agent-dashboard');
            else if (role === 'student') setCurrentView('student-dashboard');
            else setCurrentView('home');
          }}
        />

        <ForcePasswordChangeModal />
      </Suspense>

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
