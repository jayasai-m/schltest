import React from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, Clock, Droplets, Gauge } from 'lucide-react';

export const WaterTankDigitalTwin = ({
  schoolName,
  tankCapacity = 2000,
  tankHeight = 200,
  sensorData = null,
  hardwareStatus = 'DISCONNECTED',
  hardwareLabel = 'Hardware Not Connected',
  lastUpdate = null
}) => {
  const isConnected = hardwareStatus === 'CONNECTED';
  const hasData = isConnected && sensorData !== null && sensorData !== undefined;

  // Real values or strict placeholders
  const waterLevelPct = hasData && sensorData.water_level_pct !== undefined ? sensorData.water_level_pct : null;
  const waterLitres = hasData && sensorData.water_volume_litres !== undefined ? sensorData.water_volume_litres : null;
  const distanceCm = hasData && sensorData.distance_cm !== undefined ? sensorData.distance_cm : null;
  const ultrasonicStatus = hasData ? (sensorData.ultrasonic_status || 'NORMAL') : 'DISCONNECTED';
  const turbidityNtu = hasData && sensorData.turbidity_ntu !== undefined ? sensorData.turbidity_ntu : null;
  const turbidityStatus = hasData ? (sensorData.turbidity_status || 'GOOD') : 'DISCONNECTED';

  // Dynamic tank water appearance based on real turbidity
  const isTurbid = turbidityStatus === 'POOR' || (turbidityNtu && turbidityNtu > 5.0);
  const waterColorClass = isTurbid
    ? 'from-amber-500/70 via-amber-600/80 to-amber-700/90'
    : 'from-cyan-400/80 via-teal-500/85 to-teal-600/90';

  const waterSurfaceColor = isTurbid ? '#d97706' : '#0d9488';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900">Physical Water Tank Digital Twin</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-semibold uppercase tracking-wider">
              IoT Twin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cyber-physical model for <span className="text-slate-800 font-medium">{schoolName || 'ZPHS Poranki'}</span>
          </p>
        </div>

        {/* Hardware Status Pill */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>{hardwareLabel || 'ESP32 Connected'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span>{hardwareLabel || 'Hardware Not Connected'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Twin Graphic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-center">
        {/* Left Column: Visual Tank Representation */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4">
          <div className="relative w-72 sm:w-80 h-96 flex items-center justify-center">
            
            {/* Sensor Transducer Housing mounted at top */}
            <div className="absolute top-0 z-20 flex flex-col items-center">
              <div className="bg-slate-200 border border-slate-300 px-3 py-1 rounded-t-md text-[10px] font-mono text-slate-700 shadow-xs">
                {waterLevelPct !== null ? 'HC-SR04 Ultrasonic' : 'Water Quality Probe'}
              </div>
              <div className="w-16 h-4 bg-slate-300 border-x border-b border-slate-400 flex justify-around items-center px-1">
                <div className="w-3 h-3 rounded-full bg-white border border-teal-600 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-teal-600"></span>
                </div>
                <div className="w-3 h-3 rounded-full bg-white border border-teal-600"></div>
              </div>

              {/* Pulsing Echo Waves (Only when hardware is actively transmitting) */}
              {hasData && (
                <div className="flex flex-col items-center space-y-1 mt-1">
                  <div className="w-6 h-0.5 border-b-2 border-teal-600/80 rounded-full animate-pulse"></div>
                  <div className="w-10 h-0.5 border-b-2 border-teal-600/60 rounded-full animate-pulse delay-100"></div>
                  <div className="w-14 h-0.5 border-b-2 border-teal-600/40 rounded-full animate-pulse delay-200"></div>
                </div>
              )}
            </div>

            {/* Physical Cylindrical Tank Wall Frame */}
            <div className={`relative w-64 h-80 rounded-3xl border-4 ${
              hasData ? 'border-slate-300 bg-slate-50 shadow-inner' : 'border-dashed border-slate-300 bg-slate-50/60'
            } overflow-hidden flex flex-col justify-end`}>
              
              {/* Measurement Rulers / Graduation lines */}
              <div className="absolute inset-y-4 right-2 z-20 flex flex-col justify-between text-[10px] font-mono text-slate-400 pointer-events-none select-none">
                <span className="flex items-center space-x-1"><span>100%</span><span className="w-2 h-0.5 bg-slate-300"></span></span>
                <span className="flex items-center space-x-1"><span>75%</span><span className="w-1.5 h-0.5 bg-slate-300"></span></span>
                <span className="flex items-center space-x-1"><span>50%</span><span className="w-2 h-0.5 bg-slate-300"></span></span>
                <span className="flex items-center space-x-1"><span>25%</span><span className="w-1.5 h-0.5 bg-slate-300"></span></span>
                <span className="flex items-center space-x-1"><span>0%</span><span className="w-2 h-0.5 bg-slate-300"></span></span>
              </div>

              {/* Inflow Pipe on top left */}
              <div className="absolute top-6 -left-3 w-6 h-3 bg-slate-300 border border-slate-400 rounded-r-none"></div>

              {/* Outflow Drinking Water Valve at bottom left */}
              <div className="absolute bottom-6 -left-3 w-6 h-3 bg-slate-300 border border-slate-400 rounded-r-none"></div>

              {/* Water Fill Column */}
              {hasData ? (
                <div
                  className="w-full relative transition-all duration-1000 ease-out"
                  style={{ height: waterLevelPct !== null ? `${Math.max(2, Math.min(100, waterLevelPct))}%` : '80%' }}
                >
                  {/* Water Surface Wave Line */}
                  <div
                    className="absolute -top-2 inset-x-0 h-4 rounded-full opacity-80"
                    style={{
                      backgroundColor: waterSurfaceColor,
                      filter: 'drop-shadow(0 0 4px rgba(13, 148, 136, 0.4))'
                    }}
                  />

                  {/* Liquid Body */}
                  <div className={`w-full h-full bg-gradient-to-t ${waterColorClass} backdrop-blur-xs relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  </div>
                </div>
              ) : (
                /* Hardware Not Connected / No Data Blueprint Placeholder */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                    <WifiOff className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Waiting for Sensor Data</p>
                  <p className="text-xs text-slate-500 mt-1">Connect physical ESP32 to visualize real water column</p>
                </div>
              )}
            </div>

            {/* Physical Tank Base Pedestal */}
            <div className="absolute bottom-1 w-72 h-4 bg-slate-300 border border-slate-400 rounded-t-lg shadow-xs"></div>
          </div>
        </div>

        {/* Right Column: Telemetry Digital Telemetry Matrix */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Metric Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            {waterLevelPct !== null ? (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Gauge className="w-4 h-4 text-teal-600" />
                    <span>Water Storage Level</span>
                  </span>
                  <span className="font-mono text-slate-500">Cap: {tankCapacity} L</span>
                </div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
                    {hasData ? `${waterLevelPct}%` : '--'}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    {hasData && waterLitres !== null ? `(${waterLitres} Litres)` : '(No Data)'}
                  </span>
                </div>

                <div className="mt-3">
                  {hasData ? (
                    <div className="flex items-center space-x-2">
                      {ultrasonicStatus === 'NORMAL' && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Level Normal</span>
                        </span>
                      )}
                      {ultrasonicStatus === 'LOW' && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Low Reserve Condition</span>
                        </span>
                      )}
                      {ultrasonicStatus === 'OVERFLOW' && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Overflow Warning</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No sensor telemetry available</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Droplets className="w-4 h-4 text-teal-600" />
                    <span>Drinking Water Quality</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">Turbidity Active</span>
                </div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
                    {hasData && turbidityNtu !== null ? `${turbidityNtu} NTU` : '--'}
                  </span>
                  <span className={`text-xs font-bold uppercase ${
                    turbidityStatus === 'GOOD' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {hasData ? `Purity: ${turbidityStatus}` : 'Sensor Offline'}
                  </span>
                </div>
                <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
                  <span className="text-[11px]">Ultrasonic water level sensor disabled. Monitoring purity & kitchen hygiene.</span>
                </div>
              </>
            )}
          </div>

          {/* Sensor Diagnostics Sub-Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Kitchen Humidity */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[11px] font-medium text-slate-500">Kitchen Humidity</p>
              <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                {hasData && sensorData?.humidity_pct !== undefined ? `${sensorData.humidity_pct}%` : '--'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">DHT11 Environmental</p>
            </div>

            {/* Drinking Water Turbidity */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[11px] font-medium text-slate-500 flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-teal-600" />
                <span>Turbidity</span>
              </p>
              <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                {hasData && turbidityNtu !== null ? `${turbidityNtu} NTU` : '--'}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 ${
                turbidityStatus === 'GOOD' ? 'text-emerald-700' :
                turbidityStatus === 'MODERATE' ? 'text-amber-700' :
                turbidityStatus === 'POOR' ? 'text-rose-700' : 'text-slate-400'
              }`}>
                {hasData ? `Quality: ${turbidityStatus}` : 'Disconnected'}
              </p>
            </div>
          </div>

          {/* Last Sensor Ping Footer */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Telemetry Update:</span>
            </span>
            <span className="font-mono text-slate-700 font-medium">
              {hasData && (lastUpdate || sensorData?.recorded_at)
                ? new Date(lastUpdate || sensorData.recorded_at).toLocaleTimeString()
                : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
