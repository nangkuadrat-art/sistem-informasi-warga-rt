'use client';

import { useState, useMemo } from 'react';
import {
  UserAccount,
  UserRole,
  ROLE_METADATA,
  PERMISSION_DEFINITIONS,
} from '@/lib/data/userPermissions';
import {
  toggleUserStatusAction,
  resetPasswordAction,
  deleteUserAction,
} from '@/app/(dashboard)/admin/users/actions';
import ModalUserForm from './ModalUserForm';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  KeyRound,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  Minus,
  Phone,
} from 'lucide-react';

interface UnitOption {
  id: string;
  no_unit: number;
  alamat: string;
  nama_kepala_keluarga: string;
}

interface Props {
  users: UserAccount[];
  units: UnitOption[];
}

export default function TabelUsersClient({ users, units }: Props) {
  const [activeTab, setActiveTab] = useState<'semua' | 'pengurus' | 'warga' | 'non_aktif'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showMatrix, setShowMatrix] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Statistik
  const stats = useMemo(() => {
    const pengurus = users.filter((u) => u.kategori === 'pengurus' && u.status === 'aktif').length;
    const wargaAktif = users.filter((u) => u.kategori === 'warga' && u.status === 'aktif').length;
    const nonAktif = users.filter((u) => u.status === 'non_aktif').length;
    return {
      total: users.length,
      pengurus,
      wargaAktif,
      nonAktif,
    };
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (activeTab === 'pengurus' && u.kategori !== 'pengurus') return false;
      if (activeTab === 'warga' && (u.kategori !== 'warga' || u.status === 'non_aktif')) return false;
      if (activeTab === 'non_aktif' && u.status !== 'non_aktif') return false;

      if (filterRole !== 'all' && u.role !== filterRole) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          u.nama.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.alamat && u.alamat.toLowerCase().includes(q)) ||
          u.role_label.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [users, activeTab, filterRole, searchQuery]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleStatus = async (user: UserAccount) => {
    setBusyId(user.id);
    const res = await toggleUserStatusAction(user.id);
    setBusyId(null);
    if (res.success) {
      showToast(
        'ok',
        `Status akun ${user.nama} diubah menjadi ${
          res.data?.status === 'aktif' ? 'Aktif' : 'Non-Aktif'
        }`
      );
    } else {
      showToast('err', res.error || 'Gagal mengubah status');
    }
  };

  const handleConfirmReset = async () => {
    if (!resettingUser) return;
    setBusyId(resettingUser.id);
    const res = await resetPasswordAction(resettingUser.id, '12345');
    setBusyId(null);
    setResettingUser(null);
    if (res.success) {
      showToast('ok', `Password ${resettingUser.nama} berhasil direset ke "12345"`);
    } else {
      showToast('err', res.error || 'Gagal mereset password');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setBusyId(deletingUser.id);
    const res = await deleteUserAction(deletingUser.id);
    setBusyId(null);
    setDeletingUser(null);
    if (res.success) {
      showToast('ok', `Akun ${deletingUser.nama} berhasil dihapus`);
    } else {
      showToast('err', res.error || 'Gagal menghapus akun');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const roleKeysOrder: UserRole[] = [
    'superadmin',
    'ketua_rt',
    'bendahara',
    'sekretaris',
    'keamanan',
    'warga',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Akun Terdaftar</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pengurus & seluruh unit RT.03</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Akun Pengurus RT</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">{stats.pengurus}</p>
          <p className="text-[11px] text-indigo-500 mt-0.5">Ketua, Bendahara, Keamanan, Admin</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Akun Warga Aktif</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{stats.wargaAktif}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Akses portal mandiri warga</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/70 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Non-Aktif / Kosong</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">{stats.nonAktif}</p>
          <p className="text-[11px] text-rose-500 mt-0.5">Unit kosong atau login ditangguhkan</p>
        </div>
      </div>

      {/* Collapsible Matriks Hak Akses Role */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMatrix(!showMatrix)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Referensi Matriks Hak Akses per Jabatan (Role)
              </h3>
              <p className="text-[11px] text-slate-500">
                Klik untuk melihat rincian izin default setiap role pengurus & warga
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            {showMatrix ? (
              <>
                Sembunyikan <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Lihat Matriks <ChevronDown className="w-4 h-4" />
              </>
            )}
          </div>
        </button>

        {showMatrix && (
          <div className="p-4 border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3 text-left font-bold">Modul / Hak Akses</th>
                  {roleKeysOrder.map((rk) => (
                    <th key={rk} className="py-2 px-2 text-center font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${ROLE_METADATA[rk].badgeClass}`}
                      >
                        {ROLE_METADATA[rk].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_DEFINITIONS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3">
                      <p className="font-semibold text-slate-800">{perm.label}</p>
                      <p className="text-[10px] text-slate-400">{perm.description}</p>
                    </td>
                    {roleKeysOrder.map((rk) => {
                      const allowed = ROLE_METADATA[rk].defaultPermissions[perm.key];
                      return (
                        <td key={rk} className="py-2 px-2 text-center">
                          {allowed ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                              <Minus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Controls Bar: Tabs, Search, Filter & Add Button */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'semua'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pengurus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'pengurus'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengurus RT ({users.filter((u) => u.kategori === 'pengurus').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('warga')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'warga'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Warga Aktif ({stats.wargaAktif})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('non_aktif')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'non_aktif'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Non-Aktif ({stats.nonAktif})
            </button>
          </div>

          {/* Search, Role Filter & Add Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, username, blok..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Role</option>
              <option value="superadmin">Superadmin</option>
              <option value="ketua_rt">Ketua RT</option>
              <option value="bendahara">Bendahara RT</option>
              <option value="sekretaris">Sekretaris RT</option>
              <option value="keamanan">Keamanan RT</option>
              <option value="warga">Warga</option>
              <option value="non_aktif">Non-Aktif</option>
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-14 text-center">Unit</th>
                <th className="py-3 px-4">Nama Lengkap & Alamat</th>
                <th className="py-3 px-4">Kredensial Login</th>
                <th className="py-3 px-4">Role / Jabatan</th>
                <th className="py-3 px-4">Hak Akses Modul</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada akun user yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const meta = ROLE_METADATA[user.role] || ROLE_METADATA.warga;
                  const activePermKeys = PERMISSION_DEFINITIONS.filter(
                    (def) => user.permissions?.[def.key]
                  );
                  const isPwdVisible = visiblePasswords[user.id];

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition ${
                        user.status === 'non_aktif' ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Unit */}
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {user.no_unit ? `#${user.no_unit}` : 'EXT'}
                      </td>

                      {/* Nama & Alamat */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{user.nama}</span>
                          {user.kategori === 'pengurus' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase tracking-wide">
                              Pengurus
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                          <span>{user.alamat || 'Tanpa Unit'}</span>
                          {user.no_hp && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Phone className="w-3 h-3" /> {user.no_hp}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kredensial Login */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">User:</span>
                            <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-semibold">
                              {user.username}
                            </code>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Pass:</span>
                            <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                              {isPwdVisible ? user.password : '•••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title={isPwdVisible ? 'Sembunyikan password' : 'Lihat password'}
                            >
                              {isPwdVisible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.badgeClass}`}
                        >
                          {user.kategori === 'pengurus' && <ShieldCheck className="w-3 h-3" />}
                          {meta.label}
                        </span>
                      </td>

                      {/* Hak Akses */}
                      <td className="py-3 px-4 max-w-[230px]">
                        {activePermKeys.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Tidak ada akses</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activePermKeys.slice(0, 3).map((p) => (
                              <span
                                key={p.key}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-medium"
                              >
                                {p.modul}
                              </span>
                            ))}
                            {activePermKeys.length > 3 && (
                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-bold"
                              >
                                +{activePermKeys.length - 3} modul
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => handleToggleStatus(user)}
                          title="Klik untuk mengaktifkan / menonaktifkan akun"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            user.status === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {user.status === 'aktif' ? '● Aktif' : '○ Non-Aktif'}
                        </button>
                      </td>

                      {/* Aksi CRUD */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition"
                            title="Edit profil, role & hak akses"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit & Akses
                          </button>
                          <button
                            type="button"
                            onClick={() => setResettingUser(user)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                            title="Reset password ke 12345"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(user)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="Hapus akun user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Tambah / Edit User & Hak Akses */}
      <ModalUserForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        units={units}
      />

      {/* Modal Konfirmasi Reset Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Reset Password Akun?</h4>
                <p className="text-xs text-slate-500">Username: {resettingUser.username}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Password untuk akun <strong>{resettingUser.nama}</strong> akan direset kembali ke
              default <code className="px-1.5 py-0.5 bg-slate-100 rounded font-bold">12345</code>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busyId === resettingUser.id}
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Ya, Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus User */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hapus Akun User?</h4>
                <p className="text-xs text-slate-500">
                  {deletingUser.nama} ({deletingUser.role_label})
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Akun login <strong>@{deletingUser.username}</strong> akan dihapus permanen dari daftar
              pengguna. Data rumah di menu Data Warga tetap aman.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busyId === deletingUser.id}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
