import React, { useEffect, useState } from 'react';
import { inspectorService } from '../../services/api';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Building2,
  Clock,
  ShieldAlert
} from 'lucide-react';

export const InspectorAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAlerts = async () => {
    try {
      const params = {};
      if (selectedSchoolId) params.school_id = selectedSchoolId;
      if (statusFilter) params.status_filter = statusFilter;
      const [alertsRes, schoolsRes] = await Promise.all([
        inspectorService.getAlerts(params),
        inspectorService.getSchools()
      ]);
      setAlerts(alertsRes.data);
      setSchools(schoolsRes.data);
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
      await inspectorService.actOnAlert(alertId, newStatus, `Action performed by Field Inspector`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incidents & Hardware Alarms</h1>
          <p className="text-xs text-slate-500 mt-1">
            Abnormal threshold violations, dry runs, turbidity spikes, and damp kitchen warnings in assigned schools
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {schools.length > 0 && (
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800">All Assigned Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-800">{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white text-slate-800">All Statuses</option>
            <option value="ACTIVE" className="bg-white text-slate-800">Active Alarms</option>
            <option value="RESOLVED" className="bg-white text-slate-800">Resolved Alarms</option>
          </select>
        </div>
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-xs text-slate-500 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No Incidents Active</p>
          <p className="text-slate-500 mt-1">No abnormal incident alarms found across your assigned schools.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    a.severity === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {a.severity}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{a.school_name}</h3>
                  <span className="text-xs text-slate-500">• {a.alert_type}</span>
                </div>

                <p className="text-xs text-slate-700 font-medium">{a.message}</p>

                <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(a.created_at).toLocaleString()}</span>
                  </span>
                  {a.sensor_value !== null && a.sensor_value !== undefined && (
                    <span className="text-teal-700 font-mono font-medium">
                      Trigger Value: {a.sensor_value} (Limit: {a.threshold_value})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {a.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleAlertAction(a.id, 'RESOLVED')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve Incident</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                    Resolved by {a.resolved_by || 'Staff'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
