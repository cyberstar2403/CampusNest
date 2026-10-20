import React, { useEffect, useState } from 'react';
import { Property } from '../../types';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';
import { ReportModal } from '../../components/ReportModal';
import { OptimizedImage } from '../../components/OptimizedImage';
import { formatWhatsAppNumber, formatCallNumber, formatDisplayPhone } from '../../utils/phoneUtils';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Bed, 
  Bath, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  PhoneOff,
  Heart, 
  AlertTriangle, 
  Share2, 
  ChevronLeft,
  Calendar,
  Sparkles,
  Zap,
  Droplets,
  Shield,
  Wifi,
  Car,
  Lock,
  LogIn,
  UserPlus,
  X
} from 'lucide-react';

interface PropertyDetailsPageProps {
  propertyId: string;
  onBack: () => void;
  onSelectProperty: (id: string) => void;
  onOpenAuth: (mode?: 'login' | 'student_register', prompt?: string) => void;
}

export const PropertyDetailsPage: React.FC<PropertyDetailsPageProps> = ({
  propertyId,
  onBack,
  onSelectProperty,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loginRequiredModalOpen, setLoginRequiredModalOpen] = useState(false);
  const [intendedAction, setIntendedAction] = useState<'whatsapp' | 'phone' | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProperty() {
      try {
        if (!property) {
          setLoading(true);
        }
        const data = await propertyService.getPropertyById(propertyId);
        if (isMounted && data) {
          setProperty(data);
          if (!selectedImage) {
            const cover = data.cover_image_url || data.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=68';
            setSelectedImage(cover);
          }
          
          // Record view count
          propertyService.incrementViewCount(propertyId);

          // Check if saved
          if (user && profile?.role === 'student') {
            const saved = await propertyService.isPropertySaved(user.id, propertyId);
            if (isMounted) setIsSaved(saved);
          }
        }
      } catch (err) {
        console.error('Error loading property details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProperty();
    return () => {
      isMounted = false;
    };
  }, [propertyId, user, profile]);

  // When user becomes authenticated, immediately unlock contact phone number
  useEffect(() => {
    if (user && property?.agent?.id && !property.agent.phone_number) {
      propertyService.getAgentContact(property.agent.id).then((contact) => {
        if (contact && contact.phone_number) {
          setProperty((prev) => prev ? {
            ...prev,
            agent: prev.agent ? {
              ...prev.agent,
              phone_number: contact.phone_number,
              email: contact.email || prev.agent.email,
            } : prev.agent,
          } : prev);
        }
      });
    }
  }, [user, property?.agent?.id, property?.agent?.phone_number]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-md w-1/4" />
        <div className="aspect-16/9 sm:aspect-21/9 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded-md w-3/4" />
            <div className="h-4 bg-gray-200 rounded-md w-1/2" />
            <div className="h-32 bg-gray-200 rounded-2xl w-full" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Property Not Found</h2>
        <p className="text-sm text-gray-500">The property listing you requested may have been unlisted or removed.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-xl"
        >
          Back to Search Results
        </button>
      </div>
    );
  }

  const isAgentVerified = property.agent?.agent_profile?.verification_status === 'verified';
  const coverImage = property.cover_image_url || property.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=68';
  
  const rawGallery = property.images && property.images.length > 0 
    ? property.images.map(img => img.image_url) 
    : [coverImage];

  const allImages = rawGallery.includes(coverImage) ? rawGallery : [coverImage, ...rawGallery];

  const handleToggleSave = async () => {
    if (!user || profile?.role !== 'student') {
      onOpenAuth('login');
      return;
    }
    try {
      setSaveLoading(true);
      const newState = await propertyService.toggleSaveProperty(user.id, property.id);
      setIsSaved(newState);
    } catch (err) {
      console.error('Error toggling saved property:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const rawAgentPhone = property?.agent?.phone_number;
  const waPhone = formatWhatsAppNumber(rawAgentPhone);
  const callPhone = formatCallNumber(rawAgentPhone);
  const hasAgentPhone = !!(waPhone && callPhone);

  const handleWhatsAppClick = () => {
    if (!user) {
      setIntendedAction('whatsapp');
      setLoginRequiredModalOpen(true);
      return;
    }
  };

  const handlePhoneCallClick = () => {
    if (!user) {
      setIntendedAction('phone');
      setLoginRequiredModalOpen(true);
      return;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Search
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 text-gray-600 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors relative"
            title="Share listing URL"
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-8 right-0 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap">
                Link Copied!
              </span>
            )}
          </button>

          {user && profile?.role === 'student' && (
            <button
              onClick={handleToggleSave}
              disabled={saveLoading}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                isSaved
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-red-500' : ''}`} />
              {isSaved ? 'Saved to Favorites' : 'Save Property'}
            </button>
          )}
        </div>
      </div>

      {/* Main Image Gallery */}
      <div className="space-y-3">
        <div className="relative aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden bg-gray-900 shadow-lg border border-gray-200">
          <OptimizedImage
            src={selectedImage}
            alt={property.title}
            width={800}
            quality={68}
            priority={true}
            sizes="(max-width: 1024px) 100vw, 800px)"
            className="w-full h-full object-cover"
            containerClassName="relative w-full h-full bg-gray-900"
          />

          {/* Verification Badge */}
          {isAgentVerified && (
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 backdrop-blur-md text-white font-semibold text-xs shadow-md">
              <ShieldCheck className="w-4 h-4" /> Verified Agent Listing
            </div>
          )}

          {/* Availability Badge */}
          <div className="absolute top-4 right-4">
            {property.availability === 'available' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Available Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-800 text-gray-200 font-semibold text-xs shadow-md">
                Occupied / Rented
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail Selector */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {allImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <OptimizedImage
                  src={img}
                  alt={`Thumbnail ${idx}`}
                  width={160}
                  height={120}
                  quality={65}
                  priority={false}
                  enableSrcSet={false}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-3xl font-extrabold text-gray-900">
                  ₦{Number(property.annual_rent).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 font-medium"> / year</span>
              </div>
              {property.is_negotiable && (
                <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                  Rent Negotiable
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {property.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1 text-gray-800 font-semibold">
                <MapPin className="w-4 h-4 text-blue-600" />
                {property.area}, {property.address}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                {property.distance_from_campus}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-gray-400" />
                {property.bedrooms} Bedrooms
              </span>
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-gray-400" />
                {property.bathrooms} Bathrooms
              </span>
            </div>

          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="font-bold text-lg text-gray-900">Property Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Facilities & Utilities */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Facilities & Features</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {property.facilities && property.facilities.length > 0 ? (
                property.facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 col-span-full">Standard student housing facilities included.</p>
              )}
            </div>
          </div>

          {/* Additional Charges / Note */}
          {property.additional_charges && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-xs text-amber-900 space-y-1">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Additional Bills & Charges
              </h4>
              <p>{property.additional_charges}</p>
            </div>
          )}

        </div>

        {/* Right Column: Verified Agent Card & Contact */}
        <div className="space-y-6">
          
          {/* Agent Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md space-y-6 sticky top-20">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accommodation Agent</div>

            <div className="flex items-center gap-3.5">
              <img
                src={property.agent?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(property.agent?.full_name || 'Agent')}&background=2563EB&color=fff`}
                alt={property.agent?.full_name}
                className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shadow-xs"
              />
              <div className="space-y-1">
                <h4 className="font-bold text-base text-gray-900 leading-none">
                  {property.agent?.full_name || 'Verified Agent'}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {property.agent?.agent_profile?.agency_name || 'Independent Agent'}
                </p>
                {isAgentVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    <ShieldCheck className="w-3 h-3" /> Identity Verified
                  </span>
                )}
              </div>
            </div>

            {property.agent?.agent_profile?.office_address && (
              <p className="text-xs text-gray-600 flex items-start gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{property.agent.agent_profile.office_address}</span>
              </p>
            )}

            {/* Direct Contact Actions */}
            {user ? (
              hasAgentPhone ? (
                <div className="space-y-3 pt-2">
                  {intendedAction && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Signed in! Agent contact details are unlocked.</span>
                      </div>
                      <button
                        onClick={() => setIntendedAction(null)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Agent Contact Phone</span>
                    <span className="text-sm font-extrabold text-blue-700 flex items-center justify-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      {formatDisplayPhone(rawAgentPhone)}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello, I found your apartment listing "${property.title}" on CampusNest and I'm interested in scheduling an inspection.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (property?.agent) {
                        propertyService.recordInquiry(property.id, property.agent.id, 'whatsapp');
                      }
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
                  >
                    <Phone className="w-4 h-4" />
                    Contact via WhatsApp
                  </a>

                  <a
                    href={`tel:${callPhone}`}
                    onClick={() => {
                      if (property?.agent) {
                        propertyService.recordInquiry(property.id, property.agent.id, 'phone');
                      }
                    }}
                    className="w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-bold text-sm rounded-xl border border-gray-300 transition-colors flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
                  >
                    <Phone className="w-4 h-4 text-blue-600" />
                    Direct Phone Call
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1 mt-2">
                  <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs">
                    <PhoneOff className="w-4 h-4 text-amber-600" />
                    Contact Unavailable
                  </div>
                  <p className="text-[11px] text-amber-700">
                    This agent has not provided a contact phone number yet.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3 pt-2">
                <div
                  onClick={() => {
                    setIntendedAction('phone');
                    setLoginRequiredModalOpen(true);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-center cursor-pointer transition-colors group"
                  title="Click to sign in and view phone number"
                >
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-900 uppercase tracking-wider block">Agent Contact Phone</span>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 flex items-center justify-center gap-1.5 mt-1">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    Hidden • Sign in to view
                  </span>
                </div>

                <button
                  onClick={handleWhatsAppClick}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Contact via WhatsApp
                </button>

                <button
                  onClick={handlePhoneCallClick}
                  className="w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-bold text-sm rounded-xl border border-gray-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  Direct Phone Call
                </button>

                <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1 pt-0.5">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>Login required to contact verified agent</span>
                </p>
              </div>
            )}

            {/* Report Button */}
            <div className="pt-4 border-t border-gray-100">
              {user && profile?.role === 'student' ? (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report Suspicious Listing
                </button>
              ) : (
                <p className="text-[11px] text-gray-400 text-center">
                  Notice a scam or error? <button onClick={() => onOpenAuth('login')} className="text-blue-600 font-semibold underline">Sign in as student</button> to report.
                </p>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Report Modal */}
      <ReportModal
        propertyId={property.id}
        propertyTitle={property.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Login Required Prompt Modal */}
      {loginRequiredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 text-center space-y-4">
            <button
              onClick={() => setLoginRequiredModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">Login Required</h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                Please log in or create an account to contact this landlord or agent.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setLoginRequiredModalOpen(false);
                  onOpenAuth('login', 'Please log in to contact this landlord or agent.');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In
              </button>

              <button
                onClick={() => {
                  setLoginRequiredModalOpen(false);
                  onOpenAuth('student_register', 'Please create an account to contact this landlord or agent.');
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" /> Create Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
