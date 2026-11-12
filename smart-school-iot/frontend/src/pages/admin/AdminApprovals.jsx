import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Building2,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export const AdminApprovals = () => {
  const [activeTab, setActiveTab] = useState('SCHOOLS'); // 'SCHOOLS' or 'INSPECTORS'
  const [pendingSchools, setPendingSchools] = useState([]);
  const [pendingInspectors, setPendingInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchApprovals = async () => {
    try {
      const [schoolsRes, inspectorsRes] = await Promise.all([
        adminService.getApprovals(),
        adminService.getPendingInspectors()
      ]);
      setPendingSchools(schoolsRes.data);
      setPendingInspectors(inspectorsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleSchoolAction = async (schoolId, action) => {
    setActionLoading(true);
    setStatusMessage('');
    try {
      await adminService.processApproval(schoolId, action, `Processed via State Nodal Approval Portal`);
      setStatusMessage(`School #${schoolId} was successfully marked as ${action}!`);
      fetchApprovals();
    } catch (err) {
      console.error(err);
      setStatusMessage('Error updating school registration status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectorAction = async (inspectorId, action) => {
    setActionLoading(true);
    setStatusMessage('');
    try {
      await adminService.processInspectorApproval(inspectorId, action, `Processed via State Nodal Portal`);
      setStatusMessage(`Field Inspector #${inspectorId} was successfully marked as ${action}!`);
      fetchApprovals();
    } catch (err) {
      console.error(err);
      setStatusMessage('Error updating inspector request status.');
    } finally {
      setActionLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional & Inspector Approvals</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, verify, and authorize new government school nodes and field inspectors for network activation
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('SCHOOLS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'SCHOOLS'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>School Registrations</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${pendingSchools.length > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>
            {pendingSchools.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INSPECTORS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'INSPECTORS'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Field Inspector Requests</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${pendingInspectors.length > 0 ? 'bg-teal-100 text-teal-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>
            {pendingInspectors.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SCHOOL APPROVALS */}
      {activeTab === 'SCHOOLS' && (
        pendingSchools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Pending School Approvals</h3>
            <p className="text-xs text-slate-500 mt-1">
              All registered government school applications have been reviewed and verified.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingSchools.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                      {s.school_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Location:</span>
                      <span className="font-medium text-slate-800">{s.district}, {s.state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Headmaster / Principal:</span>
                      <span className="font-medium text-slate-800">{s.principal_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contact Info:</span>
                      <span className="font-medium text-slate-800">{s.email} • {s.phone}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submitted on: {new Date(s.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleSchoolAction(s.id, 'APPROVE')}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APPROVE</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleSchoolAction(s.id, 'FLAG')}
                    className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>FLAG</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleSchoolAction(s.id, 'REJECT')}
                    className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECT</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB 2: INSPECTOR APPROVALS */}
      {activeTab === 'INSPECTORS' && (
        pendingInspectors.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Pending Inspector Requests</h3>
            <p className="text-xs text-slate-500 mt-1">
              All field inspector onboarding submissions have been reviewed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingInspectors.map((ins) => (
              <div
                key={ins.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-slate-900">{ins.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {ins.district}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                      {ins.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email:</span>
                      <span className="font-medium text-slate-800">{ins.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone:</span>
                      <span className="font-medium text-slate-800">{ins.phone}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submitted on: {new Date(ins.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleInspectorAction(ins.id, 'APPROVE')}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APPROVE</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleInspectorAction(ins.id, 'REJECT')}
                    className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECT</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
