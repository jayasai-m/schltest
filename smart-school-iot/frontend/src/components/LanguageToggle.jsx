import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { lang, setLanguage, languages } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all text-xs font-medium shadow-sm"
        title="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-teal-600" />
        <span className="hidden sm:inline font-semibold">{current.nativeLabel}</span>
        <span className="sm:hidden font-semibold">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-50 overflow-hidden py-1">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Select Language</p>
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                lang === l.code ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'
              }`}
            >
              <div>
                <p className="text-xs leading-none font-medium">{l.nativeLabel}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{l.label}</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {l.tag || l.code.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
