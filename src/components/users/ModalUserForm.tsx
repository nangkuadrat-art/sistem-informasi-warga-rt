'use client';

import { useState, useEffect } from 'react';
import {
  UserAccount,
  UserRole,
  UserPermissions,
  ROLE_METADATA,
  PERMISSION_DEFINITIONS,
  getDefaultPermissionsForRole,
} from '@/lib/data/userPermissions';
import { createUserAction, updateUserAction } from '@/app/(dashboard)/admin/users/actions';
import {
  X,
  Shield,
  KeyRound,
  UserPlus,
  Save,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Sparkles,
  Home,
} from 'lucide-react';

interface UnitOption {
  id: string;
  no_unit: number;
  alamat: string;
  nama_kepala_keluarga: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: UserAccount | null;
  units: UnitOption[];
}

export default function ModalUserForm({ isOpen, onClose, editingUser, units }: Props) {
  const isEdit = Boolean(editingUser);

  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [noHp, setNoHp] = useState('');
  const [unitId, setUnitId] = useState<string>('');
  const [role, setRole] = useState<UserRole>('warga');
  const [status, setStatus] = useState<'aktif' | 'non_aktif'>('aktif');
  const [permissions, setPermissions] = useState<UserPermissions>(
    getDefaultPermissionsForRole('warga')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setShowPassword(false);
      if (editingUser) {
        setNama(editingUser.nama || '');
        setUsername(editingUser.username || '');
        setPassword(''); // Kosongkan agar hanya berubah jika diisi
        setNoHp(editingUser.no_hp || '');
        setUnitId(editingUser.unit_id || '');
        setRole(editingUser.role);
        setStatus(editingUser.status);
        setPermissions({ ...editingUser.permissions });
      } else {
        setNama('');
        setUsername('');
        setPassword('12345');
        setNoHp('');
        setUnitId('');
        setRole('sekretaris');
        setStatus('aktif');
        setPermissions(getDefaultPermissionsForRole('sekretaris'));
      }
    }
  }, [isOpen, editingUser]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(getDefaultPermissionsForRole(newRole));
    if (newRole === 'non_aktif') {
      setStatus('non_aktif');
    } else if (status === 'non_aktif') {
      setStatus('aktif');
    }
  };

  const handleUnitSelect = (selectedUnitId: string) => {
    setUnitId(selectedUnitId);
    if (!isEdit && selectedUnitId) {
      const unit = units.find((u) => u.id === selectedUnitId);
      if (unit && unit.nama_kepala_keluarga !== '-') {
        if (!nama) setNama(unit.nama_kepala_keluarga);
        if (!username) {
          setUsername(
            unit.nama_kepala_keluarga.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14)
          );
        }
      }
    }
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        nama,
        username,
        password: password.trim() || undefined,
        no_hp: noHp,
        unit_id: unitId || null,
        role,
        status,
        permissions,
      };

      const res = isEdit && editingUser
        ? await updateUserAction(editingUser.id, payload)
        : await createUserAction(payload);

      if (!res.success) {
        setError(res.error || 'Terjadi kesalahan saat menyimpan akun');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = ROLE_METADATA[role];
  const activePermsCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              {isEdit ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEdit ? 'Edit Akun & Hak Akses User' : 'Tambah Akun Pengurus / Warga'}
              </h3>
              <p className="text-xs text-slate-300">
                {isEdit
                  ? `Mengelola kredensial dan izin akses untuk ${editingUser?.nama}`
                  : 'Buat akun login baru dan tentukan jabatan serta hak akses modulnya'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          {/* Bagian 1: Identitas & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap / Kepala Keluarga *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Misal: Budi Santoso"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                Tautkan ke Unit Rumah (Opsional)
              </label>
              <select
                value={unitId}
                onChange={(e) => handleUnitSelect(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Akun Pengurus Khusus / Tanpa Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    No.{u.no_unit} ({u.alamat}) - {u.nama_kepala_keluarga === '-' ? 'Kosong' : u.nama_kepala_keluarga}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bagian 2: Kredensial Login */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username Login *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="budi_rt03"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                {isEdit ? 'Password Baru (Opsional)' : 'Password *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!isEdit}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? 'Kosongkan jika tetap' : 'Default: 12345'}
                  className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-xl text-sm font-mono bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="62812xxxx"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bagian 3: Jabatan / Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan / Role Akun *
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Akun Pengurus RT">
                  <option value="superadmin">Superadmin (Full Akses)</option>
                  <option value="ketua_rt">Ketua RT</option>
                  <option value="bendahara">Bendahara RT</option>
                  <option value="sekretaris">Sekretaris RT</option>
                  <option value="keamanan">Keamanan RT</option>
                </optgroup>
                <optgroup label="Akun Warga">
                  <option value="warga">Warga (Portal Mandiri)</option>
                  <option value="non_aktif">Non-Aktif / Unit Kosong</option>
                </optgroup>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">{roleMeta.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Akun</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('aktif')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    status === 'aktif'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Aktif (Bisa Login)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('non_aktif')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    status === 'non_aktif'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Non-Aktif / Suspend
                </button>
              </div>
            </div>
          </div>

          {/* Bagian 4: Kustomisasi Hak Akses Modul (Granular Permissions) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  Pengaturan Hak Akses Modul ({activePermsCount} / {PERMISSION_DEFINITIONS.length} aktif)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPermissions(getDefaultPermissionsForRole(role))}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition"
              >
                <Sparkles className="w-3 h-3" />
                Reset Sesuai Standar {roleMeta.label}
              </button>
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white">
              {PERMISSION_DEFINITIONS.map((def) => {
                const enabled = Boolean(permissions[def.key]);
                return (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => togglePermission(def.key)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition ${
                      enabled
                        ? 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
                        : 'bg-slate-50/40 border-slate-200/70 hover:bg-slate-50 opacity-75'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {enabled ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold ${
                            enabled ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {def.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                          {def.modul}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {def.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Akun User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
