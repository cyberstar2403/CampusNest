import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters } from '../../types';
import { propertyService } from '../../services/propertyService';
import { PropertyCard } from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/LoadingSkeleton';
import { Search, Filter, SlidersHorizontal, Building2, RefreshCw, X } from 'lucide-react';

interface SearchResultsPageProps {
  initialFilters?: PropertyFilters;
  onSelectProperty: (id: string) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialFilters = {},
  onSelectProperty,
}) => {
  const [filters, setFilters] = useState<PropertyFilters>({
    keyword: '',
    area: 'all',
    propertyType: 'all',
    minPrice: undefined,
    maxPrice: undefined,
    distanceFromCampus: 'all',
    availability: 'all' as any,
    sortBy: 'newest',
    ...initialFilters,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await propertyService.getProperties(filters, page, 12);
      setProperties(res.properties);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Notice fetching property search results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [filters, page]);

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  const resetFilters = () => {
    setFilters({
      keyword: '',
      area: 'all',
      propertyType: 'all',
      minPrice: undefined,
      maxPrice: undefined,
      distanceFromCampus: 'all',
      availability: 'all' as any,
      sortBy: 'newest',
    });
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            FUW Accommodation Search
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing <span className="font-semibold text-gray-900">{totalCount}</span> verified student apartments near Federal University Wukari
          </p>
        </div>

        {/* Keyword Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            placeholder="Search title, street, area, description..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
          />
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
        
        {/* Quick Filter Selects */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Area */}
          <select
            value={filters.area || 'all'}
            onChange={(e) => handleFilterChange('area', e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Areas</option>
            <option value="Back Gate">Back Gate</option>
            <option value="Exit Gate">Exit Gate</option>
            <option value="New Site">New Site</option>
            <option value="Town">Wukari Town</option>
            <option value="Sangere">Sangere</option>
            <option value="Hospital Road">Hospital Road</option>
          </select>

          {/* Property Type */}
          <select
            value={filters.propertyType || 'all'}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Property Types</option>
            <option value="Self-Contain">Self-Contain</option>
            <option value="Single Room">Single Room</option>
            <option value="1 Bedroom Flat">1 Bedroom Flat</option>
            <option value="2 Bedroom Flat">2 Bedroom Flat</option>
            <option value="Studio">Studio</option>
          </select>

          {/* Availability */}
          <select
            value={filters.availability || 'all'}
            onChange={(e) => handleFilterChange('availability', e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Status</option>
            <option value="available">Available Only</option>
            <option value="rented">Rented</option>
          </select>

          <button
            onClick={resetFilters}
            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort By:</span>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-600"
          >
            <option value="newest">Newest First</option>
            <option value="lowest_price">Lowest Rent</option>
            <option value="highest_price">Highest Rent</option>
            <option value="most_viewed">Most Viewed</option>
            <option value="closest">Closest to Campus</option>
          </select>
        </div>

      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900">No Matching Accommodations Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            We couldn't find any verified properties matching your current filter criteria. Try expanding your price range or clearing location filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop, idx) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onSelect={onSelectProperty}
              priority={idx < 2}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl disabled:opacity-40 hover:bg-gray-50 text-gray-800"
          >
            Previous
          </button>
          <span className="text-xs text-gray-600 px-3 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-xl disabled:opacity-40 hover:bg-gray-50 text-gray-800"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};
