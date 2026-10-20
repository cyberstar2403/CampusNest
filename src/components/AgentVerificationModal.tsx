import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { agentService } from '../services/agentService';
import { storageService } from '../services/storageService';
import { X, ShieldCheck, Upload, FileText, Camera, Building, MapPin, CheckCircle2 } from 'lucide-react';

interface AgentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgentVerificationModal: React.FC<AgentVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, profile, agentProfile } = useAuth();

  const [agencyName, setAgencyName] = useState(agentProfile?.agency_name || '');
  const [officeAddress, setOfficeAddress] = useState(agentProfile?.office_address || '');
  const [nin, setNin] = useState(agentProfile?.nin || '');

  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nin.trim() || nin.trim().length < 10) {
      setError('Please enter a valid 11-digit National Identification Number (NIN).');
      return;
    }

    if (!govIdFile) {
      setError('Please upload a valid Government ID (National ID, Drivers License, Voters Card, Passport).');
      return;
    }

    if (!selfieFile) {
      setError('Please upload a clear selfie photo for identity match.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload private documents
      const govIdUrl = await storageService.uploadFile('agent-documents', govIdFile);
      const selfieUrl = await storageService.uploadFile('agent-documents', selfieFile);

      // 2. Submit verification application
      if (user) {
        await agentService.submitVerification(user.id, {
          governmentIdUrl: govIdUrl,
          nin: nin.trim(),
          selfieUrl: selfieUrl,
          agencyName: agencyName.trim() || undefined,
          officeAddress: officeAddress.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-blue-600 font-bold text-xl mb-1">
          <ShieldCheck className="w-6 h-6" />
          Agent Identity Verification
        </div>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Submit your official identification to become a Verified Accommodation Agent on CampusNest. Verified agents get a verification badge and can publish property listings.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Agency / Brand Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Wukari Prime Properties"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Office Address in Wukari
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="e.g. Suit 4, Back Gate Road, Wukari"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              National Identification Number (NIN) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
              placeholder="11-digit NIN"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 font-mono tracking-wider"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Gov ID Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Government ID <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-3 text-center bg-gray-50 cursor-pointer relative transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700 truncate">
                  {govIdFile ? govIdFile.name : 'Upload ID Document'}
                </p>
                <p className="text-[10px] text-gray-400">NIN Slip, Voters Card, License</p>
              </div>
            </div>

            {/* Selfie Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Selfie Photo <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-3 text-center bg-gray-50 cursor-pointer relative transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700 truncate">
                  {selfieFile ? selfieFile.name : 'Upload Headshot Selfie'}
                </p>
                <p className="text-[10px] text-gray-400">Clear face view</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
