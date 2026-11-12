import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { StaffUploadModal } from '../components/StaffUploadModal';
import {
  LayoutDashboard,
  Droplets,
  UtensilsCrossed,
  AlertTriangle,
  User,
  LogOut,
  Menu,
  X,
  School as SchoolIcon,
  PlusCircle,
  Mail
} from 'lucide-react';

export const SchoolLayout = () => {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { nameKey: 'dashboard', path: '/school/dashboard', icon: LayoutDashboard },
    { nameKey: 'waterQuality', path: '/school/water', icon: Droplets },
    { nameKey: 'mealKitchen', path: '/school/meals', icon: UtensilsCrossed },
    { nameKey: 'alerts', path: '/school/alerts', icon: AlertTriangle },
    { nameKey: 'messages', path: '/school/messages', icon: Mail },
    { nameKey: 'profile', path: '/school/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* School Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center shadow-xs">
              <SchoolIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900">SmartSchoolIoT</h1>
              <p className="text-[10px] text-teal-700 font-semibold tracking-wider uppercase">{t('schoolFieldNode')}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Identification Card */}
        <div className="m-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] font-bold tracking-wider text-teal-800 uppercase">{t('registeredInstitution')}</p>
          <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">{user?.school_name || 'ZPHS Poranki'}</p>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] text-emerald-700 font-semibold">{t('nodeActive')}</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                <span>{t(item.nameKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center font-bold text-teal-700 text-xs shrink-0">
                SCH
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500">{t('schoolOperator')}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                {user?.school_name || 'ZPHS Poranki'}
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-normal">
                • {t('fieldTelemetry')}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('uploadPhoto')}</span>
            </button>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Staff Upload Modal */}
      <StaffUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        schoolName={user?.school_name || 'ZPHS Poranki'}
        onUploadSuccess={() => {
          window.dispatchEvent(new Event('meal_uploaded'));
        }}
      />
    </div>
  );
};
