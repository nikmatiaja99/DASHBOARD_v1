import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LOST_REASONS, LostReason } from '../types/index';
import { formatRupiah } from '../utils/salesLogic';
import { AlertOctagon, X } from 'lucide-react';

export const LostReasonModal: React.FC = () => {
  const { pendingLostDeal, setPendingLostDeal, updateDealStage } = useApp();
  const [selectedReason, setSelectedReason] = useState<LostReason | string>(LOST_REASONS[0]);
  const [lostNotes, setLostNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingLostDeal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Pilih salah satu alasan deal berstatus Lost!');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await updateDealStage(
      pendingLostDeal.id,
      'lost',
      selectedReason,
      lostNotes.trim()
    );

    setIsSubmitting(false);
    if (res.success) {
      setPendingLostDeal(null);
      setLostNotes('');
    } else {
      setError(res.error || 'Gagal menyimpan status lost');
    }
  };

  const handleCancel = () => {
    setPendingLostDeal(null);
    setLostNotes('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lost-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-md">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="lost-modal-title" className="text-sm font-bold text-rose-900">
                Konfirmasi Status Deal: Lost
              </h2>
              <p className="text-[11px] text-rose-700">
                Wajib mencantumkan alasan mengapa deal ini tidak berhasil ditutup
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Deal Preview */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>{pendingLostDeal.code} · {pendingLostDeal.title}</span>
              <span className="tabular-nums text-slate-900">{formatRupiah(pendingLostDeal.value)}</span>
            </div>
            <div className="text-slate-500 mt-1 flex items-center justify-between text-[11px]">
              <span>Customer: {pendingLostDeal.customerName}</span>
              <span>PIC: {pendingLostDeal.picName}</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
              {error}
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Alasan Utama Deal Lost <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {LOST_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-rose-300 bg-rose-50 text-rose-900 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="lostReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Evaluasi Tambahan
            </label>
            <textarea
              rows={3}
              value={lostNotes}
              onChange={(e) => setLostNotes(e.target.value)}
              placeholder="Contoh: Klien memilih vendor kompetitor karena harga lebih murah 20%, atau anggaran proyek dialihkan ke sipil..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Status Lost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
