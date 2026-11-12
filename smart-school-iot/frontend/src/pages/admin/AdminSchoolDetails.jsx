import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Key,
  Cpu,
  AlertTriangle,
  UtensilsCrossed,
  ArrowLeft,
  RefreshCw,
  Droplets,
  Wifi,
  WifiOff,
  ArrowRight
} from 'lucide-react';

export const AdminSchoolDetails = () => {
  const { schoolId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      const res = await adminService.getSchoolDetails(schoolId);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  const { school, hardware, latest_reading } = data;

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/schools"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{school.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: <span className="text-teal-700 font-mono font-semibold">{school.school_code}</span> • District: {school.district}
            </p>
          </div>
        </div>

        <button
          onClick={fetchDetails}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* School Contact & Hardware Integration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Institution Contacts</h3>
          <div className="space-y-2 text-xs text-slate-700">
            <p className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Principal: <strong className="text-slate-900">{school.principal_name}</strong></span>
            </p>
            <p className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Email: <strong className="text-slate-900">{school.email}</strong></span>
            </p>
            <p className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Phone: <strong className="text-slate-900">{school.phone}</strong></span>
            </p>
            <p className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Address: {school.address}</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider">ESP32 Hardware Credentials</h3>
          <div className="space-y-2 text-xs text-slate-700">
            <p className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Device ID: <strong className="font-mono text-slate-900">{school.hardware_device_id}</strong></span>
            </p>
            <p className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-slate-400 shrink-0" />
              <span>API Key: <strong className="font-mono text-teal-700">{school.hardware_api_key}</strong></span>
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              Flash this Device ID and API Key into the physical ESP32 firmware config.h to bind telemetry to this school.
            </p>
          </div>
        </div>
      </div>

      {/* Water Quality & Kitchen Telemetry Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-900">Drinking Water Quality & Environmental Telemetry</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live physical sensor readings from ESP32 node for <span className="text-slate-900 font-semibold">{school.name}</span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              hardware.status === 'CONNECTED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {hardware.status === 'CONNECTED' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span>{hardware.label}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <span>{hardware.label}</span>
                </>
              )}
            </span>

            <Link
              to={`/admin/water?school_id=${school.id}`}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
              <Droplets className="w-4 h-4 text-teal-600" />
              <span>Turbidity Reading</span>
            </p>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {latest_reading?.turbidity_ntu !== undefined ? `${latest_reading.turbidity_ntu} NTU` : '--'}
              </span>
            </div>
            <p className={`text-[11px] font-semibold mt-1 ${
              latest_reading?.turbidity_status === 'GOOD' ? 'text-emerald-700' :
              latest_reading?.turbidity_status === 'MODERATE' ? 'text-amber-700' :
              latest_reading?.turbidity_status === 'POOR' ? 'text-rose-700' : 'text-slate-400'
            }`}>
              {latest_reading ? `Purity: ${latest_reading.turbidity_status}` : 'No Telemetry'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
              <UtensilsCrossed className="w-4 h-4 text-teal-600" />
              <span>Kitchen Humidity</span>
            </p>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {latest_reading?.humidity_pct !== undefined ? `${latest_reading.humidity_pct}%` : '--'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {latest_reading ? `Status: ${latest_reading.humidity_status}` : 'No Telemetry'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Kitchen Temperature</span>
            </p>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {latest_reading?.temperature_c !== null && latest_reading?.temperature_c !== undefined
                  ? `${latest_reading.temperature_c}°C`
                  : '--'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Ambient Temperature (DHT11)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
