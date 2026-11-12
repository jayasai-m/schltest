import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inspectorService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import {
  Building2,
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wifi,
  ArrowRight,
  RefreshCw,
  Check
} from 'lucide-react';

export const InspectorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await inspectorService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleReview = async (imageId, status) => {
    setReviewLoading(true);
    setActionSuccess('');
    try {
      await inspectorService.reviewImage(imageId, status, reviewNotes || `Verified by Field Inspector`);
      setActionSuccess(`Image submission #${imageId} successfully marked as ${status}!`);
      setReviewingId(null);
      setReviewNotes('');
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { stats, schools_overview, recent_images } = data || {
    stats: {},
    schools_overview: [],
    recent_alerts: [],
    recent_images: []
  };

  const pendingImages = (recent_images || []).filter((img) =>
    ['PENDING_REVIEW', 'CV_PASS', 'CV_FLAG'].includes(img.status)
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Field Inspector Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervise assigned government institutions, monitor water quality & kitchen telemetry, and audit daily mid-day meals
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Schools</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total_assigned_schools || 0}</p>
          <span className="text-[11px] text-teal-700 font-medium">Under Supervision</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ESP32 Online</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.hardware_connected || 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Transmitting Nodes</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Today</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.verified_today || 0}</p>
          <span className="text-[11px] text-teal-700 font-medium">Schools Compliant</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Audit</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.pending_meal_reviews || 0}</p>
          <span className="text-[11px] text-amber-700 font-medium">Meal Submissions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Alarms</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.active_alerts || 0}</p>
          <span className="text-[11px] text-rose-700 font-medium">Requires Attention</span>
        </div>
      </div>

      {/* Assigned Institutions Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Assigned Government Schools ({schools_overview.length})</span>
          </h2>
          <Link to="/inspector/schools" className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {schools_overview.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Schools Assigned to Your Account Yet</p>
            <p className="text-xs text-slate-400 mt-1">
              The Central State Administrator will assign specific government schools to your inspection jurisdiction.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools_overview.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                    <p className="text-[10px] font-mono text-teal-700 font-semibold mt-0.5">{s.school_code}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.district}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                    s.hardware_status === 'CONNECTED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {s.hardware_label}
                  </span>
                </div>

                {/* Telemetry info */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Turbidity:</span>
                    <span className="font-semibold text-slate-900">
                      {s.latest_reading?.turbidity_ntu !== null && s.latest_reading?.turbidity_ntu !== undefined
                        ? `${s.latest_reading.turbidity_ntu} NTU`
                        : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Kitchen Humidity:</span>
                    <span className="font-semibold text-slate-900">
                      {s.latest_reading?.humidity_pct !== null && s.latest_reading?.humidity_pct !== undefined
                        ? `${s.latest_reading.humidity_pct}%`
                        : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Meal Status:</span>
                    <span className={`font-semibold ${
                      s.verification_status === 'VERIFIED'
                        ? 'text-emerald-700'
                        : ['PENDING_REVIEW', 'CV_PASS'].includes(s.verification_status)
                        ? 'text-amber-700'
                        : ['FLAGGED', 'CV_FLAG'].includes(s.verification_status)
                        ? 'text-rose-700'
                        : s.verification_status === 'REJECTED'
                        ? 'text-rose-800'
                        : 'text-slate-500'
                    }`}>
                      {s.verification_status === 'VERIFIED'
                        ? 'Verified'
                        : ['PENDING_REVIEW', 'CV_PASS'].includes(s.verification_status)
                        ? 'Awaiting Review'
                        : ['FLAGGED', 'CV_FLAG'].includes(s.verification_status)
                        ? 'Flagged for Review'
                        : s.verification_status === 'REJECTED'
                        ? 'Rejected'
                        : 'No Upload Yet'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Principal: {s.principal_name}</span>
                  <Link
                    to={`/inspector/water?school_id=${s.id}`}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1"
                  >
                    <span>View Water Quality</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mid-Day Meal Pending Review Desk */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            <span>Inspection Action Desk: Submissions Awaiting Audit ({pendingImages.length})</span>
          </h2>
          <Link to="/inspector/meals" className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1">
            <span>Full Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingImages.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500 shadow-xs">
            All meal & kitchen hygiene photo submissions from your assigned schools are verified.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingImages.slice(0, 6).map((img) => (
              <div
                key={img.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-100">
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={img.meal_type || 'Meal'}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/95 text-slate-800 border border-slate-200 uppercase">
                      {img.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{img.school_name}</h4>
                    <p className="text-[11px] text-teal-800 font-semibold truncate">{img.meal_type || 'Mid-Day Meal'}</p>
                    <p className="text-[10px] text-slate-500 truncate">Menu: {img.menu_description || 'Daily Meal'}</p>
                  </div>

                  {img.cv_notes && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-700">
                      <span className="text-teal-800 font-bold block">Automated Insight:</span>
                      <span className="text-slate-600">{img.cv_notes}</span>
                    </div>
                  )}
                </div>

                {/* Verification Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {reviewingId === img.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Add review notes (optional)..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                      />
                      <div className="flex space-x-1.5">
                        <button
                          disabled={reviewLoading}
                          onClick={() => handleReview(img.id, 'VERIFIED')}
                          className="flex-1 py-1.5 rounded-lg bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700"
                        >
                          Verify
                        </button>
                        <button
                          disabled={reviewLoading}
                          onClick={() => handleReview(img.id, 'FLAGGED')}
                          className="flex-1 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs hover:bg-amber-100"
                        >
                          Flag
                        </button>
                        <button
                          onClick={() => setReviewingId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReview(img.id, 'VERIFIED')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Verify</span>
                      </button>
                      <button
                        onClick={() => setReviewingId(img.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
