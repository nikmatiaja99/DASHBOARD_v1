import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatRupiah,
  formatCompactRupiah,
  calculatePipelineSummary,
  calculateTargetPerformance,
  filterDealsByPeriod,
} from '../utils/salesLogic';
import { DEAL_STAGES, FilterPeriod } from '../types/index';
import {
  TrendingUp,
  Target,
  Award,
  CircleDollarSign,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface OverviewTabProps {
  onOpenTargetModal: () => void;
  onNavigateToPipeline: (stage?: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenTargetModal, onNavigateToPipeline }) => {
  const { deals, target, currentUser } = useApp();
  const [piePeriod, setPiePeriod] = useState<FilterPeriod>('month');

  // Filter deals for pie/donut calculation based on selected period
  const filteredDealsForPie = useMemo(() => {
    return filterDealsByPeriod(deals, piePeriod);
  }, [deals, piePeriod]);

  // Overall pipeline summary
  const overallSummary = useMemo(() => {
    return calculatePipelineSummary(deals);
  }, [deals]);

  // Target performance
  const targetPerf = useMemo(() => {
    return calculateTargetPerformance(overallSummary.wonTotal, target.monthlyTarget);
  }, [overallSummary.wonTotal, target.monthlyTarget]);

  // Stage breakdown for the selected pie period
  const pieStageMetrics = useMemo(() => {
    const stageMap: Record<string, number> = {
      lead_in: 0,
      follow_up: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };
    filteredDealsForPie.forEach((d) => {
      if (stageMap[d.stage] !== undefined) {
        stageMap[d.stage] += d.value;
      }
    });
    const totalVal = Object.values(stageMap).reduce((a, b) => a + b, 0);

    return DEAL_STAGES.map((s) => {
      const val = stageMap[s.id] || 0;
      const pct = totalVal > 0 ? (val / totalVal) * 100 : 0;
      return {
        ...s,
        value: val,
        percentage: Math.round(pct * 10) / 10,
      };
    });
  }, [filteredDealsForPie]);

  // Simulated Monthly Omset comparison for Chart
  const monthlyOmsetData = useMemo(() => {
    return [
      { month: 'Jun', target: 2000000000, actual: 1850000000 },
      { month: 'Jul', target: 2000000000, actual: 2150000000 },
      { month: 'Agu', target: 2200000000, actual: 2050000000 },
      { month: 'Sep', target: 2200000000, actual: 2400000000 },
      { month: 'Okt (Bulan Ini)', target: target.monthlyTarget, actual: overallSummary.wonTotal },
    ];
  }, [target.monthlyTarget, overallSummary.wonTotal]);

  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Ringkasan Performa Penjualan Proyek
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring transaksi smart home, pipeline per tahapan, dan realisasi target omset BIOTA
          </p>
        </div>

        {/* Target sales quick display / superadmin edit button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 block">Target Bulan Ini</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatRupiah(target.monthlyTarget)}
            </span>
          </div>
          {isSuperAdmin ? (
            <button
              onClick={onOpenTargetModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-xs"
              title="Atur Target Sales (Super Admin)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Target</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded">
              Akses Target: Super Admin
            </span>
          )}
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Realisasi Omset (Won) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Realisasi Omset (Won)</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums currency-val tracking-tight">
            {formatRupiah(overallSummary.wonTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{overallSummary.wonCount} deal berhasil closed</span>
            <span className="font-semibold text-emerald-600 tabular-nums">
              {targetPerf.percentage}% Target
            </span>
          </div>
        </div>

        {/* Card 2: Active Pipeline Value */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Nilai Pipeline Aktif</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums currency-val tracking-tight">
            {formatRupiah(overallSummary.totalActiveValue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{overallSummary.totalActiveCount} proyek berjalan</span>
            <span className="text-slate-600">Lead, Follow up, Proposal</span>
          </div>
        </div>

        {/* Card 3: Target Progress & Gap */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sisa Menuju Target</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums currency-val tracking-tight">
            {targetPerf.isTargetAchieved ? 'Tercapai! 🎉' : formatRupiah(targetPerf.remaining)}
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                targetPerf.isTargetAchieved ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, targetPerf.percentage)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Total Transaksi & Win Rate */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Win Rate & Rata-rata Deal</span>
            <span className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <CircleDollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums currency-val tracking-tight">
            {overallSummary.winRate}% <span className="text-xs font-normal text-slate-500">Win Rate</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Rata-rata: {formatCompactRupiah(overallSummary.avgDealSize)}</span>
            <span>Total: {overallSummary.totalDealsCount} Deal</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie / Donut Chart: Nilai Pipeline per Tahapan (with period filter) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Nilai Pipeline per Tahapan</h2>
                <p className="text-[11px] text-slate-500">Distribusi nominal transaksi aktif & selesai</p>
              </div>

              {/* Period Filter for Pie Chart */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                {(['week', 'month', 'quarter', 'all'] as FilterPeriod[]).map((p) => {
                  const labelMap: Record<string, string> = {
                    week: 'Minggu',
                    month: 'Bulan',
                    quarter: 'Kuartal',
                    all: 'Semua',
                  };
                  return (
                    <button
                      key={p}
                      onClick={() => setPiePeriod(p)}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                        piePeriod === p
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {labelMap[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom SVG Donut / Pie Visualization */}
            <div className="py-3 flex flex-col items-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800/80"
                    strokeWidth="16"
                  />
                  {/* Stage segments */}
                  {(() => {
                    let cumulativePercent = 0;
                    return pieStageMetrics.map((item) => {
                      if (item.percentage <= 0) return null;
                      const strokeDasharray = `${item.percentage * 2.387} 238.7`;
                      const strokeDashoffset = `${-cumulativePercent * 2.387}`;
                      cumulativePercent += item.percentage;
                      return (
                        <circle
                          key={item.id}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="16"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:opacity-85"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center text */}
                <div className="absolute text-center">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Nilai</span>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">
                    {formatCompactRupiah(filteredDealsForPie.reduce((a, b) => a + b.value, 0))}
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full mt-4 space-y-2">
                {pieStageMetrics.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 tabular-nums">{item.percentage}%</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCompactRupiah(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grafik Performa Omset Sales (Bar Chart Target vs Realisasi) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Grafik Performa Omset Sales</h2>
                <p className="text-[11px] text-slate-500">Perbandingan target vs omset won per bulan (IDR)</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-300" />
                  <span className="text-slate-600">Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span className="text-slate-600 font-medium">Realisasi (Won)</span>
                </div>
              </div>
            </div>

            {/* Bar Visualization */}
            <div className="h-56 flex items-end gap-6 pt-6 pb-2 border-b border-slate-100">
              {monthlyOmsetData.map((item, idx) => {
                const maxScale = 3_000_000_000;
                const targetHeight = Math.min(100, (item.target / maxScale) * 100);
                const actualHeight = Math.min(100, (item.actual / maxScale) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Target bar */}
                      <div
                        className="w-4 bg-slate-200 dark:bg-slate-700/80 rounded-t-xs transition-all duration-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                        style={{ height: `${targetHeight}%` }}
                        title={`Target: ${formatRupiah(item.target)}`}
                      />
                      {/* Actual Won bar */}
                      <div
                        className="w-4 bg-emerald-500 rounded-t-xs transition-all duration-300 group-hover:bg-emerald-600"
                        style={{ height: `${actualHeight}%` }}
                        title={`Realisasi: ${formatRupiah(item.actual)}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 mt-2 truncate max-w-full">
                      {item.month}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-800 tabular-nums">
                      {formatCompactRupiah(item.actual)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Catatan: Data bulan Oktober berjalan otomatis terakumulasi dari deal dengan status Won.</span>
            <button
              onClick={() => onNavigateToPipeline('won')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              Lihat Deal Won
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Ringkasan Tahapan Sales Pipeline (Cards with direct link to Kanban) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Ringkasan Tahapan Sales Pipeline</h2>
          <button
            onClick={() => onNavigateToPipeline()}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            Buka Papan Kanban
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {DEAL_STAGES.map((stage) => {
            const data = overallSummary.summary[stage.id];
            return (
              <button
                key={stage.id}
                onClick={() => onNavigateToPipeline(stage.id)}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{stage.label}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatCompactRupiah(data.totalValue)}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{data.count} transaksi deal</span>
                  <span className="font-semibold text-slate-700">Detail &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
