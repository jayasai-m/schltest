import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService, getImageUrl, FALLBACK_IMAGE } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import { MdmMenuModal } from '../../components/MdmMenuModal';
import {
  Building2,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Eye,
  ArrowRight,
  UtensilsCrossed,
  RefreshCw,
  Users
} from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const { t } = useLang();

  const fetchDashboard = async () => {
    try {
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    total_approved_schools: 0,
    pending_approvals: 0,
    active_alerts: 0,
    hardware_connected: 0
  };

  const schools = data?.schools_overview || [];
  const alerts = data?.recent_alerts || [];
  const images = data?.recent_images || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('systemOverview')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('systemOverviewSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMenuModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
            title="View 2025 AP Mid-Day Meal Menu (Zones 1-4)"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>MDM Menu 2025</span>
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchDashboard(); }}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors w-fit cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
            <span>{t('refreshData')}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Approved Schools */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('totalApprovedSchools')}</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats.total_approved_schools}</span>
            <span className="text-[11px] text-slate-500 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Institutions monitored in network</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('pendingApprovals')}</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats.pending_approvals}</span>
            <span className="text-[11px] text-slate-500 font-medium">Awaiting Review</span>
          </div>
          <div className="mt-1">
            {stats.pending_approvals > 0 ? (
              <Link to="/admin/approvals" className="text-[11px] text-amber-700 hover:underline font-semibold">
                Review registrations →
              </Link>
            ) : (
              <p className="text-[11px] text-slate-400">No pending registrations</p>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('activeAlerts')}</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats.active_alerts}</span>
            <span className="text-[11px] text-slate-500 font-medium">Unresolved</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.active_alerts === 0 ? "No active alerts" : "Threshold anomalies detected"}
          </p>
        </div>

        {/* Hardware Connections */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t('hardwareConnections')}</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats.hardware_connected}</span>
            <span className="text-[11px] text-slate-500 font-medium">Online ESP32s</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.hardware_connected === 0 ? "Hardware not connected" : "Transmitting live telemetry"}
          </p>
        </div>
      </div>

      {/* Approved Schools Live Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Monitored Schools Telemetry Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">Physical sensor status for all approved institutions</p>
          </div>
          <Link
            to="/admin/schools"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">School Name & Code</th>
                <th className="px-5 py-3 font-semibold">District</th>
                <th className="px-5 py-3 font-semibold">Hardware Status</th>
                <th className="px-5 py-3 font-semibold">Water Turbidity</th>
                <th className="px-5 py-3 font-semibold">Kitchen Humidity</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s) => {
                const isOnline = s.hardware_status === 'CONNECTED';
                const r = s.latest_reading;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.school_code}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{s.district}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isOnline
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {isOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            ESP32 Connected
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1 text-slate-400" />
                            Hardware Not Connected
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {r && r.turbidity_ntu !== undefined ? (
                        <span className="text-slate-800 font-medium">{r.turbidity_ntu} NTU</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {r && r.humidity_pct !== undefined ? (
                        <span className="text-slate-800 font-medium">{r.humidity_pct}%</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/schools/${s.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-teal-800 font-semibold text-[11px] transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Grid: Recent Alerts & Recent Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">System Anomalies & Alerts</h3>
            </div>
            <Link to="/admin/alerts" className="text-xs font-semibold text-teal-700 hover:underline">
              All Alerts →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No active alerts
              </div>
            ) : (
              alerts.slice(0, 5).map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 uppercase">
                      {a.alert_type}
                    </span>
                    <p className="text-xs text-slate-800 font-medium mt-1.5">{a.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    a.status === 'ACTIVE' ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Photo Submissions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900">Recent Staff Photo Submissions</h3>
            </div>
            <Link to="/admin/meals" className="text-xs font-semibold text-teal-700 hover:underline">
              Verify Photos →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {images.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No submissions yet
              </div>
            ) : (
              images.slice(0, 5).map((img) => (
                <div key={img.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <img
                        src={getImageUrl(img.image_url)}
                        alt="Thumbnail"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                          {img.category === 'MEAL_PREPARATION' ? 'Meal Prep' : img.category === 'STUDENT_EATING' ? 'Students Eating' : 'Hygiene'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-1">{img.meal_type || 'In-App Submission'}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span>Staff: {img.staff_name || 'Staff'}</span>
                        {img.category === 'STUDENT_EATING' && (
                          <span className="font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 flex items-center space-x-0.5">
                            <Users className="w-3 h-3 text-teal-600 inline" />
                            <span>{img.cv_student_count != null ? `${img.cv_student_count} students` : 'Counting…'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    img.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    img.status === 'FLAGGED' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    img.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {img.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <MdmMenuModal
        isOpen={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        defaultZone={2}
      />
    </div>
  );
};
