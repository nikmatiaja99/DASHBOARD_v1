import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TeamMember, TeamStatus, UserRole, JobTitle } from '../types/index';
import { formatRupiah, parseNumericRupiah } from '../utils/salesLogic';
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  UserCheck,
  Phone,
  Mail,
  Lock,
  X,
  Target,
  CheckCircle,
  Clock,
  Slash,
} from 'lucide-react';

export const TeamTab: React.FC = () => {
  const { team, createTeamMember, updateTeamMember, deleteTeamMember, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [title, setTitle] = useState<JobTitle>('Account Executive');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<TeamStatus>('active');
  const [targetFormatted, setTargetFormatted] = useState('500.000.000');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setRole('admin');
    setTitle('Account Executive');
    setPhone('');
    setStatus('active');
    setTargetFormatted('500.000.000');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'super_admin') {
      setTitle('Senior Sales Executive');
      setTargetFormatted('1.000.000.000');
    } else {
      setTitle('Account Executive');
      setTargetFormatted('500.000.000');
    }
  };

  const handleStatusChange = async (member: TeamMember, newStatus: TeamStatus) => {
    if (!isSuperAdmin) return;
    await updateTeamMember(member.id, { status: newStatus });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Email tidak valid';
    const numTarget = parseNumericRupiah(targetFormatted);
    if (numTarget <= 0) newErrors.target = 'Target penjualan harus lebih dari 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await createTeamMember({
      name: name.trim(),
      email: email.trim(),
      role,
      title,
      phone: phone.trim() || '-',
      status,
      individualTarget: numTarget,
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setErrors({ form: res.error || 'Gagal menambahkan anggota tim' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    await deleteTeamMember(memberToDelete.id);
    setMemberToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Tim Sales & Akses Role
          </h1>
          <p className="text-xs text-slate-500">
            Kelola personil Senior Sales Executive (Super Admin) & Account Executive (Admin)
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Tim Baru</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Tambah/Hapus Tim: Akses Khusus Super Admin</span>
          </span>
        )}
      </div>

      {/* Team Cards / Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4">Role Akses</th>
                <th className="py-3 px-4">Jabatan Struktural</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Target Penjualan</th>
                <th className="py-3 px-4">Status Jabatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.map((member) => {
                const isSuper = member.role === 'super_admin';
                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSuper ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-[11px] text-slate-400">Bergabung: {member.joinedDate}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                          isSuper ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {isSuper ? <ShieldCheck className="w-3 h-3 text-amber-600" /> : <UserCheck className="w-3 h-3 text-blue-600" />}
                        <span>{isSuper ? 'Super Admin' : 'Admin'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {member.title}
                    </td>

                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                      {formatRupiah(member.individualTarget)}
                    </td>

                    <td className="py-3 px-4">
                      {isSuperAdmin ? (
                        <select
                          value={member.status}
                          onChange={(e) => handleStatusChange(member, e.target.value as TeamStatus)}
                          className={`text-xs font-semibold px-2 py-1 rounded border outline-none cursor-pointer ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : member.status === 'leave'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="active">Aktif</option>
                          <option value="leave">Cuti (On Leave)</option>
                          <option value="inactive">Non-Aktif</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800'
                              : member.status === 'leave'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.status === 'active' ? 'Aktif' : member.status === 'leave' ? 'Cuti' : 'Non-Aktif'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Hapus Anggota Tim (Super Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1.5 text-slate-300 cursor-not-allowed rounded"
                          title="Hanya Super Admin yang berhak menghapus tim"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hapus Anggota Tim Sales?</h3>
            <p className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus <strong>{memberToDelete.name} ({memberToDelete.title})</strong> dari sistem?
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs"
              >
                Ya, Hapus Tim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Team Member Modal (Super Admin Only) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">+ Tambah Anggota Tim Sales Baru</h2>
                <p className="text-[11px] text-slate-500">
                  Konfigurasikan peran Super Admin (Senior) atau Admin (Account Executive)
                </p>
              </div>
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

              {/* Role selection radio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tingkat Akses & Role Akun <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 ${
                      role === 'super_admin'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="teamRole"
                        checked={role === 'super_admin'}
                        onChange={() => handleRoleChange('super_admin')}
                        className="text-amber-600"
                      />
                      <span>Super Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Senior Sales Executive (Full akses edit/hapus/target/tim)
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 ${
                      role === 'admin'
                        ? 'border-blue-400 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="teamRole"
                        checked={role === 'admin'}
                        onChange={() => handleRoleChange('admin')}
                        className="text-blue-600"
                      />
                      <span>Admin Operasional</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Account Executive (Operasional input pipeline & customer)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Clarissa Dewantara"
                  className={`w-full text-xs p-2 rounded border ${
                    errors.name ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-[10px] text-rose-600">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Kantor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@biotasmarthome.com"
                    className={`w-full text-xs p-2 rounded border ${
                      errors.email ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-rose-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Jabatan Tim
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TeamStatus)}
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                  >
                    <option value="active">Aktif</option>
                    <option value="leave">Cuti (On Leave)</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Penjualan Individu (Rp)
                  </label>
                  <input
                    type="text"
                    value={targetFormatted}
                    onChange={(e) => {
                      const num = parseNumericRupiah(e.target.value);
                      setTargetFormatted(num > 0 ? num.toLocaleString('id-ID') : '');
                    }}
                    className="w-full text-xs p-2 rounded border border-slate-300 font-bold tabular-nums"
                  />
                </div>
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
                  {isSubmitting ? 'Menyimpan...' : '+ Tambah Tim Sales'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
