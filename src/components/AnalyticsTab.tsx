import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatRupiah,
  formatCompactRupiah,
  filterDealsByPeriod,
  calculateLostReasonsBreakdown,
  calculateSalesPerformance,
  generateCSVContent,
} from '../utils/salesLogic';
import { DEAL_STAGES, FilterPeriod, DealStage } from '../types/index';
import {
  Download,
  Filter,
  BarChart3,
  PieChart,
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  ChevronDown,
} from 'lucide-react';

export const AnalyticsTab: React.FC = () => {
  const { deals, team, target } = useApp();

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('month');
  const [selectedPic, setSelectedPic] = useState<string>('all');
  const [opportunityStatusFilter, setOpportunityStatusFilter] = useState<string>('all');

  // Filtered dataset
  const filteredDeals = useMemo(() => {
    let result = filterDealsByPeriod(deals, selectedPeriod);
    if (selectedPic !== 'all') {
      result = result.filter((d) => d.picId === selectedPic);
    }
    return result;
  }, [deals, selectedPeriod, selectedPic]);

  // Opportunities chart filtered dataset
  const oppDeals = useMemo(() => {
    if (opportunityStatusFilter === 'all') return filteredDeals;
    return filteredDeals.filter((d) => d.stage === opportunityStatusFilter);
  }, [filteredDeals, opportunityStatusFilter]);

  // Lost reasons analysis
  const lostReasonsBreakdown = useMemo(() => {
    return calculateLostReasonsBreakdown(filteredDeals);
  }, [filteredDeals]);

  // Top Sales Rep performance
  const salesPerformance = useMemo(() => {
    return calculateSalesPerformance(filteredDeals, team);
  }, [filteredDeals, team]);

  // Total sales stage breakdown for revenue pie
  const stageBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {
      lead_in: { count: 0, total: 0 },
      follow_up: { count: 0, total: 0 },
      proposal: { count: 0, total: 0 },
      won: { count: 0, total: 0 },
      lost: { count: 0, total: 0 },
    };
    filteredDeals.forEach((d) => {
      if (map[d.stage]) {
        map[d.stage].count += 1;
        map[d.stage].total += d.value;
      }
    });
    const grandTotal = filteredDeals.reduce((acc, d) => acc + d.value, 0);

    return DEAL_STAGES.map((s) => ({
      ...s,
      count: map[s.id].count,
      value: map[s.id].total,
      percentage: grandTotal > 0 ? Math.round((map[s.id].total / grandTotal) * 100) : 0,
    }));
  }, [filteredDeals]);

  // Export comprehensive analytical report CSV
  const handleExportCSV = () => {
    const headers = [
      'Kode Deal',
      'Nama Proyek',
      'Customer',
      'Tahapan',
      'Nilai Deal (Rp)',
      'PIC Sales',
      'Alasan Lost',
      'Tanggal Dibuat',
    ];

    const rows = filteredDeals.map((d) => [
      d.code,
      d.title,
      d.customerName,
      d.stage.toUpperCase(),
      d.value,
      d.picName,
      d.lostReason || '-',
      d.createdAt ? d.createdAt.split('T')[0] : '-',
    ]);

    // Append Performance Summary rows
    rows.push(['---', '---', '---', '---', '---', '---', '---', '---']);
    rows.push(['RINGKASAN SALES REP', 'Target (Rp)', 'Realisasi Won (Rp)', 'Pencapaian %', 'Total Deal', '', '', '']);
    salesPerformance.forEach((sp) => {
      rows.push([
        sp.member.name,
        sp.target,
        sp.wonValue,
        `${sp.achievementPct}%`,
        sp.totalDeals,
        '',
        '',
        '',
      ]);
    });

    const csvContent = generateCSVContent(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BIOTA_Sales_Analytics_Report_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wonTotal = stageBreakdown.find((s) => s.id === 'won')?.value || 0;
  const lostTotal = stageBreakdown.find((s) => s.id === 'lost')?.value || 0;
  const activePipelineTotal = filteredDeals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Laporan Penjualan & Analitik Performa
          </h1>
          <p className="text-xs text-slate-500">
            Analisis opportunities, evaluasi lost reasons, dan perbandingan penjualan per sales rep
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs shadow-xs">
            <span className="text-slate-400 font-medium">Periode:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as FilterPeriod)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
              <option value="quarter">Kuartal Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          {/* PIC Sales Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md text-xs shadow-xs">
            <span className="text-slate-400 font-medium">PIC:</span>
            <select
              value={selectedPic}
              onChange={(e) => setSelectedPic(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Semua Tim Sales</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.title})
                </option>
              ))}
            </select>
          </div>

          {/* Export Report CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Omset Won (Closing)</span>
            <span className="text-emerald-600 font-bold">Closed Deal</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(wonTotal)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pipeline Berjalan</span>
            <span className="text-blue-600 font-bold">Active Opportunities</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(activePipelineTotal)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Lost Deals</span>
            <span className="text-rose-600 font-bold">Unrealized</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatRupiah(lostTotal)}
          </div>
        </div>
      </div>

      {/* Row 1: Top Sales Rep Bar Chart & Opportunities Filterable View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Sales Rep Bar Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Top Sales Rep / Penjualan Masing-Masing Sales</span>
                </h2>
                <p className="text-[11px] text-slate-500">Pencapaian omset won vs target penjualan individu</p>
              </div>
            </div>

            {/* Rep comparison bars */}
            <div className="space-y-4 pt-2">
              {salesPerformance.map((item) => {
                const maxBar = Math.max(item.target, item.wonValue, 1_000_000_000);
                const actualWidth = Math.min(100, (item.wonValue / maxBar) * 100);
                const targetMarker = Math.min(100, (item.target / maxBar) * 100);

                return (
                  <div key={item.member.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.member.name}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({item.member.title})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">
                          Target: {formatCompactRupiah(item.target)}
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatRupiah(item.wonValue)}
                        </span>
                        <span className="text-emerald-700 font-bold text-[11px] w-12 text-right tabular-nums">
                          {item.achievementPct}%
                        </span>
                      </div>
                    </div>

                    <div className="relative w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${actualWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dihitung berdasarkan transaksi berstatus Won dalam rentang periode terpilih.</span>
          </div>
        </div>

        {/* Grafik Opportunities dengan Filter Status */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>Grafik Opportunities Proyek</span>
                </h2>
                <p className="text-[11px] text-slate-500">Filter distribusi peluang berdasarkan status</p>
              </div>
            </div>

            {/* Filter Status Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md mb-4 overflow-x-auto">
              <button
                onClick={() => setOpportunityStatusFilter('all')}
                className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
                  opportunityStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              {DEAL_STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOpportunityStatusFilter(s.id)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
                    opportunityStatusFilter === s.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Project List / Cards preview for the filtered opportunity status */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {oppDeals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada proyek pada tahapan ini dalam periode terpilih.
                </div>
              ) : (
                oppDeals.map((deal) => {
                  const stageObj = DEAL_STAGES.find((s) => s.id === deal.stage);
                  return (
                    <div
                      key={deal.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 truncate max-w-[220px]">
                        <div className="font-bold text-slate-900 truncate">{deal.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {deal.customerName} · <span className="font-semibold text-slate-700">{deal.picName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatCompactRupiah(deal.value)}
                        </div>
                        <span
                          className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${stageObj?.color}20`,
                            color: stageObj?.color,
                          }}
                        >
                          {stageObj?.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Total Nilai Peluang:</span>
            <span className="tabular-nums font-bold text-slate-900">
              {formatRupiah(oppDeals.reduce((sum, d) => sum + d.value, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Lost Opportunities by Reason & Total Hasil Penjualan Keseluruhan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie: Lost Opportunities by Reason */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Grafik Lost Opportunities by Reason</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Evaluasi faktor penyebab transaksi tidak berhasil ditutup
                </p>
              </div>
            </div>

            {lostReasonsBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada transaksi dengan status Lost dalam periode ini.
              </div>
            ) : (
              <div className="space-y-3">
                {lostReasonsBreakdown.map((item, index) => {
                  const colors = ['#EF4444', '#F97316', '#F59E0B', '#8B5CF6', '#64748B'];
                  const color = colors[index % colors.length];

                  return (
                    <div key={item.reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-slate-800">{item.reason}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 tabular-nums">{item.count} deal</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatCompactRupiah(item.totalValue)}
                          </span>
                          <span className="text-slate-600 font-bold tabular-nums w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Keterangan: Pop-up alasan wajib memastikan data evaluasi lost akurat 100%.
          </div>
        </div>

        {/* Pie: Total Hasil Penjualan Keseluruhan */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  <span>Total Hasil Penjualan Keseluruhan</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Proporsi nominal nilai deal berdasarkan status akhir dan proses
                </p>
              </div>
            </div>

            <div className="py-2 space-y-3">
              {stageBreakdown.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold text-slate-800">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 tabular-nums">{s.count} transaksi</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {formatRupiah(s.value)}
                      </span>
                      <span className="font-semibold text-slate-700 tabular-nums w-10 text-right">
                        {s.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${s.percentage}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Akumulasi Seluruh Proyek:</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {formatRupiah(filteredDeals.reduce((sum, d) => sum + d.value, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
