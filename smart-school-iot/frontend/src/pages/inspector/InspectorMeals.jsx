import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inspectorService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import {
  UtensilsCrossed,
  Check,
  AlertTriangle,
  XCircle,
  Eye,
  Building2,
  RefreshCw,
  Filter,
  Users,
  Brain,
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const InspectorMeals = () => {
  const [searchParams] = useSearchParams();
  const schoolParam = searchParams.get('school_id');

  const [data, setData] = useState({ schools: [], images: [], meals: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolParam || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchMeals = async () => {
    try {
      const params = {};
      if (selectedSchoolId) params.school_id = selectedSchoolId;
      if (statusFilter) params.status_filter = statusFilter;
      const res = await inspectorService.getMeals(params);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching meals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeals();
    const interval = setInterval(fetchMeals, 4000);
    return () => clearInterval(interval);
  }, [selectedSchoolId, statusFilter]);

  const handleReview = async (imageId, newStatus) => {
    setIsReviewing(true);
    try {
      await inspectorService.reviewImage(imageId, newStatus, reviewNotes);
      setSelectedImage(null);
      setReviewNotes('');
      fetchMeals();
    } catch (err) {
      console.error('Review action error:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'MEAL_PREPARATION') return '🥘 Meal Prep';
    if (cat === 'KITCHEN_HYGIENE')  return '🧼 Kitchen Hygiene';
    if (cat === 'STUDENT_EATING')   return '👥 Students Eating';
    return cat;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            VERIFIED
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            FLAGGED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            PENDING AUDIT
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mid-Day Meal & Kitchen Audit</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit daily food preparations, student dining counts, and kitchen sanitization across your assigned schools
          </p>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchMeals(); }}
          disabled={refreshing}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {data.schools.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Assigned Schools</option>
              {data.schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="PENDING_REVIEW" className="bg-slate-900 text-slate-200">Pending Review</option>
            <option value="VERIFIED" className="bg-slate-900 text-slate-200">Verified</option>
            <option value="FLAGGED" className="bg-slate-900 text-slate-200">Flagged</option>
            <option value="REJECTED" className="bg-slate-900 text-slate-200">Rejected</option>
          </select>
        </div>
      </div>

      {/* School-Wise Separation or Selected School Gallery */}
      {!selectedSchoolId ? (
        /* 1. Assigned Schools Directory Cards (When no school is selected) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span>Assigned Institutions – Meal Auditing</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click on any assigned school below to view photos submitted by that institution.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
              {data.schools.length} Schools in Jurisdiction
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.schools.map((s) => {
              const schoolImages = data.images.filter((img) => img.school_id === s.id);
              const totalCount = schoolImages.length;
              const pendingCount = schoolImages.filter((img) => img.status === 'PENDING_REVIEW' || img.status === 'CV_PASS' || img.status === 'CV_FLAG').length;
              const verifiedCount = schoolImages.filter((img) => img.status === 'VERIFIED').length;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSchoolId(s.id.toString())}
                  className="bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-5 shadow-lg cursor-pointer transition-all hover:bg-slate-850 hover:shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      {pendingCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {pendingCount} Pending Review
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {totalCount > 0 ? 'All Audited' : 'No Submissions'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mt-4 group-hover:text-teal-300 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      School ID: <span className="font-mono text-slate-300">#{s.id}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                      <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <span className="text-sm font-bold font-mono text-slate-200">{totalCount}</span>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                        <span className="text-[10px] text-amber-400/80 block">Pending</span>
                        <span className="text-sm font-bold font-mono text-amber-300">{pendingCount}</span>
                      </div>
                      <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                        <span className="text-[10px] text-emerald-400/80 block">Verified</span>
                        <span className="text-sm font-bold font-mono text-emerald-300">{verifiedCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:text-teal-300">
                    <span>Audit Uploaded Photos</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. School-Specific Image Gallery (When a school is clicked) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedSchoolId('')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Assigned Schools</span>
              </button>
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>{data.schools.find((s) => s.id.toString() === selectedSchoolId.toString())?.name || 'Selected Institution'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                    {data.images.length} Submissions
                  </span>
                </h2>
              </div>
            </div>

            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span>AI / CV vision pipeline active</span>
            </span>
          </div>

          {data.images.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-xs text-slate-500 italic">
              <UtensilsCrossed className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No meal photo submissions uploaded by this school yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => { setSelectedImage(img); setReviewNotes(img.admin_notes || ''); }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <img
                        src={getImageUrl(img.image_url)}
                        alt={img.meal_type || 'Meal'}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/70 backdrop-blur-md text-white uppercase">
                          {getCategoryLabel(img.category)}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(img.status)}
                      </div>

                      {/* Student count badge for student eating */}
                      {img.category === 'STUDENT_EATING' && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-600/90 text-white border border-violet-400/40 shadow">
                          👥 {img.cv_student_count != null ? `~${img.cv_student_count} students` : 'Counting students…'}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-xs font-bold text-white truncate">{img.school_name}</h3>
                      <p className="text-xs font-semibold text-teal-400 truncate">{img.meal_type || 'Mid-Day Meal'}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{img.menu_description || 'Daily Meal'}</p>

                      {/* AI & CV results badge */}
                      {img.cv_status && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-teal-400 font-bold flex items-center space-x-1">
                              <Brain className="w-3" />
                              <span>AI / CV Vision</span>
                            </span>
                            <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                              img.cv_status === 'CV_PASS' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                            }`}>
                              {img.cv_status}
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-2">{img.cv_notes}</p>
                          {img.cv_student_count !== null && img.cv_student_count !== undefined && (
                            <p className="text-teal-300 font-mono text-[10px]">
                              YOLOv8 Headcount: ~{img.cv_student_count} student(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(img.created_at).toLocaleDateString()}</span>
                    <span className="text-teal-400 font-semibold group-hover:underline flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail / Review Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{selectedImage.school_name}</h3>
                <p className="text-xs text-teal-400 font-medium">
                  {getCategoryLabel(selectedImage.category)} • Submitted by: {selectedImage.staff_name || 'School Staff'}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-80">
              <img
                src={getImageUrl(selectedImage.image_url)}
                alt="Meal Full"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Declared Menu</span>
                <p className="font-semibold text-white">{selectedImage.meal_type || 'Mid-Day Meal'}</p>
                <p className="text-slate-400">{selectedImage.menu_description || 'No description provided'}</p>
                {selectedImage.hygiene_notes && (
                  <p className="text-slate-400 pt-1 italic">Hygiene: {selectedImage.hygiene_notes}</p>
                )}
              </div>

              <div className="space-y-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Computer Vision Analysis</span>
                <p className="text-teal-400 font-semibold">{selectedImage.cv_status || 'Pending / Skipped'}</p>
                <p className="text-slate-400">{selectedImage.cv_notes || 'No CV metadata'}</p>
                {selectedImage.cv_student_count !== null && selectedImage.cv_student_count !== undefined && (
                  <p className="text-emerald-400 font-mono font-bold pt-1">
                    👥 YOLOv8 Student Count: ~{selectedImage.cv_student_count}
                  </p>
                )}
              </div>
            </div>

            {/* Verification Controls */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Field Inspector Audit Remarks / Action Notes:
              </label>
              <textarea
                rows={2}
                placeholder="Enter inspection feedback or reason for pass/flag..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
              />

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'FLAGGED')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag Submission</span>
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'REJECTED')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 disabled:opacity-50 flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'VERIFIED')}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-90 disabled:opacity-50 flex items-center space-x-1 shadow-md shadow-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
