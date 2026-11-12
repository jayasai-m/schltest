import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import {
  Droplets,
  RefreshCw,
  WifiOff,
  Thermometer,
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

export const SchoolWater = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWater = async () => {
    try {
      const res = await schoolService.getWater();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWater();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { school, hardware, latest, history } = data || {};
  const isConnected = hardware?.status === 'CONNECTED';
  const hasData = isConnected && latest !== null && latest !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Drinking Water Quality Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real physical sensor metrics for {school?.name}
          </p>
        </div>

        <button
          onClick={fetchWater}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Quality */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-teal-600" />
              <span>Drinking Water Quality</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">Limit: {school?.turbidity_threshold} NTU</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Turbidity</p>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-3xl font-bold text-slate-900 font-mono">
                {hasData ? `${latest.turbidity_ntu} NTU` : '--'}
              </span>
              <span className={`text-xs font-bold uppercase ${
                hasData && latest.turbidity_status === 'GOOD' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {hasData ? `Quality: ${latest.turbidity_status}` : 'Sensor Disconnected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Optical Sensor Link</span>
              <p className="font-semibold text-slate-800 mt-0.5">{hardware?.label}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Last Telemetry</span>
              <p className="font-mono text-slate-800 mt-0.5 font-semibold">
                {hasData ? new Date(latest.recorded_at).toLocaleTimeString() : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Kitchen Environment (DHT11) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5 text-teal-600" />
              <span>Kitchen Environment (DHT11)</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">Active Sensor</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-teal-600" />
                <span>Kitchen Humidity</span>
              </p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {hasData ? `${latest.humidity_pct}%` : '--'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {hasData ? `Status: ${latest.humidity_status}` : 'No Signal'}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                <span>Temperature</span>
              </p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {hasData && latest.temperature_c !== null && latest.temperature_c !== undefined
                    ? `${latest.temperature_c}°C`
                    : '--'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Ambient Environment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Telemetry Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Historical Readings Timeline</h3>
        {!history || history.length === 0 ? (
          <div className="text-center py-14 text-slate-500 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <WifiOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold">No Historical Data Available</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Physical ESP32 readings will be archived here automatically</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="recorded_at" tickFormatter={(val) => new Date(val).toLocaleTimeString()} stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="turbidity_ntu" name="Turbidity (NTU)" stroke="#0d9488" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidity_pct" name="Kitchen Humidity (%)" stroke="#d97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
