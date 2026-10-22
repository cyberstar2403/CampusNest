import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { propertyService } from '../../services/propertyService';
import { PropertyReport } from '../../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Building2, 
  ChevronLeft,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface AdminReportsModerationProps {
  onBack: () => void;
  onSelectProperty: (propertyId: string) => void;
}

export const AdminReportsModeration: React.FC<AdminReportsModerationProps> = ({
  onBack,
  onSelectProperty,
}) => {
  const [reports, setReports] = useState<PropertyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingReports();
      setReports(data);
    } catch (err) {
      console.error('Error loading property reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDismissReport = async (reportId: string) => {
    try {
      await adminService.resolveReport(reportId, 'dismissed');
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error dismissing report:', err);
    }
  };

  const handleDeleteListing = async (reportId: string, propertyId: string) => {
    if (!window.confirm('Delete this reported property listing permanently from CampusNest?')) {
      return;
    }
    try {
      await propertyService.deleteProperty(propertyId);
      await adminService.resolveReport(reportId, 'property_removed');
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error deleting reported property:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-xl font-bold text-gray-900">Student Scam & Quality Reports</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">Zero Unresolved Student Reports</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            All submitted property flags and scam reports have been moderated. FUW student accommodation search is secure!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-md uppercase tracking-wider">
                      {report.reason.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      Submitted: {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    "{report.description}"
                  </p>

                  <p className="text-[11px] text-gray-500">
                    Reported by: <span className="font-semibold text-gray-800">{report.reporter?.full_name || 'Anonymous Student'}</span>
                  </p>
                </div>

                {/* Property Target */}
                {report.property && (
                  <div
                    onClick={() => onSelectProperty(report.property_id)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-3 cursor-pointer shrink-0 sm:w-64"
                  >
                    <img
                      src={report.property.cover_image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                      alt={report.property.title}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="overflow-hidden space-y-0.5">
                      <div className="text-xs font-bold text-gray-900 truncate">{report.property.title}</div>
                      <div className="text-[10px] text-blue-600 font-bold">₦{Number(report.property.annual_rent).toLocaleString()}/yr</div>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 text-xs font-semibold">
                <button
                  onClick={() => handleDismissReport(report.id)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                >
                  Dismiss Report
                </button>

                <button
                  onClick={() => handleDeleteListing(report.id, report.property_id)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Fraudulent Listing
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
