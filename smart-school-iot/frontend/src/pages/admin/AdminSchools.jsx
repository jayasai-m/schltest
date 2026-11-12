import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { Eye, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const AdminSchools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchools = async () => {
    try {
      const res = await adminService.getSchools();
      setSchools(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Multi-School Management Hub</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered government institutions under state monitoring
          </p>
        </div>

        <button
          onClick={fetchSchools}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">School Name & Code</th>
                <th className="px-5 py-3.5 font-semibold">Location</th>
                <th className="px-5 py-3.5 font-semibold">Account Status</th>
                <th className="px-5 py-3.5 font-semibold">Hardware Link</th>
                <th className="px-5 py-3.5 font-semibold">Water Turbidity</th>
                <th className="px-5 py-3.5 font-semibold">Active Alerts</th>
                <th className="px-5 py-3.5 font-semibold text-right">Action</th>
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
                      <div className="text-[10px] text-teal-700 font-mono mt-0.5">{s.school_code}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{s.district}, {s.state}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.address}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        s.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isOnline
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {isOnline ? (
                          <>
                            <Wifi className="w-3 h-3 mr-1 text-emerald-600" />
                            Connected
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 mr-1 text-slate-400" />
                            Disconnected
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-800 font-medium">
                      {r && r.turbidity_ntu !== undefined ? `${r.turbidity_ntu} NTU` : '--'}
                    </td>
                    <td className="px-5 py-4">
                      {s.active_alerts_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold font-mono text-[10px]">
                          {s.active_alerts_count} Active
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No Alerts</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/schools/${s.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-teal-800 hover:bg-slate-200 font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
};
