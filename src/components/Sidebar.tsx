import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Kanban,
  Users,
  BarChart3,
  UserCheck,
  History,
  Activity,
  Target,
  Sun,
  Moon,
  ShieldCheck,
  ChevronDown,
  X,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTargetModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenTargetModal }) => {
  const {
    currentUser,
    switchUser,
    activeTab,
    setActiveTab,
    deals,
    customers,
    team,
    setIsCheckerOpen,
    theme,
    toggleTheme,
    clearAllData,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Navigation Items with Icons & Counter Badges
  const navItems = [
    {
      id: 'overview' as const,
      label: 'Ringkasan',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pipeline' as const,
      label: 'Deal Pipeline',
      icon: Kanban,
      badge: deals.length > 0 ? `${deals.length}` : null,
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      id: 'customers' as const,
      label: 'Data Customer',
      icon: Users,
      badge: customers.length > 0 ? `${customers.length}` : null,
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    },
    {
      id: 'analytics' as const,
      label: 'Laporan & Analitik',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'team' as const,
      label: 'Manajemen Tim',
      icon: UserCheck,
      badge: team.length > 0 ? `${team.length}` : null,
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    },
    {
      id: 'logs' as const,
      label: 'Log Aktivitas',
      icon: History,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <img
                src="https://cdn.phototourl.com/member/2026-10-06-38c44a0b-42b2-4cf2-92e7-131a0c3708f0.png"
                alt="BIOTA Smarthome"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  BIOTA SMARTHOME
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                  PRO
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                Sales Project Dashboard
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Main Navigation Group */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menu Utama
              </span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full tabular-nums ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System & Tools Group */}
          <div>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Sistem & Pengaturan
              </span>
            </div>
            <div className="space-y-1.5">
              {/* Auto-Checker Button */}
              <button
                onClick={() => {
                  setIsCheckerOpen(true);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span>Auto-Checker Sistem</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Online
                </span>
              </button>

              {/* Target Sales shortcut for Super Admin */}
              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => {
                      onOpenTargetModal();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800/60 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-amber-500" />
                      <span>Ubah Target Sales</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Bersihkan seluruh data transaksi dan customer dummy agar dashboard bersih (clear)?')) {
                        clearAllData();
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800/60 transition-all"
                    title="Kosongkan seluruh data dummy transaksi & customer"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Bersihkan Data (Clear All)</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Theme Switcher & User Profile */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0 space-y-3">
          {/* Mode Terang / Gelap Toggle Switch */}
          <div className="flex items-center justify-between p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => { if (theme !== 'light') toggleTheme(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Terang</span>
            </button>
            <button
              type="button"
              onClick={() => { if (theme !== 'dark') toggleTheme(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Gelap</span>
            </button>
          </div>

          {/* User Profile Card & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left shadow-2xs group"
              aria-label="Menu Pengguna"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                    isSuperAdmin
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-500'
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.title}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Role Switcher Popover Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{currentUser.role === 'super_admin' ? 'Super Admin Role' : 'Staff Admin Role'}</span>
                  </div>
                </div>

                <div className="py-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Ganti Akun & Peran:
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {team.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          switchUser(member.id);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                          currentUser.id === member.id
                            ? member.role === 'super_admin'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold truncate">{member.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {member.title} ({member.role === 'super_admin' ? 'Super Admin' : 'Admin'})
                          </div>
                        </div>
                        {currentUser.id === member.id && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              member.role === 'super_admin' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
