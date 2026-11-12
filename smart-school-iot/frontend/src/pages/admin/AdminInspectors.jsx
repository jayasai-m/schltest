import React, { useEffect, useState } from 'react';
import { adminService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import {
  UserCheck,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  ChevronRight,
  Droplets,
  UtensilsCrossed,
  X
} from 'lucide-react';

export const AdminInspectors = () => {
  const [inspectors, setInspectors] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspectorId, setSelectedInspectorId] = useState(null);
  const [inspectorProgress, setInspectorProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  
  // Assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningInspector, setAssigningInspector] = useState(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchInspectors = async () => {
    try {
      const [insRes, schoolsRes] = await Promise.all([
        adminService.getInspectors(),
        adminService.getAvailableSchools()
      ]);
      setInspectors(insRes.data);
      setAvailableSchools(schoolsRes.data);
      
      if (insRes.data.length > 0 && !selectedInspectorId) {
        setSelectedInspectorId(insRes.data[0].id);
        fetchProgress(insRes.data[0].id);
      } else if (selectedInspectorId) {
        fetchProgress(selectedInspectorId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (inspectorId) => {
    setProgressLoading(true);
    try {
      const res = await adminService.getInspectorProgress(inspectorId);
      setInspectorProgress(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectors();
  }, []);

  const handleSelectInspector = (id) => {
    setSelectedInspectorId(id);
    fetchProgress(id);
  };

  const openAssignModal = async (inspector, e) => {
    if (e) e.stopPropagation();
    setAssigningInspector(inspector);
    setSelectedSchoolIds(inspector.assigned_schools.map((s) => s.id));
    setIsAssignModalOpen(true);
    try {
      const res = await adminService.getAvailableSchools(inspector.id);
      setAvailableSchools(res.data || []);
    } catch (err) {
      console.error('Error fetching available schools:', err);
    }
  };

  const toggleSchoolSelection = (schoolId) => {
    if (selectedSchoolIds.includes(schoolId)) {
      setSelectedSchoolIds(selectedSchoolIds.filter((id) => id !== schoolId));
    } else {
      setSelectedSchoolIds([...selectedSchoolIds, schoolId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningInspector) return;
    setAssignLoading(true);
    setActionMessage('');
    try {
      await adminService.assignSchoolsToInspector(assigningInspector.id, selectedSchoolIds);
      setActionMessage(`Schools assigned successfully to ${assigningInspector.full_name}`);
      setIsAssignModalOpen(false);
      fetchInspectors();
      if (selectedInspectorId === assigningInspector.id) {
        fetchProgress(assigningInspector.id);
      }
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to update school assignments');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const activeInspectorsCount = inspectors.filter((i) => i.status === 'ACTIVE').length;
  const totalAssignedSchools = inspectors.reduce((acc, curr) => acc + curr.assigned_schools_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Field Inspectors & Compliance Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign government schools to field inspectors and monitor real-time verification of water telemetry and mid-day meals
          </p>
        </div>

        <button
          onClick={fetchInspectors}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inspectors</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{inspectors.length}</p>
          <span className="text-[11px] text-teal-700 font-medium">Registered Inspectors</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Monitoring</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeInspectorsCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Approved & Field Active</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Schools Under Inspection</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalAssignedSchools}</p>
          <span className="text-[11px] text-teal-700 font-medium">Institutions Monitored</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Schools</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{availableSchools.length}</p>
          <span className="text-[11px] text-slate-600 font-medium">Active Government Schools</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inspectors List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Select Inspector ({inspectors.length})</span>
            </h2>
            <span className="text-[10px] text-slate-400">Click to view progress</span>
          </div>

          {inspectors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
              No field inspectors found. Newly registered inspectors will appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {inspectors.map((ins) => {
                const isSelected = selectedInspectorId === ins.id;
                return (
                  <div
                    key={ins.id}
                    onClick={() => handleSelectInspector(ins.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-50/50 border-teal-500 shadow-xs ring-1 ring-teal-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {ins.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h3 className="text-xs font-bold text-slate-900 truncate">{ins.full_name}</h3>
                          <p className="text-[11px] text-teal-700 font-medium truncate">{ins.district}</p>
                          <p className="text-[10px] text-slate-400 truncate">{ins.email}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 uppercase tracking-wider ${
                        ins.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {ins.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">{ins.assigned_schools_count}</span>
                        <span className="text-slate-500 text-[11px]">Schools</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => openAssignModal(ins, e)}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-teal-800 border border-slate-200 text-[10px] font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                          Assign Schools
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Progress & Assigned Schools Monitor */}
        <div className="lg:col-span-8">
          {progressLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 flex items-center justify-center min-h-[400px] shadow-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
            </div>
          ) : inspectorProgress ? (
            <div className="space-y-4">
              {/* Inspector Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h2 className="text-lg font-bold text-slate-900">{inspectorProgress.inspector.full_name}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {inspectorProgress.inspector.status}
                        </span>
                      </div>
                      <p className="text-xs text-teal-700 font-medium">
                        {inspectorProgress.inspector.district} • Contact: {inspectorProgress.inspector.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const ins = inspectors.find((i) => i.id === selectedInspectorId);
                      if (ins) openAssignModal(ins);
                    }}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs hover:bg-teal-700 transition-colors cursor-pointer shrink-0"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Manage Assigned Schools</span>
                  </button>
                </div>

                {/* Progress Bar & Summary Stats */}
                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Assigned</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{inspectorProgress.stats.total_assigned_schools}</p>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 uppercase font-semibold">Verified Today</span>
                    <p className="text-lg font-bold text-emerald-800 mt-0.5">{inspectorProgress.stats.verified_today}</p>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-amber-800 uppercase font-semibold">Pending Review</span>
                    <p className="text-lg font-bold text-amber-800 mt-0.5">{inspectorProgress.stats.pending_review}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">No Upload Today</span>
                    <p className="text-lg font-bold text-slate-700 mt-0.5">{inspectorProgress.stats.no_submission_today}</p>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 text-[11px]">Today's Inspection Completion Rate</span>
                    <span className="font-bold text-teal-800">{inspectorProgress.stats.compliance_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${inspectorProgress.stats.compliance_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Schools List Header */}
              <div className="flex items-center justify-between pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Assigned Schools & Real-Time Verification Status</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {inspectorProgress.schools.length} school(s) under supervision
                </span>
              </div>

              {/* Schools Cards */}
              {inspectorProgress.schools.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">No Schools Assigned Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "Manage Assigned Schools" above to assign government schools to this inspector.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectorProgress.schools.map((s) => {
                    let statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {s.latest_past_image ? 'PRIOR SUBMISSIONS ON FILE' : 'NO SUBMISSIONS YET'}
                      </span>
                    );
                    if (s.verification_status === 'VERIFIED') {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>VERIFIED BY INSPECTOR</span>
                        </span>
                      );
                    } else if (['PENDING_REVIEW', 'CV_PASS'].includes(s.verification_status)) {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>AWAITING VERIFICATION</span>
                        </span>
                      );
                    } else if (['FLAGGED', 'CV_FLAG'].includes(s.verification_status)) {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>FLAGGED FOR ATTENTION</span>
                        </span>
                      );
                    } else if (s.verification_status === 'REJECTED') {
                      statusBadge = (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          REJECTED
                        </span>
                      );
                    }

                    return (
                      <div
                        key={s.school_id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                      >
                        {/* School Top Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-slate-900">{s.school_name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                {s.school_code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {s.district} • Principal: {s.principal_name} ({s.phone})
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {statusBadge}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              s.hardware_status === 'CONNECTED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {s.hardware_label}
                            </span>
                          </div>
                        </div>

                        {/* Telemetry and Verification Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {/* Physical Water & Tank Telemetry */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1.5">
                              <Droplets className="w-3.5 h-3.5 text-teal-600" />
                              <span>Overhead Tank & Drinking Water</span>
                            </span>
                            {s.latest_reading?.water_level_pct !== null && s.latest_reading?.water_level_pct !== undefined ? (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Fill Level:</span>
                                  <span className="font-bold text-slate-900">
                                    {s.latest_reading.water_level_pct}% ({s.latest_reading.water_volume_litres} L)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-teal-600 rounded-full"
                                    style={{ width: `${Math.min(100, s.latest_reading.water_level_pct)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs pt-1">
                                  <span className="text-slate-500">Turbidity:</span>
                                  <span className={`font-semibold ${s.latest_reading.turbidity_ntu <= 5.0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {s.latest_reading.turbidity_ntu} NTU ({s.latest_reading.turbidity_ntu <= 5.0 ? 'Safe' : 'Abnormal'})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 pt-1">No physical sensor telemetry recorded yet.</p>
                            )}
                          </div>

                          {/* Mid-Day Meal Compliance */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            <span className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1.5">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-teal-600" />
                              <span>Mid-Day Meal & Kitchen Audit</span>
                            </span>

                            {s.verified_by ? (
                              <div className="space-y-1 text-xs pt-1">
                                <p className="text-slate-700">
                                  <span className="text-slate-500">Reviewer:</span> {s.verified_by}
                                </p>
                                {s.verified_at && (
                                  <p className="text-[11px] text-slate-500">
                                    Reviewed at: {new Date(s.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                                {s.verification_notes && (
                                  <p className="text-[11px] text-teal-800 italic">
                                    "{s.verification_notes}"
                                  </p>
                                )}
                              </div>
                            ) : s.today_has_submission ? (
                              <p className="text-[11px] text-amber-800 pt-1">
                                Staff submitted {s.today_images_count} meal photograph(s) today. Pending inspector review.
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 pt-1">
                                No meal or kitchen preparation photographs uploaded for today yet.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Today's Photo Submissions Preview */}
                        {s.today_images && s.today_images.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                              Today's Uploaded Photographs ({s.today_images.length})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {s.today_images.map((img) => (
                                <div key={img.id} className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                  <img
                                    src={getImageUrl(img.image_url)}
                                    alt={img.meal_type || 'Meal'}
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="p-1.5 bg-white text-[10px] border-t border-slate-100">
                                    <p className="font-semibold text-slate-900 truncate">{img.meal_type || img.category}</p>
                                    {img.cv_student_count !== null && img.cv_student_count !== undefined && (
                                      <p className="text-teal-700 font-mono text-[9px]">Students: {img.cv_student_count}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Submission on File Preview (if no upload today) */}
                        {(!s.today_images || s.today_images.length === 0) && s.latest_past_image && (
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                              Recent Submission on File ({new Date(s.latest_past_image.created_at).toLocaleDateString()})
                            </span>
                            <div className="max-w-[200px] group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <img
                                src={getImageUrl(s.latest_past_image.image_url)}
                                alt={s.latest_past_image.meal_type || 'Meal'}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                                className="w-full h-24 object-cover"
                              />
                              <div className="p-1.5 bg-white text-[10px] border-t border-slate-100">
                                <p className="font-semibold text-slate-900 truncate">{s.latest_past_image.meal_type || s.latest_past_image.category || 'Meal Photo'}</p>
                                {s.latest_past_image.cv_student_count !== null && s.latest_past_image.cv_student_count !== undefined && (
                                  <p className="text-teal-700 font-mono text-[9px]">Students: {s.latest_past_image.cv_student_count}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-500 shadow-xs">
              Select an inspector from the left to view monitored schools and verification progress.
            </div>
          )}
        </div>
      </div>

      {/* ASSIGN SCHOOLS MODAL */}
      {isAssignModalOpen && assigningInspector && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Government Schools</h3>
                <p className="text-xs text-teal-700 font-medium">
                  Field Inspector: {assigningInspector.full_name}
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const eligibleSchools = availableSchools.filter((school) => {
                const otherInspectors = (school.assigned_inspectors || []).filter(
                  (ins) => ins.id !== assigningInspector.id
                );
                return otherInspectors.length === 0;
              });

              return (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Select schools for this inspector's jurisdiction:</span>
                    <span className="text-[11px] text-teal-700 font-medium">1 Inspector per School</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {eligibleSchools.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                        No unassigned schools available. All active schools are already assigned to other inspectors.
                      </div>
                    ) : (
                      eligibleSchools.map((school) => {
                        const isChecked = selectedSchoolIds.includes(school.id);
                        return (
                          <div
                            key={school.id}
                            onClick={() => toggleSchoolSelection(school.id)}
                            className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-teal-50 border-teal-500 text-teal-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-semibold">{school.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {school.school_code} • {school.district}
                              </p>
                            </div>

                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-0 focus:ring-offset-0 pointer-events-none"
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {selectedSchoolIds.length} school(s) selected
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignLoading}
                  onClick={handleSaveAssignments}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 shadow-xs"
                >
                  {assignLoading ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
