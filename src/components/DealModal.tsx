import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Deal, DealStage, DEAL_STAGES, LOST_REASONS, LostReason } from '../types/index';
import { formatRupiah, parseNumericRupiah } from '../utils/salesLogic';
import { X, Building2, User, DollarSign, Tag, FileText, AlertTriangle } from 'lucide-react';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealToEdit?: Deal | null;
}

export const DealModal: React.FC<DealModalProps> = ({ isOpen, onClose, dealToEdit }) => {
  const { customers, team, createDeal, updateDeal, currentUser, setPendingLostDeal } = useApp();

  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [valueFormatted, setValueFormatted] = useState('');
  const [stage, setStage] = useState<DealStage>('lead_in');
  const [picId, setPicId] = useState('');
  const [picName, setPicName] = useState('');
  const [notes, setNotes] = useState('');
  const [lostReason, setLostReason] = useState<LostReason | string>('');
  const [lostNotes, setLostNotes] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (dealToEdit) {
      setTitle(dealToEdit.title);
      setCustomerId(dealToEdit.customerId);
      setCustomerName(dealToEdit.customerName);
      setCustomerPhone(dealToEdit.customerPhone || '');
      setCustomerEmail(dealToEdit.customerEmail || '');
      setValueFormatted(dealToEdit.value.toLocaleString('id-ID'));
      setStage(dealToEdit.stage);
      setPicId(dealToEdit.picId);
      setPicName(dealToEdit.picName);
      setNotes(dealToEdit.notes || '');
      setLostReason(dealToEdit.lostReason || '');
      setLostNotes(dealToEdit.lostNotes || '');
      setExpectedCloseDate(dealToEdit.expectedCloseDate || '');
    } else {
      // Defaults for new deal
      setTitle('');
      if (customers.length > 0) {
        setCustomerId(customers[0].id);
        setCustomerName(customers[0].name);
        setCustomerPhone(customers[0].phone);
        setCustomerEmail(customers[0].email);
      } else {
        setCustomerId('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
      }
      setValueFormatted('150.000.000');
      setStage('lead_in');
      setPicId(currentUser.id);
      setPicName(currentUser.name);
      setNotes('');
      setLostReason('');
      setLostNotes('');
      setExpectedCloseDate('2026-11-15');
    }
    setErrors({});
  }, [dealToEdit, isOpen, customers, currentUser]);

  if (!isOpen) return null;

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const selected = customers.find(c => c.id === id);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone);
      setCustomerEmail(selected.email);
    }
  };

  const handlePicSelect = (id: string) => {
    setPicId(id);
    const selected = team.find(t => t.id === id);
    if (selected) {
      setPicName(selected.name);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseNumericRupiah(raw);
    setValueFormatted(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseNumericRupiah(valueFormatted);

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Nama proyek / detail deal wajib diisi';
    if (!customerId && !customerName.trim()) newErrors.customer = 'Kontak customer wajib dipilih';
    if (numericValue <= 0) newErrors.value = 'Nilai deal wajib diisi lebih dari 0';
    if (!picId) newErrors.pic = 'PIC Sales wajib dipilih';
    if (stage === 'lost' && !lostReason) {
      newErrors.lostReason = 'Alasan status Lost wajib dipilih!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const payload: Partial<Deal> = {
      title: title.trim(),
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      value: numericValue,
      stage,
      picId,
      picName,
      notes: notes.trim(),
      lostReason: stage === 'lost' ? lostReason : undefined,
      lostNotes: stage === 'lost' ? lostNotes : undefined,
      expectedCloseDate,
    };

    let result;
    if (dealToEdit) {
      result = await updateDeal(dealToEdit.id, payload);
    } else {
      result = await createDeal(payload);
    }

    setIsSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      setErrors({ form: result.error || 'Terjadi kesalahan sistem' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="deal-modal-title" className="text-sm font-bold text-slate-900">
              {dealToEdit ? `Edit Transaksi Deal: ${dealToEdit.code}` : '+ Tambah Deal Penjualan Baru'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Isi parameter proyek smart home, customer, estimasi omset, dan PIC Sales
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            aria-label="Tutup form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
              {errors.form}
            </div>
          )}

          {/* Project Title / Detail Deal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contoh Detail Deal / Nama Proyek <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pakubuwono Residence Penthouse - Full IoT Automation"
              className={`w-full text-xs p-2.5 rounded-md border ${
                errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              } focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none`}
            />
            {errors.title && <p className="text-[10px] text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kontak Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-md border ${
                  errors.customer ? 'border-rose-400' : 'border-slate-300'
                } bg-white outline-none focus:border-slate-900`}
              >
                <option value="">-- Pilih Customer Terdaftar --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {errors.customer && <p className="text-[10px] text-rose-600 mt-1">{errors.customer}</p>}
            </div>

            {/* Nilai Deal (IDR Rupiah) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nilai Deal (Rupiah) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  value={valueFormatted}
                  onChange={handleValueChange}
                  placeholder="150.000.000"
                  className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-md border tabular-nums font-semibold ${
                    errors.value ? 'border-rose-400' : 'border-slate-300'
                  } outline-none focus:border-slate-900`}
                />
              </div>
              {errors.value && <p className="text-[10px] text-rose-600 mt-1">{errors.value}</p>}
            </div>
          </div>

          {/* Tahapan & PIC Sales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahapan Pipeline <span className="text-rose-500">*</span>
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="w-full text-xs p-2.5 rounded-md border border-slate-300 bg-white outline-none focus:border-slate-900"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIC Sales <span className="text-rose-500">*</span>
              </label>
              <select
                value={picId}
                onChange={(e) => handlePicSelect(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-md border ${
                  errors.pic ? 'border-rose-400' : 'border-slate-300'
                } bg-white outline-none focus:border-slate-900`}
              >
                <option value="">-- Pilih PIC Sales --</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.title})
                  </option>
                ))}
                {picId && !team.some(m => m.id === picId) && (
                  <option value={picId}>
                    {picName || 'PIC Terdahulu'} (Tidak Aktif)
                  </option>
                )}
              </select>
              {errors.pic && <p className="text-[10px] text-rose-600 mt-1">{errors.pic}</p>}
            </div>
          </div>

          {/* Target Close Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estimasi Tanggal Penutupan (Close Date)
            </label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 bg-white outline-none focus:border-slate-900"
            />
          </div>

          {/* Conditional Lost Reason if Stage is Lost */}
          {stage === 'lost' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Tahapan Lost Dipilih - Wajib Alasan:</span>
              </div>
              <div>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className={`w-full text-xs p-2 rounded-md border ${
                    errors.lostReason ? 'border-rose-500' : 'border-rose-300'
                  } bg-white outline-none`}
                >
                  <option value="">-- Pilih Alasan Utama Deal Lost --</option>
                  {LOST_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.lostReason && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.lostReason}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Keterangan lost (opsional)..."
                  className="w-full text-xs p-2 rounded-md border border-rose-200 bg-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Noted / Catatan Proyek */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Proyek / Noted Spesifikasi
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Paket Zigbee Smart Hub 3.0, 42 saklar switch touch, smart door lock Biota AI Face Recognition..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 outline-none focus:border-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : dealToEdit ? 'Simpan Perubahan' : '+ Tambah Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
