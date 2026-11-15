import React, { useEffect, useState } from 'react';
import { adminService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
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
  Users,
  Brain,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const AdminMeals = () => {
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
      const res = await adminService.getMeals(params);
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
      await adminService.reviewImage(imageId, newStatus, reviewNotes);
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

  const statusPill = (status) => {
    const map = {
      VERIFIED:       'bg-emerald-50 text-emerald-800 border-emerald-200',
      CV_PASS:        'bg-emerald-50 text-emerald-700 border-emerald-200',
      FLAGGED:        'bg-amber-50 text-amber-800 border-amber-200',
      CV_FLAG:        'bg-rose-50 text-rose-700 border-rose-200',
      REJECTED:       'bg-rose-50 text-rose-800 border-rose-200',
      PENDING_REVIEW: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const cardBorder = (img) => {
    if (img.status === 'CV_FLAG' || img.status === 'FLAGGED') return 'border-rose-300';
    if (img.status === 'CV_PASS' || img.status === 'VERIFIED') return 'border-emerald-300';
    return 'border-slate-200 hover:border-slate-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const { schools, images } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mid-Day Meal & Kitchen Hygiene</h1>
          <p className="text-xs text-slate-500 mt-1">
            Photo verification • Food quality check • Student attendance count • Administrator review
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          {/* School filter */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
            <Building2 className="w-4 h-4 text-teal-600" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
            <Filter className="w-4 h-4 text-teal-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="CV_PASS">CV: Passed</option>
              <option value="CV_FLAG">CV: Flagged</option>
              <option value="VERIFIED">Admin Verified</option>
              <option value="FLAGGED">Admin Flagged</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* School-Wise Separation or Selected School Gallery */}
      {!selectedSchoolId ? (
        /* 1. School Directory Cards (When no school is selected) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span>Institutions & Meal Monitoring Directory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click on any school below to view photos uploaded by that institution.
              </p>
            </div>
            <span className="text-xs text-slate-600 font-mono bg-white border border-slate-200 px-3 py-1 rounded-lg">
              {schools.length} Active Institutions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schools.map((s) => {
              const schoolImages = images.filter((img) => img.school_id === s.id);
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
                          {totalCount > 0 ? 'All Reviewed' : 'No Submissions'}
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
                    <span>View Uploaded Photos</span>
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
                <span>Back to All Schools</span>
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>{schools.find((s) => s.id.toString() === selectedSchoolId.toString())?.name || 'Selected Institution'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                    {images.length} Submissions
                  </span>
                </h2>
              </div>
            </div>

            <span className="text-xs text-slate-500 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-teal-600" />
              <span>Automated analysis active for Meal Prep & Student Eating</span>
            </span>
          </div>

          {images.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-xs text-slate-500 italic">
              <UtensilsCrossed className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p>No meal photo submissions uploaded by this school yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-colors ${cardBorder(img)}`}
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden group">
                      <img
                        src={getImageUrl(img.image_url)}
                        alt="Submission"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => { setSelectedImage(img); setReviewNotes(img.admin_notes || ''); }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Inspect Full Photo</span>
                        </button>
                      </div>

                      {/* Category badge */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-slate-800 border border-slate-200 shadow-xs">
                        {getCategoryLabel(img.category)}
                      </span>

                      {/* Status pill */}
                      {(() => {
                        const isZeroStudents = img.category === 'STUDENT_EATING' && (img.cv_student_count === 0 || img.cv_student_count === '0');
                        const effectiveStatus = (isZeroStudents && img.status === 'CV_PASS') ? 'CV_FLAG' : img.status;
                        return (
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusPill(effectiveStatus)}`}>
                            {effectiveStatus}
                          </span>
                        );
                      })()}

                      {/* Student count badge */}
                      {img.category === 'STUDENT_EATING' && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900/90 text-white flex items-center space-x-1 shadow-xs">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          <span>
                            {img.cv_student_count != null
                              ? `${img.cv_student_count} students`
                              : (img.status === 'PENDING_REVIEW' ? 'Counting students…' : '0 students')}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm truncate">{img.school_name || 'School'}</span>
                        <div className="flex items-center space-x-1.5">
                          {img.cv_match_percentage != null && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              img.cv_match_percentage >= 80 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              img.cv_match_percentage >= 50 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {Math.round(img.cv_match_percentage)}% Match
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(img.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {img.meal_type && <p className="text-teal-800 font-medium">Menu: {img.meal_type}</p>}

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                        <div>Staff: <span className="text-slate-800 font-medium">{img.staff_name || '--'}</span></div>
                        <div>Shift: <span className="text-slate-800 font-medium">{img.inspection_shift || '--'}</span></div>
                      </div>

                      {/* CV inline note */}
                      {img.cv_notes && (
                        <div className={`mt-1.5 px-2.5 py-2 rounded-lg border text-[11px] ${
                          (img.cv_status === 'CV_PASS' && !(img.category === 'STUDENT_EATING' && (img.cv_student_count === 0 || img.cv_student_count === '0')))
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : (img.cv_status === 'CV_FLAG' || (img.category === 'STUDENT_EATING' && (img.cv_student_count === 0 || img.cv_student_count === '0')))
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          <span className="font-semibold">Analysis: </span>{img.cv_notes}
                        </div>
                      )}

                      {img.admin_notes && (
                        <p className="text-[11px] text-teal-900 bg-teal-50 p-2 rounded-lg border border-teal-200">
                          Admin Note: {img.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => { setSelectedImage(img); setReviewNotes(img.admin_notes || ''); }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleReview(img.id, 'VERIFIED')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" /><span>Verify</span>
                    </button>
                    <button
                      onClick={() => handleReview(img.id, 'FLAGGED')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center space-x-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /><span>Flag</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <MdmMenuModal
        isOpen={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        defaultZone={2}
      />

      {/* Inspection Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl my-6">
            {/* Modal header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Image Inspection #{selectedImage.id}</h3>
                <p className="text-xs text-slate-500">{selectedImage.school_name} • {getCategoryLabel(selectedImage.category)}</p>
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Full Media (Stamped Photo) */}
              <div className="max-h-96 overflow-hidden rounded-xl bg-slate-950 border border-slate-200 flex items-center justify-center">
                <img
                  src={getImageUrl(selectedImage.image_url)}
                  alt="Full Resolution"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                  className="max-h-96 w-auto object-contain"
                />
              </div>

              {/* CV Analysis Panel */}
              {selectedImage.cv_status ? (
                <div className={`rounded-xl border p-4 space-y-3 ${
                  selectedImage.cv_status === 'CV_PASS' ? 'bg-emerald-50 border-emerald-200' :
                  selectedImage.cv_status === 'CV_FLAG' ? 'bg-rose-50 border-rose-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Brain className="w-4 h-4 text-teal-700" />
                      <span>Automated Analysis Result</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusPill(selectedImage.cv_status)}`}>
                      {selectedImage.cv_status}
                    </span>
                  </div>

                  {selectedImage.cv_notes && (
                    <p className="text-xs text-slate-700 leading-relaxed">{selectedImage.cv_notes}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-[11px]">
                    {selectedImage.cv_match_percentage != null && (
                      <div className="bg-white rounded-lg px-3 py-2 text-center border border-slate-200 min-w-[95px] shadow-xs">
                        <p className="text-slate-500 font-medium">Description Match</p>
                        <p className={`font-bold text-lg ${
                          selectedImage.cv_match_percentage >= 80 ? 'text-emerald-700' :
                          selectedImage.cv_match_percentage >= 50 ? 'text-amber-700' : 'text-rose-700'
                        }`}>
                          {Math.round(selectedImage.cv_match_percentage)}%
                        </p>
                      </div>
                    )}
                    {selectedImage.cv_confidence != null && (
                      <div className="bg-white rounded-lg px-3 py-2 text-center border border-slate-200 min-w-[80px]">
                        <p className="text-slate-500">Confidence</p>
                        <p className="font-bold text-slate-900">{Math.round(selectedImage.cv_confidence * 100)}%</p>
                      </div>
                    )}
                    {selectedImage.cv_student_count != null && (
                      <div className="bg-white rounded-lg px-3 py-2 text-center border border-slate-200 min-w-[80px]">
                        <p className="text-teal-700 font-medium">Students Detected</p>
                        <p className="font-bold text-slate-900 text-lg">{selectedImage.cv_student_count}</p>
                      </div>
                    )}
                    {selectedImage.cv_processed_at && (
                      <div className="bg-white rounded-lg px-3 py-2 text-center border border-slate-200 min-w-[80px]">
                        <p className="text-slate-500">Processed At</p>
                        <p className="font-bold text-slate-700">
                          {new Date(selectedImage.cv_processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedImage.category !== 'KITCHEN_HYGIENE' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-slate-400" />
                  <span>Automated analysis is processing or pending verification.</span>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div><span className="text-slate-500">Menu / Item:</span> <strong className="text-slate-900">{selectedImage.meal_type || 'N/A'}</strong></div>
                  <div><span className="text-slate-500">Staff:</span> <strong className="text-slate-900">{selectedImage.staff_name || 'N/A'}</strong></div>
                  <div><span className="text-slate-500">Shift:</span> <strong className="text-slate-900">{selectedImage.inspection_shift || 'N/A'}</strong></div>
                  <div><span className="text-slate-500">Status:</span> <strong className="text-teal-700">{selectedImage.status}</strong></div>
                </div>

                {selectedImage.captured_location && (
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
                    <span className="text-slate-500 font-medium">Location:</span> {selectedImage.captured_location}
                  </p>
                )}
                {selectedImage.captured_timestamp && (
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
                    <span className="text-slate-500 font-medium">Capture Time:</span> {selectedImage.captured_timestamp}
                  </p>
                )}
                {selectedImage.hygiene_notes && (
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                    <span className="text-slate-500 font-medium">Hygiene Notes:</span> {selectedImage.hygiene_notes}
                  </p>
                )}

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Administrator Verification Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter compliance or deficiency observation notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Review buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'REJECTED')}
                  className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold"
                >
                  Reject Photo
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'FLAGGED')}
                  className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold"
                >
                  Flag for Inspection
                </button>
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReview(selectedImage.id, 'VERIFIED')}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                >
                  Verify & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
