import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  ShieldCheck,
  Activity,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  Kanban,
  Users,
  BarChart3,
  UserCheck,
  History,
  Target,
} from 'lucide-react';
import { formatCompactRupiah } from '../utils/salesLogic';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenTargetModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, onOpenTargetModal }) => {
  const {
    currentUser,
    switchUser,
    activeTab,
    target,
    setIsCheckerOpen,
    theme,
    toggleTheme,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const tabMeta: Record<string, { label: string; icon: React.ElementType; desc: string }> = {
    overview: { label: 'Ringkasan Eksekutif', icon: LayoutDashboard, desc: 'Monitoring omset & performa penjualan' },
    pipeline: { label: 'Deal Pipeline Kanban', icon: Kanban, desc: 'Alur transaksi & tahapan proyek smart home' },
    customers: { label: 'Data Master Customer', icon: Users, desc: 'Database kontak klien B2B & residential' },
    analytics: { label: 'Laporan & Analitik', icon: BarChart3, desc: 'Kalkulasi win rate & performa sales' },
    team: { label: 'Manajemen Tim Sales', icon: UserCheck, desc: 'Hak akses RBAC & kuota target individu' },
    logs: { label: 'Log Audit Aktivitas', icon: History, desc: 'Pencatatan riwayat perubahan real-time' },
  };

  const currentMeta = tabMeta[activeTab] || tabMeta.overview;
  const TabIcon = currentMeta.icon;
  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Page Title / Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Hamburger trigger for mobile */}
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              <TabIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                  Dashboard /
                </span>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentMeta.label}
                </h1>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
                {currentMeta.desc}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Target Badge, Theme Switcher, Auto-Checker, & User Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Quick Target Pill */}
          <div
            onClick={isSuperAdmin ? onOpenTargetModal : undefined}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs ${
              isSuperAdmin ? 'cursor-pointer hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors' : ''
            }`}
            title={isSuperAdmin ? 'Klik untuk mengubah Target Sales' : 'Target Perusahaan'}
          >
            <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Target Bulan Ini:</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCompactRupiah(target.monthlyTarget)}
              </span>
            </div>
          </div>

          {/* Auto Checker Shortcut */}
          <button
            onClick={() => setIsCheckerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition-all"
            title="Auto-Checker Sistem & Integritas Data"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Auto-Checker</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Theme Toggle Button (Terang / Gelap) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Mode Terang/Gelap"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* User Profile Pill & Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-left"
              aria-label="User profile and role menu"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-2xs ${
                  isSuperAdmin ? 'bg-amber-500' : 'bg-blue-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block leading-tight pr-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                  {currentUser.title}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Switch Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                  </div>
                </div>

                <div className="py-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Ganti Peran:
                  </p>
                  <button
                    onClick={() => {
                      switchUser('super_admin');
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                      currentUser.role === 'super_admin'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Fitroh Adhiansyah</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Senior Sales Exec (Super Admin)</div>
                    </div>
                    {currentUser.role === 'super_admin' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      switchUser('admin');
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left mt-0.5 ${
                      currentUser.role === 'admin'
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Rian Pratama</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Account Executive (Admin)</div>
                    </div>
                    {currentUser.role === 'admin' && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
