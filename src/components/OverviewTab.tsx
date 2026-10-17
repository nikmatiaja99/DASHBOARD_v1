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
  CheckCircle2,
  ChevronRight,
  BarChart2,
  Layers,
} from 'lucide-react';

interface OverviewTabProps {
  onOpenTargetModal: () => void;
  onNavigateToPipeline: (stage?: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onOpenTargetModal, onNavigateToPipeline }) => {
  const { deals, target, currentUser } = useApp();
  const [piePeriod, setPiePeriod] = useState<FilterPeriod>('all');
  const [chartMode, setChartMode] = useState<'stages' | 'trend'>('stages');

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
    const stageMap: Record<string, { value: number; count: number }> = {
      lead_in: { value: 0, count: 0 },
      follow_up: { value: 0, count: 0 },
      proposal: { value: 0, count: 0 },
      won: { value: 0, count: 0 },
      lost: { value: 0, count: 0 },
    };

    filteredDealsForPie.forEach((d) => {
      if (stageMap[d.stage] !== undefined) {
        stageMap[d.stage].value += d.value;
        stageMap[d.stage].count += 1;
      }
    });

    const totalVal = Object.values(stageMap).reduce((a, b) => a + b.value, 0);

    return DEAL_STAGES.map((s) => {
      const data = stageMap[s.id] || { value: 0, count: 0 };
      const pct = totalVal > 0 ? (data.value / totalVal) * 100 : 0;
      return {
        ...s,
        value: data.value,
        count: data.count,
        percentage: Math.round(pct * 10) / 10,
      };
    });
  }, [filteredDealsForPie]);

  const totalPieValue = useMemo(() => {
    return filteredDealsForPie.reduce((a, b) => a + b.value, 0);
  }, [filteredDealsForPie]);

  // Real-time Pipeline Stages comparison data for Bar Chart
  const pipelineBarData = useMemo(() => {
    return [
      {
        id: 'lead_in',
        label: 'Lead In',
        value: overallSummary.summary.lead_in.totalValue,
        count: overallSummary.summary.lead_in.count,
        color: '#2563eb', // Blue
      },
      {
        id: 'follow_up',
        label: 'Follow Up',
        value: overallSummary.summary.follow_up.totalValue,
        count: overallSummary.summary.follow_up.count,
        color: '#f59e0b', // Amber
      },
      {
        id: 'proposal',
        label: 'Proposal',
        value: overallSummary.summary.proposal.totalValue,
        count: overallSummary.summary.proposal.count,
        color: '#8b5cf6', // Purple
      },
      {
        id: 'won',
        label: 'Won (Closing)',
        value: overallSummary.wonTotal,
        count: overallSummary.wonCount,
        color: '#10b981', // Emerald
      },
      {
        id: 'lost',
        label: 'Lost',
        value: overallSummary.summary.lost.totalValue,
        count: overallSummary.summary.lost.count,
        color: '#ef4444', // Red
      },
      {
        id: 'target',
        label: 'Target Bulan Ini',
        value: target.monthlyTarget,
        count: 0,
        color: '#64748b', // Slate
        isTarget: true,
      },
    ];
  }, [overallSummary, target.monthlyTarget]);

  // Real-time Monthly Omset (Computed strictly from deals, zero fake numbers)
  const monthlyOmsetData = useMemo(() => {
    const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt (Bulan Ini)'];
    return months.map((m, idx) => {
      if (idx === 4) {
        return {
          month: m,
          target: target.monthlyTarget,
          actual: overallSummary.wonTotal,
        };
      }
      // Calculate any historical deals won in that calendar month
      const pastWon = deals
        .filter(d => d.stage === 'won' && d.createdAt && new Date(d.createdAt).getMonth() === idx + 5)
        .reduce((sum, d) => sum + d.value, 0);

      return {
        month: m,
        target: target.monthlyTarget,
        actual: pastWon,
      };
    });
  }, [target.monthlyTarget, overallSummary.wonTotal, deals]);

  // Dynamic maximum scale for bar heights
  const maxBarValue = useMemo(() => {
    if (chartMode === 'stages') {
      const vals = pipelineBarData.map(d => d.value);
      return Math.max(...vals, 1_000_000);
    } else {
      const vals = monthlyOmsetData.flatMap(d => [d.target, d.actual]);
      return Math.max(...vals, 1_000_000);
    }
  }, [chartMode, pipelineBarData, monthlyOmsetData]);

  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ringkasan Performa Penjualan Proyek
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoring transaksi smart home, pipeline per tahapan, dan realisasi target omset BIOTA
          </p>
        </div>

        {/* Target sales quick display / superadmin edit button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Target Bulan Ini</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
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
            <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              Akses Target: Super Admin
            </span>
          )}
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Realisasi Omset (Won) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Realisasi Omset (Won)</span>
            <span className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums currency-val tracking-tight">
            {formatRupiah(overallSummary.wonTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{overallSummary.wonCount} deal berhasil closed</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {targetPerf.percentage}% Target
            </span>
          </div>
        </div>

        {/* Card 2: Active Pipeline Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Nilai Pipeline Aktif</span>
            <span className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums currency-val tracking-tight">
            {formatRupiah(overallSummary.totalActiveValue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{overallSummary.totalActiveCount} proyek berjalan</span>
            <span className="text-slate-600 dark:text-slate-400">Lead, Follow up, Proposal</span>
          </div>
        </div>

        {/* Card 3: Target Progress & Gap */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Sisa Menuju Target</span>
            <span className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums currency-val tracking-tight">
            {targetPerf.isTargetAchieved ? 'Tercapai! 🎉' : formatRupiah(targetPerf.remaining)}
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                targetPerf.isTargetAchieved ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, targetPerf.percentage)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Total Transaksi & Win Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Win Rate & Rata-rata Deal</span>
            <span className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <CircleDollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums currency-val tracking-tight">
            {overallSummary.winRate}% <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Win Rate</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Rata-rata: {formatCompactRupiah(overallSummary.avgDealSize)}</span>
            <span>Total: {overallSummary.totalDealsCount} Deal</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie / Donut Chart: Nilai Pipeline per Tahapan (with period filter) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Nilai Pipeline per Tahapan</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribusi nominal transaksi aktif & selesai</p>
              </div>

              {/* Period Filter for Pie Chart */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
                {(['all', 'month', 'quarter', 'week'] as FilterPeriod[]).map((p) => {
                  const labelMap: Record<string, string> = {
                    all: 'Semua',
                    month: 'Bulan',
                    quarter: 'Kuartal',
                    week: 'Minggu',
                  };
                  return (
                    <button
                      key={p}
                      onClick={() => setPiePeriod(p)}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                        piePeriod === p
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                    className="text-slate-100 dark:text-slate-800"
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
                <div className="absolute text-center px-2">
                  <span className="text-[10px] text-slate-400 font-medium block">Total Nilai</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCompactRupiah(totalPieValue)}
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full mt-4 space-y-2">
                {pieStageMetrics.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {item.label} {item.count > 0 ? `(${item.count})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">{item.percentage}%</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatCompactRupiah(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grafik Performa Omset & Pipeline (Dynamic Bar Chart) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Grafik Performa Pipeline & Target</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {chartMode === 'stages'
                    ? 'Komparasi nilai per tahapan transaksi terhadap target'
                    : 'Perbandingan target vs realisasi omset won per bulan'}
                </p>
              </div>

              {/* Mode Toggle: Per Tahapan vs Tren Bulanan */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md self-start sm:self-auto">
                <button
                  onClick={() => setChartMode('stages')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                    chartMode === 'stages'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Tahapan Pipeline</span>
                </button>
                <button
                  onClick={() => setChartMode('trend')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                    chartMode === 'trend'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Tren Bulanan</span>
                </button>
              </div>
            </div>

            {/* Dynamic Bar Visualization */}
            <div className="h-56 flex items-end gap-3 sm:gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              {chartMode === 'stages' ? (
                // STAGE-BASED BARS (Lead In, Follow Up, Proposal, Won, Lost, Target)
                pipelineBarData.map((item) => {
                  const barHeightPct = item.value > 0
                    ? Math.max(6, Math.min(100, (item.value / maxBarValue) * 100))
                    : 0;

                  return (
                    <div key={item.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center h-full relative">
                        {/* Bar */}
                        <div
                          className="w-full max-w-[36px] rounded-t-md transition-all duration-300 hover:opacity-90 relative"
                          style={{
                            height: `${barHeightPct}%`,
                            backgroundColor: item.color,
                          }}
                          title={`${item.label}: ${formatRupiah(item.value)} ${item.count > 0 ? `(${item.count} deal)` : ''}`}
                        >
                          {/* Value Tag on hover or visible */}
                          {item.value > 0 && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              {formatCompactRupiah(item.value)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-2 truncate max-w-full text-center">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCompactRupiah(item.value)}
                      </span>
                    </div>
                  );
                })
              ) : (
                // MONTHLY TREND BARS
                monthlyOmsetData.map((item, idx) => {
                  const targetHeight = Math.min(100, (item.target / maxBarValue) * 100);
                  const actualHeight = item.actual > 0
                    ? Math.max(6, Math.min(100, (item.actual / maxBarValue) * 100))
                    : 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Target bar */}
                        <div
                          className="w-3.5 sm:w-4 bg-slate-200 dark:bg-slate-700 rounded-t-xs transition-all duration-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                          style={{ height: `${targetHeight}%` }}
                          title={`Target: ${formatRupiah(item.target)}`}
                        />
                        {/* Actual Won bar */}
                        <div
                          className="w-3.5 sm:w-4 bg-emerald-500 rounded-t-xs transition-all duration-300 group-hover:bg-emerald-600"
                          style={{ height: `${actualHeight}%` }}
                          title={`Realisasi Won: ${formatRupiah(item.actual)}`}
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-2 truncate max-w-full">
                        {item.month}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {formatCompactRupiah(item.actual)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {chartMode === 'stages'
                ? `Total Pipeline: ${formatRupiah(overallSummary.allDealsValue)} (${overallSummary.totalDealsCount} deal terdaftar)`
                : 'Data realisasi terakumulasi otomatis dari deal dengan status Won.'}
            </span>
            <button
              onClick={() => onNavigateToPipeline()}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
            >
              Lihat Detail Pipeline
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Ringkasan Tahapan Sales Pipeline (Cards with direct link to Kanban) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ringkasan Tahapan Sales Pipeline</h2>
          <button
            onClick={() => onNavigateToPipeline()}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
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
                className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{stage.label}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCompactRupiah(data.totalValue)}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{data.count} transaksi deal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Detail &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
