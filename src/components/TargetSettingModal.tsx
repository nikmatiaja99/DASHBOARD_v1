import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, parseNumericRupiah } from '../utils/salesLogic';
import { Target, X, ShieldAlert, Check } from 'lucide-react';

interface TargetSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TargetSettingModal: React.FC<TargetSettingModalProps> = ({ isOpen, onClose }) => {
  const { target, updateTarget, currentUser } = useApp();
  const [monthlyFormatted, setMonthlyFormatted] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSuperAdmin = currentUser.role === 'super_admin';

  useEffect(() => {
    if (target) {
      setMonthlyFormatted(target.monthlyTarget.toLocaleString('id-ID'));
    }
  }, [target, isOpen]);

  if (!isOpen) return null;

  const currentNum = parseNumericRupiah(monthlyFormatted);
  const quarterlyNum = currentNum * 3;
  const yearlyNum = currentNum * 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setError('Hanya Super Admin yang berhak mengubah target sales');
      return;
    }

    if (currentNum <= 0) {
      setError('Target bulanan harus bernilai lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await updateTarget(currentNum);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Gagal memperbarui target');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="target-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-md">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 id="target-modal-title" className="text-sm font-bold text-amber-950">
                Pengaturan Target Sales Proyek
              </h2>
              <p className="text-[11px] text-amber-800">
                Hak akses eksklusif: Senior Sales Executive (Super Admin)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isSuperAdmin && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Akses ditolak: Anda harus login sebagai Super Admin untuk mengubah target.</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Omset Bulanan (Rupiah) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={monthlyFormatted}
                onChange={(e) => {
                  const num = parseNumericRupiah(e.target.value);
                  setMonthlyFormatted(num > 0 ? num.toLocaleString('id-ID') : '');
                }}
                className="w-full text-sm pl-9 pr-3 py-2.5 rounded-md border border-slate-300 font-bold tabular-nums outline-none focus:border-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Terbaca: {formatRupiah(currentNum)}
            </p>
          </div>

          {/* Automatic projection calculations */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Kalkulasi Target Kuartal (3 Bulan):</span>
              <span className="font-bold text-slate-800 tabular-nums">{formatRupiah(quarterlyNum)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Kalkulasi Target Tahunan (12 Bulan):</span>
              <span className="font-bold text-slate-800 tabular-nums">{formatRupiah(yearlyNum)}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isSuperAdmin || isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
