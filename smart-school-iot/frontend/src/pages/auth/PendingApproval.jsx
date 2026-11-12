import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

export const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-slate-200 py-10 px-6 shadow-sm rounded-xl sm:px-10 text-center">
          
          <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center mb-5">
            <Clock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Registration Submitted
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Your registration is awaiting administrator approval.
          </p>

          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Account Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                PENDING APPROVAL
              </span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              State monitoring officials review and authorize new registrations (School Nodes and Field Inspectors) before granting portal and IoT access. Please check back after administrator review.
            </p>
          </div>

          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Login Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
