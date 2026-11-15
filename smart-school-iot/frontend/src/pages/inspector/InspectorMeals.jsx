import React, { useEffect, useState } from 'react';
import { inspectorService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import { MdmMenuModal } from '../../components/MdmMenuModal';
import {
  UtensilsCrossed,
  Check,
  AlertTriangle,
  XCircle,
  Eye,
  Building2,
  RefreshCw,
  Filter,
  Brain,
  X,
  ArrowLeft,
  ArrowRight,
  Users
} from 'lucide-react';

export const InspectorMeals = () => {
  const [data, setData] = useState({ schools: [], images: [], meals: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
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
    const interval = setInterval(fetchMeals, 5000);
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
    if (cat === 'MEAL_PREPARATION') return 'Meal Prep';
    if (cat === 'KITCHEN_HYGIENE')  return 'Kitchen Hygiene';
    if (cat === 'STUDENT_EATING')   return 'Students Eating (Min 8 Angles)';
    return cat;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            VERIFIED
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            FLAGGED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            PENDING AUDIT
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mid-Day Meal & Kitchen Audit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit daily food preparations, student dining counts, and kitchen sanitization across your assigned schools
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMenuModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            title="View 2025 AP Mid-Day Meal Menu (Zones 1-4)"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>MDM Menu 2025</span>
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchMeals(); }}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {data.schools.length > 0 && (
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-xs">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Assigned Schools</option>
              {data.schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-xs">
          <Filter className="w-4 h-4 text-teal-600 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="FLAGGED">Flagged</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* School-Wise Separation or Selected School Gallery */}
      {!selectedSchoolId ? (
        /* 1. Assigned Schools Directory Cards (When no school is selected) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span>Assigned Institutions – Meal Auditing</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click on any assigned school below to view photos submitted by that institution.
              </p>
            </div>
            <span className="text-xs text-slate-600 font-mono bg-white border border-slate-200 px-3 py-1 rounded-lg">
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
                  className="bg-white border border-slate-200 hover:border-teal-500 rounded-xl p-5 shadow-xs cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                        <Building2 className="w-5 h-5" />
                      </div>
                      {pendingCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {pendingCount} Pending Review
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {totalCount > 0 ? 'All Audited' : 'No Submissions'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-teal-700 transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      School ID: <span className="font-mono text-slate-700">#{s.id}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <span className="text-sm font-bold font-mono text-slate-800">{totalCount}</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <span className="text-[10px] text-amber-700 block">Pending</span>
                        <span className="text-sm font-bold font-mono text-amber-700">{pendingCount}</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <span className="text-[10px] text-emerald-700 block">Verified</span>
                        <span className="text-sm font-bold font-mono text-emerald-700">{verifiedCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-800">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedSchoolId('')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Assigned Schools</span>
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>{data.schools.find((s) => s.id.toString() === selectedSchoolId.toString())?.name || 'Selected Institution'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                    {data.images.length} Submissions
                  </span>
                </h2>
              </div>
            </div>

            <span className="text-xs text-slate-500 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-teal-600" />
              <span>Automated vision pipeline active</span>
            </span>
          </div>

          {data.images.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-xs text-slate-500 italic">
              <UtensilsCrossed className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>No meal photo submissions uploaded by this school yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => { setSelectedImage(img); setReviewNotes(img.admin_notes || ''); }}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={getImageUrl(img.image_url)}
                        alt={img.meal_type || 'Meal'}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/95 text-slate-800 border border-slate-200 shadow-xs uppercase">
                          {getCategoryLabel(img.category)}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        {img.cv_match_percentage != null && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shadow-xs ${
                            img.cv_match_percentage >= 80 ? 'bg-emerald-600 text-white border-emerald-700' :
                            img.cv_match_percentage >= 50 ? 'bg-amber-500 text-white border-amber-600' :
                            'bg-rose-500 text-white border-rose-600'
                          }`}>
                            {Math.round(img.cv_match_percentage)}% Match
                          </span>
                        )}
                        {getStatusBadge(img.status)}
                      </div>

                      {/* Student count badge for student eating */}
                      {img.category === 'STUDENT_EATING' && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/90 text-white shadow-xs flex items-center space-x-1">
                          <Users className="w-3 h-3 text-teal-400" />
                          <span>{img.cv_student_count != null ? `${img.cv_student_count} students` : 'Counting students…'}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{img.school_name}</h3>
                      <p className="text-xs font-semibold text-teal-800 truncate">{img.meal_type || 'Mid-Day Meal'}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{img.menu_description || 'Daily Meal'}</p>

                      {/* AI & CV results badge */}
                      {img.cv_status && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-teal-800 font-bold flex items-center space-x-1">
                              <Brain className="w-3" />
                              <span>Automated Analysis</span>
                            </span>
                            <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                              img.cv_status === 'CV_PASS' ? 'text-emerald-800 bg-emerald-100' : 'text-amber-800 bg-amber-100'
                            }`}>
                              {img.cv_status}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{img.cv_notes}</p>
                          {img.cv_student_count !== null && img.cv_student_count !== undefined && (
                            <p className="text-teal-800 font-mono text-[10px]">
                              Headcount: {img.cv_student_count} student(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(img.created_at).toLocaleDateString()}</span>
                    <span className="text-teal-700 font-semibold group-hover:underline flex items-center space-x-1">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedImage.school_name}</h3>
                <p className="text-xs text-teal-800 font-medium">
                  {getCategoryLabel(selectedImage.category)} • Submitted by: {selectedImage.staff_name || 'School Staff'}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-80 border border-slate-200 flex items-center justify-center">
              <img
                src={getImageUrl(selectedImage.image_url)}
                alt="Meal Full"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Declared Menu</span>
                <p className="font-semibold text-slate-900">{selectedImage.meal_type || 'Mid-Day Meal'}</p>
                <p className="text-slate-600">{selectedImage.menu_description || 'No description provided'}</p>
                {selectedImage.hygiene_notes && (
                  <p className="text-slate-500 pt-1 italic">Hygiene: {selectedImage.hygiene_notes}</p>
                )}
              </div>

              <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Automated Analysis</span>
                  {selectedImage.cv_match_percentage != null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedImage.cv_match_percentage >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      selectedImage.cv_match_percentage >= 50 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {Math.round(selectedImage.cv_match_percentage)}% Match
                    </span>
                  )}
                </div>
                <p className="text-teal-800 font-semibold">{selectedImage.cv_status || 'Pending / Skipped'}</p>
                <p className="text-slate-600">{selectedImage.cv_notes || 'No CV metadata'}</p>
                {selectedImage.cv_student_count !== null && selectedImage.cv_student_count !== undefined && (
                  <p className="text-emerald-800 font-mono font-bold pt-1">
                    Student Count: {selectedImage.cv_student_count}
                  </p>
                )}
              </div>
            </div>

            {/* Verification Controls */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Field Inspector Audit Remarks / Action Notes:
              </label>
              <textarea
                rows={2}
                placeholder="Enter inspection feedback or reason for pass/flag..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 resize-none"
              />

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'FLAGGED')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Flag Submission</span>
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'REJECTED')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'VERIFIED')}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 flex items-center space-x-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <MdmMenuModal
        isOpen={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        defaultZone={2}
      />
    </div>
  );
};
