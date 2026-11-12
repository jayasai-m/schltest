import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectorService } from '../../services/api';
import {
  Building2,
  Droplets,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

export const InspectorSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSchools = async () => {
    try {
      const res = await inspectorService.getSchools();
      setSchools(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervised Institutions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Schools assigned under your mandal inspection jurisdiction for water safety and mid-day meal audits
          </p>
        </div>

        <button
          onClick={fetchSchools}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 max-w-md shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by school name, code, or district..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
        />
      </div>

      {filteredSchools.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 text-xs shadow-sm">
          {schools.length === 0
            ? 'No government schools have been assigned to your profile yet. Please contact the Central State Administrator.'
            : 'No schools match your search query.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchools.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                  <p className="text-[11px] font-mono text-teal-700 font-semibold mt-0.5">{s.school_code}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.district}</p>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  s.hardware_status === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {s.hardware_label}
                </span>
              </div>

              {/* Status details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Headmaster:</span>
                  <span className="font-semibold text-slate-800">{s.principal_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="text-slate-700 font-mono text-[11px]">{s.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Turbidity:</span>
                  <span className="font-semibold text-slate-900">
                    {s.latest_reading?.turbidity_ntu !== null && s.latest_reading?.turbidity_ntu !== undefined
                      ? `${s.latest_reading.turbidity_ntu} NTU`
                      : '--'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Meal Audit Status:</span>
                  <span className={`font-bold ${
                    s.verification_status_today === 'VERIFIED'
                      ? 'text-emerald-700'
                      : ['PENDING_REVIEW', 'CV_PASS'].includes(s.verification_status_today)
                      ? 'text-amber-700'
                      : ['FLAGGED', 'CV_FLAG'].includes(s.verification_status_today)
                      ? 'text-rose-700'
                      : s.verification_status_today === 'REJECTED'
                      ? 'text-rose-800'
                      : 'text-slate-500'
                  }`}>
                    {s.verification_status_today === 'VERIFIED'
                      ? 'Verified'
                      : ['PENDING_REVIEW', 'CV_PASS'].includes(s.verification_status_today)
                      ? 'Awaiting Review'
                      : ['FLAGGED', 'CV_FLAG'].includes(s.verification_status_today)
                      ? 'Flagged'
                      : s.verification_status_today === 'REJECTED'
                      ? 'Rejected'
                      : 'No Upload Yet'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-1">
                <Link
                  to={`/inspector/water?school_id=${s.id}`}
                  className="flex-1 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Water Quality</span>
                </Link>

                <Link
                  to={`/inspector/meals?school_id=${s.id}`}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Meal Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
