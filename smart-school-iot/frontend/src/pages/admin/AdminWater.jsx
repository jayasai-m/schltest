import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  Droplets,
  Gauge,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Building2,
  RefreshCw,
  Clock,
  WifiOff,
  UtensilsCrossed,
  Thermometer
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const AdminWater = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [thresholds, setThresholds] = useState({
    turbidity_threshold: 5.0,
  });

  const fetchWater = async (schoolId) => {
    try {
      const res = await adminService.getWater(schoolId);
      setSchools(res.data.schools || []);
      setWaterData(res.data);
      if (res.data.selected_school) {
        if (!selectedSchoolId) setSelectedSchoolId(res.data.selected_school.id);
        setThresholds({
          turbidity_threshold: res.data.selected_school.turbidity_threshold || 5.0,
        });
      }
    } catch (err) {
      console.error("Water monitoring fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWater(selectedSchoolId);
  }, [selectedSchoolId]);

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!selectedSchoolId) return;
    try {
      await adminService.updateThresholds(selectedSchoolId, thresholds);
      setShowConfig(false);
      fetchWater(selectedSchoolId);
    } catch (err) {
      console.error("Failed to update thresholds:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const school = waterData?.selected_school;
  const latest = waterData?.latest;
  const history = waterData?.history || [];
  const isConnected = school?.hardware_status === 'CONNECTED';
  const hasData = isConnected && latest !== null && latest !== undefined;

  return (
    <div className="space-y-6">
      {/* Top Header & School Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Drinking Water Quality Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time drinking-water optical turbidity (NTU) purity analysis & kitchen telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Building2 className="w-4 h-4 text-teal-400" />
            <select
              value={selectedSchoolId || ''}
              onChange={(e) => {
                setSelectedSchoolId(parseInt(e.target.value));
                setLoading(true);
              }}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-xl text-xs font-medium text-teal-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Thresholds</span>
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchWater(selectedSchoolId); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Threshold Configuration Drawer / Modal */}
      {showConfig && (
        <form onSubmit={handleSaveThresholds} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Configurable Safety Thresholds – {school?.name}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Turbidity Cutoff (NTU)</label>
              <input
                type="number"
                step="0.1"
                value={thresholds.turbidity_threshold}
                onChange={(e) => setThresholds({ ...thresholds, turbidity_threshold: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-500">WHO safe limit &le; 5.0 NTU (Triggers High Turbidity Alert)</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-lg"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* Two Main Cards: Water Quality & Tank Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Water Quality */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Drinking Water Quality</h2>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              hasData ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'
            }`}>
              {hasData ? `Threshold: ${school?.turbidity_threshold} NTU` : 'No Data'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <p className="text-xs text-slate-400">Turbidity Reading (NTU)</p>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-3xl font-extrabold text-white font-mono">
                {hasData ? `${latest.turbidity_ntu} NTU` : '--'}
              </span>
              <span className={`text-xs font-bold uppercase ${
                hasData && latest.turbidity_status === 'GOOD' ? 'text-emerald-400' :
                hasData && latest.turbidity_status === 'MODERATE' ? 'text-amber-400' :
                hasData && latest.turbidity_status === 'POOR' ? 'text-rose-400' : 'text-slate-500'
              }`}>
                {hasData ? `Status: ${latest.turbidity_status}` : 'Sensor Disconnected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-500">Optical Sensor Link</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {isConnected ? 'ESP32 Connected' : 'Hardware Not Connected'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-500">Last Calibrated Ping</span>
              <p className="font-mono text-slate-200 mt-0.5">
                {hasData ? new Date(latest.recorded_at).toLocaleTimeString() : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Kitchen Environmental Telemetry (DHT11) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Kitchen Environment (DHT11)</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              Active Sensor
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <p className="text-xs text-slate-400">Kitchen Humidity</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {hasData && latest.humidity_pct !== undefined ? `${latest.humidity_pct}%` : '--'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {hasData ? `Status: ${latest.humidity_status || 'NORMAL'}` : 'No Signal'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <p className="text-xs text-slate-400">Ambient Temperature</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {hasData && latest.temperature_c !== null && latest.temperature_c !== undefined
                    ? `${latest.temperature_c}°C`
                    : '--'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Kitchen Atmosphere</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-500">Sensor Status</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {isConnected ? 'Telemetry Active' : 'Disconnected'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
              <span className="text-slate-500">Hygiene Standard</span>
              <p className="font-semibold text-emerald-400 mt-0.5">
                {hasData && latest.humidity_pct <= 70 ? 'Optimal Dryness' : hasData ? 'High Moisture' : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart (Only Real Data) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4">Historical Sensor Telemetry Timeline</h3>
        {history.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <WifiOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No Historical Data Available</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Charts will populate once physical ESP32 begins telemetry</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="recorded_at"
                  tickFormatter={(val) => new Date(val).toLocaleTimeString()}
                  stroke="#64748b"
                  fontSize={10}
                />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  labelFormatter={(val) => new Date(val).toLocaleString()}
                />
                <Line type="monotone" dataKey="turbidity_ntu" name="Turbidity (NTU)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidity_pct" name="Kitchen Humidity (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
