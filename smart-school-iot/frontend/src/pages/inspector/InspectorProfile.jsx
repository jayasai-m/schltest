import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  LogOut
} from 'lucide-react';

export const InspectorProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const assignedSchools = user?.assigned_schools || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inspector Profile & Jurisdiction</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized Field Inspector credentials and assigned government school institutions
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xl">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {user?.status}
              </span>
            </div>
            <p className="text-xs text-teal-700 font-medium">{user?.district || 'Field Inspector Jurisdiction'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Email Address</span>
              <span className="text-slate-800 font-semibold">{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Access Role</span>
              <span className="text-slate-800 font-semibold">Field Inspector (MEO / Supervisor)</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Assigned District</span>
              <span className="text-slate-800 font-semibold">{user?.district || 'State Jurisdiction'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Schools Under Supervision</span>
              <span className="text-slate-800 font-semibold">{assignedSchools.length} Institutions Assigned</span>
            </div>
          </div>
        </div>

        {/* Assigned Schools Preview */}
        {assignedSchools.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Institutions ({assignedSchools.length}):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {assignedSchools.map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{s.name}</span>
                  <span className="text-[10px] font-mono text-teal-700 font-semibold">{s.school_code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
