import React, { useState } from 'react';
import { PropertyArea, PropertyType } from '../../types';
import { propertyService } from '../../services/propertyService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  Upload, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  X, 
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

interface AgentCreatePropertyProps {
  onBack: () => void;
  onSuccess: () => void;
}

const COMMON_FACILITIES = [
  'Borehole / Constant Water',
  'Fenced & Secured Gate',
  'Fully Tiled Floor',
  'Prepaid Electricity Meter',
  'Personal Water Tank',
  'Interlocked Compound',
  'Security Guard',
  'Private Balcony',
  'Wardrobe Included',
  'Kitchen Cabinet'
];

export const AgentCreateProperty: React.FC<AgentCreatePropertyProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user, profile, agentProfile } = useAuth();
  
  const verificationStatus = agentProfile?.verification_status || profile?.agent_profile?.verification_status || 'unverified';
  const isSuspended = profile?.is_suspended === true || profile?.is_active === false;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Self-Contain');
  const [area, setArea] = useState<PropertyArea>('Back Gate');
  const [address, setAddress] = useState('');
  const [annualRent, setAnnualRent] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [distanceFromCampus, setDistanceFromCampus] = useState('5 mins walk from gate');
  const [additionalCharges, setAdditionalCharges] = useState('');
  
  const [facilities, setFacilities] = useState<string[]>([]);
  const [customFacility, setCustomFacility] = useState('');

  // Image Upload state
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleFacility = (facility: string) => {
    setFacilities(prev => 
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const handleAddCustomFacility = () => {
    if (customFacility.trim() && !facilities.includes(customFacility.trim())) {
      setFacilities(prev => [...prev, customFacility.trim()]);
      setCustomFacility('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    if (images.length + files.length > 10) {
      setError('You can upload a maximum of 10 photos per accommodation listing.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          continue;
        }
        setUploadStatus(`Optimizing & uploading photo ${i + 1} of ${files.length}...`);
        const url = await storageService.uploadPropertyImage(user.id, file);
        newUrls.push(url);
      }

      setImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image. You can also paste image URLs directly.');
    } finally {
      setUploading(false);
      setUploadStatus(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() && !images.includes(imageUrlInput.trim())) {
      setImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (verificationStatus !== 'verified') {
      setError('Account verification required before publishing property listing.');
      return;
    }

    if (!title.trim() || !address.trim() || !annualRent || Number(annualRent) <= 0) {
      setError('Please fill in all required fields (title, address, annual rent).');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least 1 image of the accommodation.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await propertyService.createProperty({
        agent_id: user.id,
        title: title.trim(),
        description: description.trim(),
        property_type: propertyType,
        area: area,
        address: address.trim(),
        annual_rent: Number(annualRent),
        is_negotiable: isNegotiable,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        distance_from_campus: distanceFromCampus,
        facilities: facilities,
        additional_charges: additionalCharges.trim(),
        cover_image_url: images[0],
        images: images,
        availability: 'available',
        status: 'approved', // Auto approved for prototype
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error creating property:', err);
      setError(err.message || 'Failed to publish accommodation listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuspended) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Account Suspended</h2>
        <p className="text-sm text-red-700 font-medium">
          Your agent account has been suspended. You cannot publish or manage active listings until an administrator reactivates your account.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Return to Agent Dashboard
        </button>
      </div>
    );
  }

  if (verificationStatus !== 'verified') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Verification Required</h2>
        <p className="text-sm text-gray-600">
          Account verification required before publishing property listing. Please submit your verification details in your dashboard and await approval from administrator.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Return to Agent Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200"
        >
          <ChevronLeft className="w-4 h-4" /> Cancel & Back
        </button>

        <h1 className="text-xl font-bold text-gray-900">Add New FUW Accommodation</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Basic Property Info
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">
                Accommodation Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Newly Built Self-Contain with Prepaid Meter & Water"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-800 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
                >
                  <option value="Self-Contain">Self-Contain</option>
                  <option value="Single Room">Single Room</option>
                  <option value="1 Bedroom Flat">1 Bedroom Flat</option>
                  <option value="2 Bedroom Flat">2 Bedroom Flat</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 mb-1">Location / Area around FUW</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as PropertyArea)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
                >
                  <option value="Back Gate">Back Gate</option>
                  <option value="Exit Gate">Exit Gate</option>
                  <option value="New Site">New Site</option>
                  <option value="Town">Wukari Town</option>
                  <option value="Sangere">Sangere</option>
                  <option value="Hospital Road">Hospital Road</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Off Sangere Expressway, Behind Back Gate Lodge"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the condition, security, neighborhood, power availability, and road condition..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Rent & Distance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Rent & Proximity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">
                Annual Rent (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="10000"
                value={annualRent}
                onChange={(e) => setAnnualRent(e.target.value)}
                placeholder="e.g. 180000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">Distance to Campus</label>
              <input
                type="text"
                value={distanceFromCampus}
                onChange={(e) => setDistanceFromCampus(e.target.value)}
                placeholder="e.g. 5 mins walk / 2 mins bike"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-800 mb-1">Bathrooms</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>

            <div className="col-span-full">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                Rent is negotiable
              </label>
            </div>

            <div className="col-span-full">
              <label className="block font-semibold text-gray-800 mb-1">Caution / Agency / Legal Bills (Optional)</label>
              <input
                type="text"
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(e.target.value)}
                placeholder="e.g. Caution fee: ₦10,000, Agreement: ₦15,000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-gray-900 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Facilities */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Property Facilities
          </h2>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_FACILITIES.map((fac) => (
                <button
                  type="button"
                  key={fac}
                  onClick={() => handleToggleFacility(fac)}
                  className={`p-3 rounded-xl border text-left font-semibold transition-all flex items-center justify-between ${
                    facilities.includes(fac)
                      ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{fac}</span>
                  {facilities.includes(fac) && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Custom Facility Add */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customFacility}
                onChange={(e) => setCustomFacility(e.target.value)}
                placeholder="Add extra facility (e.g. Solar Inverter)..."
                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-xs text-gray-900"
              />
              <button
                type="button"
                onClick={handleAddCustomFacility}
                className="px-4 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Image Upload */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" /> Accommodation Photos <span className="text-red-500">*</span>
          </h2>

          <div className="space-y-4 text-xs">
            {/* Direct File Selector */}
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 text-center space-y-2 bg-gray-50/50">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="font-semibold text-gray-800">Upload Photos from Device</p>
              <p className="text-[11px] text-gray-500">Supports JPG, PNG, WEBP (Max 5MB each)</p>
              
              <label className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors">
                {uploading ? (uploadStatus || 'Processing Photos...') : 'Choose Photos'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* URL Fallback */}
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl hover:bg-gray-900"
              >
                Add Link
              </button>
            </div>

            {/* Thumbnail Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Accommodation Listing'}
          </button>
        </div>

      </form>

    </div>
  );
};
