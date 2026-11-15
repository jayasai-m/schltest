import React, { useState } from 'react';
import {
  X,
  UtensilsCrossed,
  Calendar,
  ExternalLink,
  MapPin,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { AP_MDM_ZONES, DAYS_OF_WEEK, getTodayDayName } from '../data/mdmMenu';

export const MdmMenuModal = ({ isOpen, onClose, defaultZone = 2 }) => {
  const [selectedZone, setSelectedZone] = useState(defaultZone);
  const todayDay = getTodayDayName();

  if (!isOpen) return null;

  const currentZoneData = AP_MDM_ZONES[selectedZone] || AP_MDM_ZONES[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg">
                  AP Mid-Day Meal Revised Menu 2025
                </h3>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Official W.E.F. 2025
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center space-x-1.5 mt-0.5">
                <span>Govt of Andhra Pradesh School Education Dept</span>
                <span>•</span>
                <span className="text-amber-300 font-medium">Zone-Wise Mandatory Diet Schedule</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zone Selector Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Select Zone:</span>
            </span>

            <div className="flex items-center space-x-2 overflow-x-auto">
              {[1, 2, 3, 4].map((zId) => {
                const z = AP_MDM_ZONES[zId];
                const isSelected = selectedZone === zId;
                return (
                  <button
                    key={zId}
                    type="button"
                    onClick={() => setSelectedZone(zId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-md ring-2 ring-teal-400'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {z.name}
                  </button>
                );
              })}
            </div>

            {/* Official PDF Download Link */}
            <a
              href={currentZoneData.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-white hover:bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-300 transition-colors shadow-xs"
            >
              <span>Download Zone {selectedZone} PDF</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* District Coverage Info */}
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-teal-50/70 border border-teal-200/80 text-[11px] text-teal-900 flex items-center justify-between">
            <div>
              <span className="font-bold">{currentZoneData.name} Districts Covered:</span>{' '}
              <span>{currentZoneData.districts}</span>
            </div>
            <span className="text-[10px] font-semibold text-teal-700 font-mono hidden sm:inline">
              Mandatory AI Quality Verification
            </span>
          </div>
        </div>

        {/* Weekly Menu Grid (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {DAYS_OF_WEEK.map((day) => {
              const dayMenu = currentZoneData.schedule[day];
              const isToday = day === todayDay;

              return (
                <div
                  key={day}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                    isToday
                      ? 'bg-gradient-to-br from-teal-50 to-emerald-50/50 border-teal-400 shadow-sm ring-1 ring-teal-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{day}</span>
                      </span>

                      {isToday ? (
                        <span className="text-[10px] font-extrabold bg-teal-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs animate-pulse">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>TODAY'S MENU</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-600 font-mono">
                          {currentZoneData.name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-teal-900 leading-snug">
                      {dayMenu.title}
                    </h4>

                    {/* Food Items Pill Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dayMenu.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-teal-200 text-teal-800 shadow-2xs"
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                      {dayMenu.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                    <span className="flex items-center space-x-1 text-teal-700 font-medium">
                      <CheckCircle className="w-3 h-3 text-teal-600" />
                      <span>Govt Diet Standard</span>
                    </span>
                    <span>Serving: 12:00 PM</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">
              Computer Vision checks midday meal photos against this exact Zone schedule.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Menu
          </button>
        </div>

      </div>
    </div>
  );
};
