import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const SchoolAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await schoolService.getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Institution Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real hardware alerts generated for your registered school
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-xs text-slate-500 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No Alerts Active</p>
          <p className="text-slate-500 mt-1">Drinking water turbidity and kitchen environmental parameters are within configured normal limits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono uppercase">
                    {a.alert_type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-800 font-medium">{a.message}</p>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                a.status === 'ACTIVE'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
