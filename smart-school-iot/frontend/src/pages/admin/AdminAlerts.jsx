import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Building2,
  Clock,
  ShieldAlert,
  Flag
} from 'lucide-react';

export const AdminAlerts = () => {
  const [data, setData] = useState({ schools: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (selectedSchoolId) params.school_id = selectedSchoolId;
      if (statusFilter) params.status_filter = statusFilter;
      const res = await adminService.getAlerts(params);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedSchoolId, statusFilter]);

  const handleAlertAction = async (alertId, newStatus) => {
    try {
      await adminService.actOnAlert(alertId, newStatus, `Action performed by Administrator`);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const { schools, alerts } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incidents & Real-Time Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">
            System anomalies triggered by physical hardware threshold violations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Building2 className="w-4 h-4 text-teal-600" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-800">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-teal-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800">All Statuses</option>
              <option value="ACTIVE" className="bg-white text-slate-800">Active</option>
              <option value="ACKNOWLEDGED" className="bg-white text-slate-800">Acknowledged</option>
              <option value="RESOLVED" className="bg-white text-slate-800">Resolved</option>
            </select>
          </div>

          <button
            onClick={fetchAlerts}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-xs text-slate-500 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No Active Alerts</p>
          <p className="text-slate-500 mt-1">All telemetry is within normal operating thresholds.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const isCritical = a.severity === 'CRITICAL';
            const isActive = a.status === 'ACTIVE';
            return (
              <div
                key={a.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {a.alert_type}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{a.school_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{a.message}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                    isActive ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {a.status}
                  </span>

                  {isActive && (
                    <>
                      <button
                        onClick={() => handleAlertAction(a.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleAlertAction(a.id, 'RESOLVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
