import React, { useState } from 'react';
import { Property } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { OptimizedImage } from './OptimizedImage';
import { Heart, MapPin, ShieldCheck, Bed, Bath, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect: (propertyId: string) => void;
  initialIsSaved?: boolean;
  onSaveToggle?: (propertyId: string, isSaved: boolean) => void;
  priority?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  initialIsSaved = false,
  onSaveToggle,
  priority = false,
}) => {
  const { user, profile } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || profile?.role !== 'student') {
      alert('Please sign in as a student to save favorite listings.');
      return;
    }

    try {
      setSaveLoading(true);
      const newSavedState = await propertyService.toggleSaveProperty(user.id, property.id);
      setIsSaved(newSavedState);
      if (onSaveToggle) onSaveToggle(property.id, newSavedState);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const isAgentVerified = property.agent?.agent_profile?.verification_status === 'verified';
  const rawCover = property.cover_image_url || property.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=320&q=65';

  return (
    <div 
      onClick={() => onSelect(property.id)}
      className="group bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
    >
      {/* Property Cover Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
        <OptimizedImage
          src={rawCover}
          alt={property.title}
          width={320}
          height={240}
          quality={65}
          fit="cover"
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px)"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Property Type Badge */}
            <span className="px-2.5 py-1 text-xs font-semibold bg-gray-900/80 backdrop-blur-md text-white rounded-lg shadow-xs">
              {property.property_type}
            </span>

            {/* Verified Agent Badge */}
            {isAgentVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600/90 backdrop-blur-md text-white rounded-lg shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Agent
              </span>
            )}
          </div>

          {/* Save/Favorite Heart Button */}
          {user && profile?.role === 'student' && (
            <button
              onClick={handleHeartClick}
              disabled={saveLoading}
              className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
                isSaved 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:text-red-500'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save property'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Availability Badge Overlay */}
        <div className="absolute bottom-3 left-3">
          {property.availability === 'available' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-md shadow-xs">
              <CheckCircle2 className="w-3 h-3" /> Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-800 text-gray-200 rounded-md shadow-xs">
              <XCircle className="w-3 h-3" /> Rented
            </span>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Price Header */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ₦{Number(property.annual_rent).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-medium"> / year</span>
            </div>
            {property.is_negotiable && (
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Negotiable
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-base text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>

          {/* Area & Distance */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {property.area}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {property.distance_from_campus}
            </span>
          </div>
        </div>

        {/* Specs & Agent Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-gray-400" />
              {property.bedrooms} Bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-gray-400" />
              {property.bathrooms} Bath
            </span>
          </div>

          {/* Agent Avatar & Name */}
          <div className="flex items-center gap-1.5">
            <img
              src={property.agent?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(property.agent?.full_name || 'Agent')}&background=2563EB&color=fff`}
              alt={property.agent?.full_name}
              className="w-5 h-5 rounded-full object-cover border border-gray-200"
            />
            <span className="font-medium text-gray-700 truncate max-w-[100px]">
              {property.agent?.full_name || 'Verified Agent'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
