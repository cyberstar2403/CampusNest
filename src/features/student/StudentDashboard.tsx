import React, { useEffect, useState } from 'react';
import { Property } from '../../types';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';
import { PropertyCard } from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/LoadingSkeleton';
import { Heart, Search, User, ShieldCheck, Building2, Bell } from 'lucide-react';

interface StudentDashboardProps {
  onSelectProperty: (id: string) => void;
  onNavigateSearch: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectProperty,
  onNavigateSearch,
}) => {
  const { user, profile } = useAuth();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSaved = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setLoadError(null);
      const props = await propertyService.getStudentSavedProperties(user.id);
      setSavedProperties(props || []);
    } catch {
      setLoadError('Unable to load your saved properties at the moment.');
      setSavedProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-700/50 text-blue-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FUW Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.full_name || 'Student'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Browse verified FUW off-campus accommodation listings, bookmark your favorite apartments, and directly message verified agents.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onNavigateSearch}
            className="px-5 py-2.5 bg-white text-blue-900 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-md flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            Explore Properties
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{savedProperties.length}</div>
            <div className="text-xs text-gray-500 font-medium">Saved Properties</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <div className="text-xs text-gray-500 font-medium">Verified Agent Direct</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">FUW Wukari</div>
            <div className="text-xs text-gray-500 font-medium">Taraba State Campus</div>
          </div>
        </div>
      </div>

      {/* Saved Properties Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            Saved Accommodations ({savedProperties.length})
          </h2>
          {savedProperties.length > 0 && (
            <button
              onClick={onNavigateSearch}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Find More Properties &rarr;
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        ) : loadError ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
            <p className="text-sm text-gray-600">{loadError}</p>
            <button
              onClick={() => loadSaved()}
              className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : savedProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
            <Heart className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No Bookmarked Properties Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You haven't saved any off-campus apartments yet. Click the heart icon on any listing to bookmark it here for fast access.
            </p>
            <button
              onClick={onNavigateSearch}
              className="px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs"
            >
              Browse FUW Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((prop, idx) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onSelect={onSelectProperty}
                priority={idx < 2}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
