import React, { useEffect, useState } from 'react';
import { inspectorService } from '../../services/api';
import {
  Droplets,
  Gauge,
  CheckCircle2,
  Building2,
  RefreshCw,
  WifiOff,
  UtensilsCrossed
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

export const InspectorWater = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWater = async (schoolId) => {
    try {
      const res = await inspectorService.getWater(schoolId);
      setSchools(res.data.schools || []);
      setWaterData(res.data);
      if (res.data.selected_school && !selectedSchoolId) {
        setSelectedSchoolId(res.data.selected_school.id);
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
    const interval = setInterval(() => {
      fetchWater(selectedSchoolId);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSchoolId]);

  const handleSchoolChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedSchoolId(id);
    setLoading(true);
    fetchWater(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const school = waterData?.selected_school;
  const latest = waterData?.latest;
  const history = waterData?.history || [];

  const chartData = history.map((item) => ({
    time: new Date(item.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    turbidity: item.turbidity_ntu,
    humidity: item.humidity_pct
  }));

  const isConnected = school?.hardware_status === 'CONNECTED';
  const hasData = isConnected && latest !== null && latest !== undefined;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Drinking Water Quality Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time optical clarity monitoring (NTU) & kitchen telemetry for assigned institutions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {schools.length > 0 && (
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-xs">
              <Building2 className="w-4 h-4 text-teal-600" />
              <select
                value={selectedSchoolId || ''}
                onChange={handleSchoolChange}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => { setRefreshing(true); fetchWater(selectedSchoolId); }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {schools.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-500 text-xs shadow-xs">
          No schools assigned to your inspection jurisdiction yet.
        </div>
      ) : (
        <>
          {/* Real-Time Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Optical Turbidity</span>
                <Gauge className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
                {hasData ? `${latest.turbidity_ntu} NTU` : '--'}
              </p>
              <p className={`text-xs mt-1 font-semibold ${
                hasData && latest.turbidity_ntu <= 5.0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {hasData ? (latest.turbidity_ntu <= 5.0 ? 'WHO/BIS Safe Drinking Water' : 'Contamination Alert') : 'Hardware offline'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Kitchen Humidity (DHT11)</span>
                <UtensilsCrossed className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
                {hasData ? `${latest.humidity_pct}%` : '--'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {hasData && latest.temperature_c !== null && latest.temperature_c !== undefined
                  ? `Kitchen Temp: ${latest.temperature_c}°C`
                  : 'Environmental sensor'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>ESP32 Node Status</span>
                {isConnected ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
              </div>
              <p className={`text-xl font-bold mt-2 ${isConnected ? 'text-emerald-700' : 'text-slate-500'}`}>
                {school?.hardware_label || 'Disconnected'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {school?.last_hardware_ping ? `Last: ${new Date(school.last_hardware_ping).toLocaleTimeString()}` : 'Never connected'}
              </p>
            </div>
          </div>

          {/* Telemetry Charts */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-teal-600" />
              <span>Real-Time Sensor Telemetry History</span>
            </h3>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No historical telemetry points available for this institution.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#0d9488" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" name="Kitchen Humidity (%)" stroke="#d97706" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
