import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldAlert, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: 'student' | 'agent' | 'general';
}

const FAQS: FaqItem[] = [
  {
    category: 'student',
    question: 'Is CampusNest free for FUW students?',
    answer: 'Yes! Searching, filtering, and contacting agents on CampusNest is 100% free for all Federal University Wukari students.',
  },
  {
    category: 'student',
    question: 'How do I know if a property listing is genuine?',
    answer: 'Look for the green "Verified Agent" shield badge on listings. Verified agents have submitted government-issued ID (NIN / Voter\'s Card / Driver\'s License) to our moderation team.',
  },
  {
    category: 'student',
    question: 'Should I pay rent before inspecting the house?',
    answer: 'NEVER pay money online or transfer funds before inspecting the accommodation in person, testing facilities (borehole water, light, toilet), and verifying the landlord or agent.',
  },
  {
    category: 'agent',
    question: 'How can I register as a house agent on CampusNest?',
    answer: 'Click "Agent Portal" or "List Accommodation", create an agent account with your phone number and agency name, and submit your NIN or Driver\'s License for fast verification.',
  },
  {
    category: 'agent',
    question: 'What areas around FUW are covered?',
    answer: 'We cover all student residential hubs in Wukari including Back Gate, New Site, Sangere, Hospital Road, and Wukari Town.',
  },
  {
    category: 'general',
    question: 'What should I do if I spot a fake or scam listing?',
    answer: 'Click the "Report Suspicious Listing" link on any property details page. Our admin team reviews and removes fraudulent listings immediately.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'student' | 'agent'>('all');

  const filteredFaqs = FAQS.filter(
    item => activeTab === 'all' || item.category === activeTab
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Everything You Need to Know About FUW Housing
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Got questions about finding off-campus accommodation or listing your property on CampusNest? We've got answers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Questions
        </button>
        <button
          onClick={() => setActiveTab('student')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'student' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          For Students
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'agent' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          For House Agents
        </button>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-4 text-left font-bold text-sm text-gray-900 flex items-center justify-between gap-4 hover:bg-gray-50/50"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/30">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
