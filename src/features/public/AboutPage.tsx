import React from 'react';
import { Building2, ShieldCheck, MapPin, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" /> Official FUW Student Housing Platform
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Safe, Verified Off-Campus Accommodation for Federal University Wukari
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          CampusNest bridges the gap between FUW students and verified house owners & agents across Wukari, Taraba State — eliminating scams, fake photos, and excessive agent fees.
        </p>
      </div>

      {/* Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Verified Agents Only</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Every house agent on CampusNest submits valid government identity documentation (NIN or Driver's License) checked by our moderation team before getting verified.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">All Wukari Student Hubs</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            From Back Gate and New Site to Sangere, Hospital Road, and Wukari Town — easily filter listings by proximity to campus gates.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Direct Agent Contact</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            No middleman markups. Reach out directly via WhatsApp or phone call to arrange physical inspection at your convenience.
          </p>
        </div>
      </div>

      {/* Values & Guidelines */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-8 sm:p-10 rounded-3xl space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Our Student Safety Commitment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-blue-100">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Never pay rental money before physically inspecting the property.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Verify the agent's identity badge on CampusNest during your meeting.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Report suspicious listings or price discrepancies immediately.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Request official tenancy agreements signed by the property owner.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
