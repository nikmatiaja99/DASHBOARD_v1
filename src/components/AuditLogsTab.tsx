import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActionCategory } from '../types/index';
import {
  History,
  Search,
  Filter,
  Shield,
  User,
  Clock,
  LogIn,
  Layers,
  Users,
  Settings,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const AuditLogsTab: React.FC = () => {
  const { logs } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCategory = selectedCategory === 'ALL' || log.actionCategory === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        log.description.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.actionType.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [logs, selectedCategory, searchQuery]);

  const categories: { id: ActionCategory | 'ALL'; label: string; icon: any }[] = [
    { id: 'ALL', label: 'Semua Log', icon: History },
    { id: 'AUTH', label: 'Login & Sesi', icon: LogIn },
    { id: 'DEAL', label: 'Transaksi Deal', icon: Layers },
    { id: 'CUSTOMER', label: 'Data Customer', icon: Users },
    { id: 'TEAM', label: 'Tim Sales', icon: User },
    { id: 'SETTING', label: 'Target & Sistem', icon: Settings },
  ];

  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Log Audit Aktivitas Real-time
          </h1>
          <p className="text-xs text-slate-500">
            Rekam jejak seluruh penambahan, perubahan status, perpindahan deal, dan histori login pengguna
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Total Tercatat: <strong className="text-slate-800 tabular-nums">{logs.length}</strong> entri
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas atau nama personil..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-slate-200 focus:border-slate-900 outline-none"
          />
        </div>

        {/* Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs divide-y divide-slate-100">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada riwayat aktivitas yang sesuai dengan filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isSuper = log.userRole === 'super_admin';
            return (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      log.actionCategory === 'AUTH'
                        ? 'bg-purple-50 text-purple-700'
                        : log.actionCategory === 'DEAL'
                        ? 'bg-blue-50 text-blue-700'
                        : log.actionCategory === 'CUSTOMER'
                        ? 'bg-emerald-50 text-emerald-700'
                        : log.actionCategory === 'TEAM'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {log.actionCategory === 'AUTH' && <LogIn className="w-4 h-4" />}
                    {log.actionCategory === 'DEAL' && <Layers className="w-4 h-4" />}
                    {log.actionCategory === 'CUSTOMER' && <Users className="w-4 h-4" />}
                    {log.actionCategory === 'TEAM' && <User className="w-4 h-4" />}
                    {log.actionCategory === 'SETTING' && <Settings className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-900 font-medium leading-relaxed">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span className="font-semibold text-slate-700">{log.userName}</span>
                      <span>·</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isSuper ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isSuper ? 'Senior Sales Exec (Super Admin)' : 'Account Exec (Admin)'}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-slate-400 uppercase">{log.actionType}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-slate-400 self-end sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{formatLogTime(log.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
