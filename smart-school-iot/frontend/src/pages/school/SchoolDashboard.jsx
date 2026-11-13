import React, { useEffect, useState } from 'react';
import { schoolService } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import {
  Droplets,
  UtensilsCrossed,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  PlusCircle,
  Thermometer
} from 'lucide-react';
import { StaffUploadModal } from '../../components/StaffUploadModal';

export const SchoolDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { t } = useLang();

  const fetchDashboard = async () => {
    try {
      const res = await schoolService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { school, hardware, latest_reading, active_alerts_count, recent_alerts, today_meal } = data || {};
  const isConnected = hardware?.status === 'CONNECTED';
  const hasSensorData = latest_reading !== null && latest_reading !== undefined;

  return (
    <div className="space-y-6">
      {/* Node Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{school?.name || 'ZPHS Poranki'}</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-teal-800 font-semibold border border-slate-200">
              {school?.school_code || 'SCH-PORANKI-001'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            District: {school?.district}, {school?.state} • Hardware Node ID: {school?.hardware_device_id}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('uploadPhoto')}</span>
          </button>

          <button
            onClick={() => { setRefreshing(true); fetchDashboard(); }}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Sensor Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hardware Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('hardwareStatus')}</span>
            {isConnected ? (
              <Wifi className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="mt-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {hardware?.label || (isConnected ? t('connected') : t('disconnected'))}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {isConnected ? 'Telemetry active' : t('sensorOffline')}
          </p>
        </div>

        {/* Drinking Water Turbidity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('turbidity')}</span>
            <Droplets className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {hasSensorData ? `${latest_reading.turbidity_ntu} NTU` : '--'}
            </span>
          </div>
          <p className="text-[11px] mt-1 font-semibold">
            {hasSensorData ? (
              <span className={latest_reading.turbidity_status === 'GOOD' ? 'text-emerald-700' : 'text-rose-700'}>
                Quality: {latest_reading.turbidity_status} {!isConnected && '(Offline)'}
              </span>
            ) : (
              <span className="text-slate-400">{t('sensorOffline')}</span>
            )}
          </p>
        </div>

        {/* Kitchen Humidity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{t('humidity')}</span>
            <UtensilsCrossed className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {hasSensorData ? `${latest_reading.humidity_pct}%` : '--'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasSensorData ? `Status: ${latest_reading.humidity_status}` : t('noData')}
          </p>
        </div>

        {/* Kitchen Temperature (DHT11) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Kitchen Temperature</span>
            <Thermometer className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {hasSensorData && latest_reading.temperature_c !== null && latest_reading.temperature_c !== undefined
                ? `${latest_reading.temperature_c}°C`
                : '--'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {hasSensorData ? 'DHT11 Thermal Sensor' : t('noData')}
          </p>
        </div>
      </div>

      {/* Middle Grid: Today's Meal & Active Node Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meal Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <UtensilsCrossed className="w-4 h-4 text-teal-600" />
              <span>{t('todayMeal')}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleDateString()}</span>
          </div>

          {today_meal ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Menu: </span>
                <strong className="text-teal-800 text-sm font-semibold">{today_meal.meal_type}</strong>
              </div>
              <p className="text-slate-700">{today_meal.menu_description}</p>
              <div className="pt-2 flex justify-between text-slate-500 text-[11px]">
                <span>Cook / Staff: <strong className="text-slate-800">{today_meal.staff_name}</strong></span>
                <span>Shift: <strong className="text-slate-800">{today_meal.inspection_shift}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500 text-xs italic">
              No meal logged for today yet. Use the Meal & Kitchen page to register today's preparation.
            </div>
          )}
        </div>

        {/* School Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Institution Incidents & Alerts</span>
            </h3>
            <span className="text-xs text-rose-700 font-mono font-bold">{active_alerts_count} Active</span>
          </div>

          {recent_alerts && recent_alerts.length > 0 ? (
            <div className="space-y-2">
              {recent_alerts.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded uppercase font-mono">{a.alert_type}</span>
                    <p className="text-slate-800 mt-1">{a.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500 text-xs italic">
              No Active Alerts. All parameters are normal.
            </div>
          )}
        </div>
      </div>

      <StaffUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        schoolName={school?.name}
        onUploadSuccess={fetchDashboard}
      />
    </div>
  );
};
