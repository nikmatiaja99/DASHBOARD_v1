import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types/index';
import { formatRupiah } from '../utils/salesLogic';
import {
  UserPlus,
  Search,
  Trash2,
  Eye,
  Edit2,
  Lock,
  Mail,
  Phone,
  MapPin,
  X,
  FileText,
  ShieldAlert,
  Building,
} from 'lucide-react';

export const CustomerTab: React.FC = () => {
  const { customers, deals, createCustomer, updateCustomer, deleteCustomer, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    const nextId = customers.length + 1;
    setCode(`CUST-00${nextId}`);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setCode(c.code);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setNotes(c.notes || '');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nama customer wajib diisi';
    if (!phone.trim()) newErrors.phone = 'Nomor telepon wajib diisi';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Email tidak valid';
    if (!address.trim()) newErrors.address = 'Alamat lengkap wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const payload: Partial<Customer> = {
      code: code.trim(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
    };

    let res;
    if (editingCustomer) {
      res = await updateCustomer(editingCustomer.id, payload);
    } else {
      res = await createCustomer(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setErrors({ form: res.error || 'Gagal menyimpan customer' });
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    await deleteCustomer(customerToDelete.id);
    setCustomerToDelete(null);
  };

  // Associated deals for selected detail customer
  const customerDeals = useMemo(() => {
    if (!detailCustomer) return [];
    return deals.filter((d) => d.customerId === detailCustomer.id || d.customerName === detailCustomer.name);
  }, [deals, detailCustomer]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Database Klien & Customer
          </h1>
          <p className="text-xs text-slate-500">
            Daftar pengembang, arsitek, dan pemilik properti smart home BIOTA
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Customer Baru</span>
        </button>
      </div>

      {/* Role permission info banner */}
      {!isSuperAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Anda login sebagai <strong>Account Executive (Admin)</strong>. Anda dapat melihat, menambah, dan mengedit customer, tetapi <strong>fitur hapus customer hanya bisa dilakukan oleh Super Admin (Senior Sales Executive)</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, kode, email, telepon, atau alamat..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-slate-200 focus:border-slate-900 outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800 tabular-nums">{filteredCustomers.length}</span> Customer
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">ID Customer</th>
                <th className="py-3 px-4">Nama Customer / Perusahaan</th>
                <th className="py-3 px-4">Kontak (Email / Telepon)</th>
                <th className="py-3 px-4">Alamat Lengkap</th>
                <th className="py-3 px-4">Total Deal</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada customer yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const custDeals = deals.filter(
                    (d) => d.customerId === cust.id || d.customerName === cust.name
                  );
                  const wonDealsVal = custDeals
                    .filter((d) => d.stage === 'won')
                    .reduce((sum, d) => sum + d.value, 0);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {cust.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.name}</span>
                        </div>
                        {cust.notes && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                            {cust.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">{cust.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[11px] truncate max-w-[160px]">{cust.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-slate-600 text-[11px] line-clamp-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{cust.address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 tabular-nums">
                          {custDeals.length} Deal
                        </div>
                        {wonDealsVal > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold tabular-nums">
                            Won: {formatRupiah(wonDealsVal)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail Customer */}
                          <button
                            onClick={() => setDetailCustomer(cust)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Lihat Detail Customer & Riwayat Transaksi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Customer */}
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Edit Data Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Hapus Customer: HANYA BISA SUPER ADMIN */}
                          {isSuperAdmin ? (
                            <button
                              onClick={() => setCustomerToDelete(cust)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Customer (Super Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 cursor-not-allowed rounded"
                              title="Hanya Super Admin yang berhak menghapus data customer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal Detail Customer */}
      {detailCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {detailCustomer.code}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {detailCustomer.name}
                </h2>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{detailCustomer.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telepon:</span>
                <span className="font-mono font-medium text-slate-800">{detailCustomer.phone}</span>
              </div>
              <div className="py-1 border-b border-slate-100">
                <span className="text-slate-500 block mb-0.5">Alamat:</span>
                <span className="text-slate-800">{detailCustomer.address}</span>
              </div>
              {detailCustomer.notes && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Catatan Customer:</span>
                  <p className="p-2.5 bg-slate-50 rounded text-slate-700">{detailCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Riwayat Proyek Transaksi Deal */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Riwayat Transaksi Proyek ({customerDeals.length})
              </h3>
              {customerDeals.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada deal untuk customer ini.</p>
              ) : (
                <div className="space-y-2">
                  {customerDeals.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{d.code} · {d.title}</div>
                        <div className="text-[11px] text-slate-500">PIC: {d.picName} · Status: <span className="uppercase font-semibold">{d.stage}</span></div>
                      </div>
                      <div className="text-right font-bold text-slate-900 tabular-nums">
                        {formatRupiah(d.value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDetailCustomer(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Customer (Super Admin Only) */}
      {customerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hapus Data Customer?</h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus <strong>{customerToDelete.name} ({customerToDelete.code})</strong>?
              Tindakan ini hanya dapat dilakukan oleh Super Admin.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs"
              >
                Ya, Hapus Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Customer */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : '+ Tambah Customer Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {errors.form && (
                <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                  {errors.form}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ID Customer
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Telepon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className={`w-full text-xs p-2 rounded border ${
                      errors.phone ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-rose-600">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Customer / Developer / PT <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: PT Graha Propertindo / Bapak Hendra"
                  className={`w-full text-xs p-2 rounded border ${
                    errors.name ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-rose-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Customer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  className={`w-full text-xs p-2 rounded border ${
                    errors.email ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.email && <p className="text-[10px] text-rose-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Sudirman Kav. 60, Jakarta..."
                  className={`w-full text-xs p-2 rounded border ${
                    errors.address ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.address && <p className="text-[10px] text-rose-600">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Klien
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferensi teknologi smart home, show unit, dll..."
                  className="w-full text-xs p-2 rounded border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : editingCustomer ? 'Simpan' : '+ Tambah Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
