import React from 'react';
import { Building2, ShieldCheck, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate?: (view: any) => void;
  setCurrentView?: (view: any) => void;
  onOpenAuth?: (mode?: 'login' | 'student_register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, setCurrentView, onOpenAuth }) => {
  const navigateTo = (view: string) => {
    const handler = onNavigate || setCurrentView;
    if (handler) handler(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">CampusNest</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              The verified student accommodation platform for Federal University Wukari (FUW). Connecting students directly with verified accommodation agents safely.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Agent Identity Verified Platform
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('search')} className="hover:text-white transition-colors">
                  Search Accommodation
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition-colors">
                  About CampusNest
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('faq')} className="hover:text-white transition-colors">
                  FAQ & Safety Tips
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Locations & Areas */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">FUW Areas</h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>FUW Back Gate</li>
              <li>New Site Area</li>
              <li>Wukari Town Center</li>
              <li>Sangere Extension</li>
              <li>Hospital Road</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Contact & Support</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Federal University Wukari, Katsina-Ala Road, Wukari, Taraba State</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@campusnest.ng" className="hover:text-white transition-colors">
                  support@campusnest.ng
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>08126505066 (+234 812 650 5066)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} CampusNest FUW. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Anti-Scam Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
