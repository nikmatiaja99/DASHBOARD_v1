import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Deal, DealStage, DEAL_STAGES } from '../types/index';
import { formatRupiah, formatCompactRupiah, generateCSVContent } from '../utils/salesLogic';
import { DealModal } from './DealModal';
import {
  Plus,
  LayoutGrid,
  List,
  Download,
  Search,
  Filter,
  Trash2,
  Eye,
  Edit2,
  AlertTriangle,
  MoveRight,
  MoreVertical,
  X,
} from 'lucide-react';

interface PipelineTabProps {
  initialStageFilter?: string;
}

export const PipelineTab: React.FC<PipelineTabProps> = ({ initialStageFilter }) => {
  const { deals, updateDealStage, deleteDeal, setPendingLostDeal, currentUser } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [stageFilter, setStageFilter] = useState<string>(initialStageFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchStage = stageFilter === 'all' || deal.stage === stageFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        deal.title.toLowerCase().includes(q) ||
        deal.code.toLowerCase().includes(q) ||
        deal.customerName.toLowerCase().includes(q) ||
        deal.picName.toLowerCase().includes(q);
      return matchStage && matchSearch;
    });
  }, [deals, stageFilter, searchQuery]);

  // Stage groups for Kanban
  const stageGroups = useMemo(() => {
    const groups: Record<DealStage, Deal[]> = {
      lead_in: [],
      follow_up: [],
      proposal: [],
      won: [],
      lost: [],
    };
    filteredDeals.forEach((d) => {
      if (groups[d.stage]) {
        groups[d.stage].push(d);
      }
    });
    return groups;
  }, [filteredDeals]);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    if (targetStage === 'lost') {
      // Trigger mandatory Lost Reason modal!
      setPendingLostDeal(deal);
    } else {
      await updateDealStage(deal.id, targetStage);
    }
  };

  // Quick stage changer for card dropdown or click
  const handleQuickStageChange = async (deal: Deal, targetStage: DealStage) => {
    if (deal.stage === targetStage) return;
    if (targetStage === 'lost') {
      setPendingLostDeal(deal);
    } else {
      await updateDealStage(deal.id, targetStage);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = [
      'Kode Deal',
      'Nama Proyek / Detail Deal',
      'Customer',
      'Telepon',
      'Email',
      'Nilai Deal (Rp)',
      'Tahapan',
      'PIC Sales',
      'Alasan Lost',
      'Catatan Lost',
      'Catatan Spesifikasi',
      'Tanggal Dibuat',
    ];

    const rows = filteredDeals.map((d) => [
      d.code,
      d.title,
      d.customerName,
      d.customerPhone || '-',
      d.customerEmail || '-',
      d.value,
      d.stage.toUpperCase(),
      d.picName,
      d.lostReason || '-',
      d.lostNotes || '-',
      d.notes || '-',
      d.createdAt ? d.createdAt.split('T')[0] : '-',
    ]);

    const csvContent = generateCSVContent(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BIOTA_Sales_Pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete) return;
    await deleteDeal(dealToDelete.id);
    setDealToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pipeline Transaksi Proyek
          </h1>
          <p className="text-xs text-slate-500">
            Kelola tahapan deal penjualan mulai dari Lead, Proposal hingga Won/Lost
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Papan Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tabel Pipeline"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          {/* Export CSV / Excel */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shadow-xs"
            title="Download Pipeline CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* + Deal Baru Button */}
          <button
            onClick={() => {
              setDealToEdit(null);
              setIsDealModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Deal Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari proyek, customer, atau PIC..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-slate-200 focus:border-slate-900 outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">Status:</span>
          <button
            onClick={() => setStageFilter('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              stageFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua ({deals.length})
          </button>
          {DEAL_STAGES.map((s) => {
            const count = deals.filter((d) => d.stage === s.id).length;
            const isSelected = stageFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStageFilter(s.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
                <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD DRAG & DROP */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4 items-start">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = stageGroups[stage.id];
            const stageTotalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="bg-slate-100/70 rounded-xl border border-slate-200/80 p-3 min-h-[500px] flex flex-col transition-colors hover:bg-slate-100"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 tabular-nums">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                    {formatCompactRupiah(stageTotalValue)}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400 text-center p-3">
                      Tarik & geser deal ke kolom ini
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal)}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        {/* Top: Code & Customer */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {deal.code}
                          </span>
                          <span className="truncate max-w-[120px]" title={deal.customerName}>
                            {deal.customerName}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xs font-bold text-slate-900 line-clamp-2 mb-2">
                          {deal.title}
                        </h2>

                        {/* Value */}
                        <div className="text-sm font-bold text-slate-900 tabular-nums mb-2">
                          {formatRupiah(deal.value)}
                        </div>

                        {/* Lost Reason Tag if lost */}
                        {deal.stage === 'lost' && deal.lostReason && (
                          <div className="mb-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-800">
                            <span className="font-semibold">Alasan:</span> {deal.lostReason}
                          </div>
                        )}

                        {/* Bottom Row: PIC & Action menu */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[140px]">
                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                              {deal.picName.charAt(0)}
                            </span>
                            <span className="truncate" title={deal.picName}>
                              {deal.picName}
                            </span>
                          </div>

                          {/* Quick Actions Dropdown / Detail */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedDealForDetail(deal)}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDealToEdit(deal);
                                setIsDealModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                              title="Edit Deal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Stage Mover Selector (Accessible for keyboard/click without drag) */}
                        <div className="mt-2 pt-1.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Pindah ke:</span>
                          <select
                            value={deal.stage}
                            onChange={(e) => handleQuickStageChange(deal, e.target.value as DealStage)}
                            className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700 outline-none"
                          >
                            {DEAL_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: TABLE PIPELINE */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Proyek / Detail Deal</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Nilai Deal (IDR)</th>
                  <th className="py-3 px-4">Tahapan</th>
                  <th className="py-3 px-4">PIC Sales</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada deal yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const stageConfig = DEAL_STAGES.find((s) => s.id === deal.stage) || DEAL_STAGES[0];
                    return (
                      <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {deal.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{deal.title}</div>
                          {deal.notes && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{deal.notes}</div>
                          )}
                          {deal.stage === 'lost' && deal.lostReason && (
                            <div className="text-[10px] text-rose-600 font-medium">
                              Alasan Lost: {deal.lostReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{deal.customerName}</div>
                          <div className="text-[11px] text-slate-400">{deal.customerPhone || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                          {formatRupiah(deal.value)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageConfig.bg}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageConfig.color }} />
                            {stageConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {deal.picName}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDealForDetail(deal)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                              title="Lihat Detail Customer & Deal"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDealToEdit(deal);
                                setIsDealModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                              title="Edit Deal"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDealToDelete(deal)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Deal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Deal */}
      {selectedDealForDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedDealForDetail.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedDealForDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDealForDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nilai Proyek</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatRupiah(selectedDealForDetail.value)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tahapan Saat Ini</span>
                <span className="text-sm font-bold text-slate-800 uppercase">
                  {selectedDealForDetail.stage.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedDealForDetail.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telepon Customer:</span>
                <span className="font-mono text-slate-800">{selectedDealForDetail.customerPhone || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email Customer:</span>
                <span className="text-slate-800">{selectedDealForDetail.customerEmail || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">PIC Sales:</span>
                <span className="font-semibold text-slate-800">{selectedDealForDetail.picName}</span>
              </div>
              {selectedDealForDetail.stage === 'lost' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
                  <span className="font-bold block">Alasan Deal Lost:</span>
                  <p>{selectedDealForDetail.lostReason || '-'}</p>
                  {selectedDealForDetail.lostNotes && (
                    <p className="text-[11px] text-rose-700 italic">"{selectedDealForDetail.lostNotes}"</p>
                  )}
                </div>
              )}
              {selectedDealForDetail.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Catatan Spesifikasi:</span>
                  <p className="p-2.5 bg-slate-50 rounded-md text-slate-700 text-xs">
                    {selectedDealForDetail.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDealForDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {dealToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hapus Transaksi Deal?</h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus transaksi <strong>{dealToDelete.code} - {dealToDelete.title}</strong>? Tindakan ini akan dicatat di log audit.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setDealToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create / Edit Deal */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => {
          setIsDealModalOpen(false);
          setDealToEdit(null);
        }}
        dealToEdit={dealToEdit}
      />
    </div>
  );
};
