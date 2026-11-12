import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  FileBarChart,
  Building2,
  RefreshCw,
  Droplets,
  UtensilsCrossed,
  CheckCircle,
  AlertTriangle,
  Download,
  Printer,
  Filter,
  ShieldCheck,
  Search,
  Eye,
  Calendar,
  UserCheck
} from 'lucide-react';

export const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('uploads'); // 'uploads' | 'schools' | 'water' | 'audits'

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSchoolId) params.school_id = selectedSchoolId;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status_filter = statusFilter;
      const res = await adminService.getReports(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedSchoolId, categoryFilter, statusFilter]);

  const {
    schools,
    selected_school,
    has_sensor_data,
    readings = [],
    alerts = [],
    uploads = [],
    schools_matrix = [],
    recent_audits = [],
    summary = {}
  } = data || {};

  // Filter uploads by search query (school name, staff name, menu)
  const filteredUploads = uploads.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.school_name?.toLowerCase().includes(q) ||
      u.school_code?.toLowerCase().includes(q) ||
      u.staff_name?.toLowerCase().includes(q) ||
      u.meal_type?.toLowerCase().includes(q) ||
      u.menu_description?.toLowerCase().includes(q)
    );
  });

  // Export Uploads as CSV
  const handleExportCSV = () => {
    if (!filteredUploads.length) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Submission ID',
      'School Name',
      'School Code',
      'Category',
      'Meal Type',
      'Staff Name',
      'Inspection Shift',
      'CV Status',
      'Students Detected',
      'Final Status',
      'Reviewer',
      'Review Time',
      'Submission Time'
    ];

    const rows = filteredUploads.map((u) => [
      u.id,
      `"${u.school_name || ''}"`,
      `"${u.school_code || ''}"`,
      `"${u.category || ''}"`,
      `"${u.meal_type || ''}"`,
      `"${u.staff_name || ''}"`,
      `"${u.inspection_shift || ''}"`,
      `"${u.cv_status || 'N/A'}"`,
      u.cv_student_count != null ? u.cv_student_count : 'N/A',
      `"${u.status || ''}"`,
      `"${u.reviewed_by || 'Pending'}"`,
      `"${u.reviewed_at ? new Date(u.reviewed_at).toLocaleString() : ''}"`,
      `"${new Date(u.created_at).toLocaleString()}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SmartSchool_Audit_Report_${selectedSchoolId ? 'School_' + selectedSchoolId : 'AllSchools'}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Compliance & Audit Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional audit ledgers, photo verification logs, and hardware telemetry
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          <button
            onClick={fetchReports}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* School Select */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">All Registered Schools</option>
            {schools?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="MEAL_PREPARATION">Meal Preparation</option>
            <option value="STUDENT_EATING">Students Eating</option>
            <option value="KITCHEN_HYGIENE">Kitchen Hygiene</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">All Review Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="FLAGGED">Flagged</option>
            <option value="CV_FLAG">CV Flagged</option>
            <option value="CV_PASS">CV Passed</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Search input for uploads */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search school, staff, menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Uploads Audited</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{summary?.total_uploads || 0}</p>
          <span className="text-[10px] text-slate-400">Mid-Day Meal Submissions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Verified Compliance</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">{summary?.images_verified || 0}</p>
          <span className="text-[10px] text-emerald-700 font-medium">{summary?.compliance_rate || 0}% Compliance Rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Flagged Anomalies</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{summary?.images_flagged || 0}</p>
          <span className="text-[10px] text-amber-700 font-medium">CV Flagged or Inspection Hold</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Pending Reviews</span>
          <p className="text-2xl font-bold font-mono text-teal-600 mt-1">{summary?.images_pending || 0}</p>
          <span className="text-[10px] text-teal-700 font-medium">Awaiting Inspector Action</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Drinking Water Purity</span>
          <p className="text-2xl font-bold font-mono text-teal-700 mt-1">{summary?.water_safe_rate || 100}%</p>
          <span className="text-[10px] text-slate-500">WHO / BIS Compliant (&le; 5 NTU)</span>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'uploads'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Photo Uploads Ledger ({filteredUploads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schools')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'schools'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>School Compliance Matrix ({schools_matrix.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('water')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'water'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Water Quality & Tank History</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'audits'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Security Trail</span>
        </button>
      </div>

      {/* TAB 1: UPLOADS LEDGER */}
      {activeTab === 'uploads' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Inspection Photo Uploads Audit Trail
            </h3>
            <span className="text-xs text-slate-500">
              Showing {filteredUploads.length} record(s)
            </span>
          </div>

          {filteredUploads.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 italic">
              No photo uploads matched the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ID & Photo</th>
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3">Category & Shift</th>
                    <th className="px-4 py-3">Menu / Staff</th>
                    <th className="px-4 py-3">CV Analysis</th>
                    <th className="px-4 py-3">Audit Status</th>
                    <th className="px-4 py-3">Reviewer</th>
                    <th className="px-4 py-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUploads.map((u) => {
                    const statusClass =
                      u.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : ['FLAGGED', 'CV_FLAG'].includes(u.status)
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : ['PENDING_REVIEW', 'CV_PASS'].includes(u.status)
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                    const categoryBadge =
                      u.category === 'MEAL_PREPARATION'
                        ? 'Meal Prep'
                        : u.category === 'STUDENT_EATING'
                        ? 'Students Eating'
                        : 'Kitchen Hygiene';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-slate-400 text-[10px]">#{u.id}</span>
                            {u.image_url ? (
                              <a
                                href={u.image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 block"
                              >
                                <img
                                  src={u.image_url}
                                  alt="Submission"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </a>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400">
                                No img
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{u.school_name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{u.school_code}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 block w-max">
                            {categoryBadge}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">{u.inspection_shift}</span>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 truncate max-w-[160px]">{u.meal_type || '--'}</p>
                          <span className="text-[10px] text-slate-500">Staff: {u.staff_name}</span>
                        </td>

                        <td className="px-4 py-3">
                          {u.cv_notes ? (
                            <div className="space-y-0.5 max-w-[200px]">
                              <p className="text-[11px] text-slate-700 truncate" title={u.cv_notes}>
                                {u.cv_notes}
                              </p>
                              {u.cv_student_count != null && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  {u.cv_student_count} student(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No CV run</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusClass}`}>
                            {u.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800 block text-[11px]">
                            {u.reviewed_by || 'Pending'}
                          </span>
                          {u.admin_notes && (
                            <span className="text-[10px] text-slate-500 italic truncate block max-w-[120px]" title={u.admin_notes}>
                              "{u.admin_notes}"
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          {new Date(u.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHOOLS MATRIX */}
      {activeTab === 'schools' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Government School Inspection & Compliance Breakdown
            </h3>
            <span className="text-xs text-slate-500">
              {schools_matrix.length} Registered Institution(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">School Name</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Assigned Inspector</th>
                  <th className="px-4 py-3">Hardware Node</th>
                  <th className="px-4 py-3">Total Submissions</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Flagged</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Compliance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools_matrix.map((s) => (
                  <tr key={s.school_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{s.school_name}</p>
                      <span className="text-[10px] text-teal-700 font-mono font-medium">{s.school_code}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.district}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {s.assigned_inspector}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.hardware_status === 'CONNECTED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {s.hardware_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{s.total_uploads}</td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">{s.verified_count}</td>
                    <td className="px-4 py-3 font-mono text-amber-700 font-semibold">{s.flagged_count}</td>
                    <td className="px-4 py-3 font-mono text-teal-700 font-semibold">{s.pending_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-teal-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(s.compliance_pct, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-800">
                          {s.compliance_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WATER & SENSOR LOGS */}
      {activeTab === 'water' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Water Tank & Turbidity Telemetry History – {selected_school?.name || 'Selected Institution'}
              </h3>
              <p className="text-xs text-slate-500">
                Physical sensor measurements streamed from ESP32 hardware node
              </p>
            </div>
          </div>

          {!has_sensor_data ? (
            <div className="text-center py-12 text-slate-500 text-xs italic">
              No historical sensor telemetry recorded yet for this school.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Turbidity (NTU)</th>
                    <th className="px-4 py-2.5">WHO Status</th>
                    <th className="px-4 py-2.5">Kitchen Humidity (%)</th>
                    <th className="px-4 py-2.5">Tank Level (%)</th>
                    <th className="px-4 py-2.5">Water Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {readings.map((r) => {
                    const isSafe = r.turbidity_ntu <= 5.0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2">{new Date(r.recorded_at).toLocaleString()}</td>
                        <td className="px-4 py-2 font-bold">{r.turbidity_ntu} NTU</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isSafe
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {isSafe ? 'POTABLE / SAFE' : 'TURBIDITY SPIKE'}
                          </span>
                        </td>
                        <td className="px-4 py-2">{r.humidity_pct}%</td>
                        <td className="px-4 py-2">{r.water_level_pct}%</td>
                        <td className="px-4 py-2">{r.water_volume_litres} L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audits' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Administrative Security & Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Immutable record of inspector approvals, meal verifications, and alert resolutions
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recent_audits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-teal-700 font-mono text-[11px] block">
                    {a.action}
                  </span>
                  <p className="text-slate-700 text-xs mt-0.5">{a.details}</p>
                  <span className="text-[10px] text-slate-400">By: {a.user_email}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
