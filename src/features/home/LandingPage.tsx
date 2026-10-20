import React, { useEffect, useState } from 'react';
import { Property, PropertyFilters } from '../../types';
import { propertyService } from '../../services/propertyService';
import { PropertyCard } from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/LoadingSkeleton';
import { 
  Search, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  PhoneCall, 
  UserCheck, 
  AlertOctagon, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';

interface LandingPageProps {
  onSearch: (filters: PropertyFilters) => void;
  onSelectProperty: (id: string) => void;
  onOpenAuth: (mode?: 'login' | 'student_register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSearch, onSelectProperty, onOpenAuth }) => {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Search Bar Inputs
  const [area, setArea] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [distance, setDistance] = useState('all');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      try {
        setLoading(true);
        setError(null);

        const props = await propertyService.getFeaturedProperties(6);

        if (isMounted) {
          setFeaturedProperties(props);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load featured accommodations right now. Please try again or browse all categories below.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      area: area === 'all' ? undefined : area,
      propertyType: propertyType === 'all' ? undefined : propertyType,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      distanceFromCampus: distance === 'all' ? undefined : distance,
    });
  };

  const FAQS = [
    {
      q: 'How does CampusNest ensure property listings are verified?',
      a: 'Accommodation agents cannot publish listings freely. Every agent must submit identity verification (NIN, Government ID, selfie, office location) which is manually vetted by administrators before listing publication permissions are granted.'
    },
    {
      q: 'Do I need an account to browse apartments near Federal University Wukari?',
      a: 'No! Anyone can freely search, filter, and view apartment details, photos, and prices. A free account is only required when contacting a landlord/agent, saving favorite properties, or reporting suspicious listings.'
    },
    {
      q: 'Does CampusNest process rent payments or charge booking fees?',
      a: 'No. CampusNest connects students directly with verified agents via WhatsApp or Phone call. All rent negotiations and physical inspections occur directly between you and the agent without platform escrow or hidden fees.'
    },
    {
      q: 'What should I do if I suspect a fake or already occupied listing?',
      a: 'Every property page features a "Report Listing" button. Log in as a student and click report. Our moderation team reviews flagged listings immediately and takes necessary disciplinary actions.'
    }
  ];

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-blue-50/70 via-white to-white pt-10 pb-12 lg:pt-16 lg:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Built Exclusively for Federal University Wukari (FUW)
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Find Trusted Student Accommodation Near <span className="text-blue-600">FUW</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
              Browse verified self-contain, flat, and single-room apartments directly from identity-verified accommodation agents in Wukari.
            </p>
          </div>

          {/* SEARCH BAR CARD */}
          <div className="mt-8 lg:mt-12 max-w-4xl mx-auto bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200">
            <form onSubmit={handleHeroSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Area / Location</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                >
                  <option value="all">All FUW Areas</option>
                  <option value="Back Gate">Back Gate</option>
                  <option value="Exit Gate">Exit Gate</option>
                  <option value="New Site">New Site</option>
                  <option value="Town">Wukari Town</option>
                  <option value="Sangere">Sangere</option>
                  <option value="Hospital Road">Hospital Road</option>
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                >
                  <option value="all">All Property Types</option>
                  <option value="Self-Contain">Self-Contain</option>
                  <option value="Single Room">Single Room</option>
                  <option value="1 Bedroom Flat">1 Bedroom Flat</option>
                  <option value="2 Bedroom Flat">2 Bedroom Flat</option>
                  <option value="Studio">Studio Apartment</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Max Annual Rent (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 350000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                />
              </div>

              {/* Submit Button */}
              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search Apartments
                </button>
              </div>

            </form>
          </div>

          {/* Quick Stats Pill */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Identity-Verified Agents
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero Agency Commission Fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct Agent WhatsApp Contact
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED PROPERTIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Verified Listings</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Featured Accommodations</h2>
          </div>
          <button
            onClick={() => onSearch({})}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Explore All Listings <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-amber-50/60 rounded-2xl border border-amber-200 p-8 space-y-3">
            <Building2 className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">{error}</h3>
            <button
              onClick={() => onSearch({})}
              className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl shadow-xs hover:bg-blue-700"
            >
              Explore All Listings
            </button>
          </div>
        ) : featuredProperties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 p-8 space-y-3">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">No Verified Listings Yet</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Our accommodation agents are currently submitting new property applications. Check back shortly or browse all categories!
            </p>
            <button
              onClick={() => onSearch({})}
              className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-xl"
            >
              Browse Search Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property, idx) => (
              <PropertyCard
                key={property.id}
                property={property}
                onSelect={onSelectProperty}
                priority={idx < 2}
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <button
            onClick={() => onSearch({})}
            className="w-full py-3 bg-blue-50 text-blue-600 font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
          >
            Explore All Listings <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-gray-50 border-y border-gray-200 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">How CampusNest Works</h2>
            <p className="text-sm text-gray-600 mt-2">Finding safe off-campus accommodation near FUW takes just 4 easy steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-lg text-gray-900">Search Apartments</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Filter by price, location (Back Gate, New Site, Town), property type, and distance from campus.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-lg text-gray-900">Compare Details</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Review photos, facilities (electricity, water, security), exact location, and annual rent.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-lg text-gray-900">Contact Verified Agent</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Click to open WhatsApp with a pre-filled inspection request or make a direct phone call to the agent.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-200 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                4
              </div>
              <h3 className="font-bold text-lg text-gray-900">Inspect & Rent</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Meet the verified agent in person, physically inspect the apartment, and finalize your agreement safely.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* WHY STUDENTS TRUST CAMPUSNEST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Safety & Trust</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-1 leading-tight">
                Why FUW Students Trust CampusNest
              </h2>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Searching for apartments on informal WhatsApp groups and Facebook Marketplace often leads to scams, fake agents, and inflated prices. CampusNest solves this by enforcing platform verification.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Verified Accommodation Agents</h4>
                  <p className="text-xs text-gray-600">Only agents who submit verified Government ID and NIN can publish listings.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Pre-Approved Listings</h4>
                  <p className="text-xs text-gray-600">Administrator approval is required for every property before it appears in search results.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Student Scam Reporting</h4>
                  <p className="text-xs text-gray-600">Students can flag suspicious or occupied apartments immediately for administrative moderation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Are You An Agent?</span>
              <h3 className="text-2xl font-bold">Manage Your Property Listings On CampusNest</h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Connect with thousands of Federal University Wukari students searching for accommodation.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-2 text-xs">
              <p className="font-medium text-white">✨ Mandatory Agent Onboarding Workflow:</p>
              <ul className="space-y-1.5 text-blue-100 list-disc list-inside">
                <li>Submit agent application to platform administrator</li>
                <li>Receive login credentials & set new secure password</li>
                <li>Submit identity verification (NIN & Government ID)</li>
                <li>Publish approved listings & receive direct student inquiries</li>
              </ul>
            </div>

            <button
              onClick={() => onOpenAuth('login')}
              className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-md transition-colors"
            >
              Sign In To Agent Portal
            </button>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
