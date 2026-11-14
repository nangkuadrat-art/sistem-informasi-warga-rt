'use client';

import { useState } from 'react';
import {
  addAnggotaKeluarga,
  updateAnggotaKeluarga,
  deleteAnggotaKeluarga,
  StatusKeaktifan,
} from '@/app/(dashboard)/admin/warga/actions';
import { hitungUsia, formatTanggalIndo } from '@/lib/utils/age';
import {
  Users,
  X,
  Plus,
  Calendar,
  Pencil,
  Trash2,
  Phone,
  Save,
  Loader2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface WargaItem {
  id: string;
  nama_lengkap: string;
  hubungan_keluarga: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  tempat_lahir?: string;
  nomor_telepon?: string;
  no_hp?: string | null;
  status_pernikahan?: string;
  status_warga?: StatusKeaktifan;
}

interface KeluargaDetailProps {
  keluarga: {
    id: string;
    nama_kepala_keluarga: string;
    blok_rumah: string;
    nomor_rumah: string;
    status_rumah: string;
    status_keluarga: string;
    warga: WargaItem[];
  };
}

export default function ModalDetailKeluarga({ keluarga }: KeluargaDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    nama_lengkap: '',
    hubungan_keluarga: 'Istri',
    jenis_kelamin: 'P' as 'L' | 'P',
    tanggal_lahir: '',
    tempat_lahir: 'Cilacap',
    status_pernikahan: 'Menikah',
    nomor_telepon: '',
    status_warga: 'aktif' as StatusKeaktifan,
  });

  function startEdit(member: WargaItem) {
    setEditingMemberId(member.id);
    setEditFormData({
      nama_lengkap: member.nama_lengkap,
      hubungan_keluarga: member.hubungan_keluarga,
      jenis_kelamin: (member.jenis_kelamin as any) || 'L',
      tanggal_lahir: member.tanggal_lahir,
      tempat_lahir: member.tempat_lahir || 'Cilacap',
      status_pernikahan: member.status_pernikahan || 'Menikah',
      nomor_telepon: member.nomor_telepon || (member.no_hp as string) || '',
      status_warga: member.status_warga || 'aktif',
    });
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMemberId) return;

    setIsLoading(true);
    setErrorMsg(null);

    const result = await updateAnggotaKeluarga(keluarga.id, editingMemberId, editFormData);
    if (result.success) {
      setEditingMemberId(null);
    } else {
      setErrorMsg(result.error || 'Gagal memperbarui anggota');
    }
    setIsLoading(false);
  }

  async function handleDeleteMember(memberId: string) {
    setIsLoading(true);
    setErrorMsg(null);

    const result = await deleteAnggotaKeluarga(keluarga.id, memberId);
    if (result.success) {
      setDeletingMemberId(null);
    } else {
      setErrorMsg(result.error || 'Gagal menghapus anggota');
    }
    setIsLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 border border-blue-200/60"
      >
        <Users className="w-3.5 h-3.5 text-blue-600" />
        Lihat Anggota ({keluarga.warga?.length || 0})
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                    Blok {keluarga.blok_rumah} No. {keluarga.nomor_rumah}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                    {keluarga.status_rumah}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  Keluarga {keluarga.nama_kepala_keluarga}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAdding(false);
                  setEditingMemberId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-5">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Daftar Anggota Keluarga ({keluarga.warga?.length || 0} Jiwa)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Pengolahan data usia, kategori, dan kontak anggota RT.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsAdding(!isAdding);
                    setEditingMemberId(null);
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm shadow-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAdding ? 'Tutup Form' : 'Tambah Anggota'}
                </button>
              </div>

              {/* FORM CREATE ANGGOTA */}
              {isAdding && (
                <form
                  action={async (formData) => {
                    setIsLoading(true);
                    setErrorMsg(null);
                    const res = await addAnggotaKeluarga(formData);
                    if (res.success) {
                      setIsAdding(false);
                    } else {
                      setErrorMsg(res.error || 'Gagal menambahkan anggota');
                    }
                    setIsLoading(false);
                  }}
                  className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 mb-5 space-y-3 shadow-sm animate-in fade-in"
                >
                  <input type="hidden" name="keluarga_id" value={keluarga.id} />
                  <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Tambah Anggota Keluarga Baru
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        name="nama_lengkap"
                        placeholder="Nama lengkap sesuai identitas"
                        required
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Hubungan Keluarga
                      </label>
                      <select
                        name="hubungan_keluarga"
                        required
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Istri">Istri</option>
                        <option value="Anak">Anak</option>
                        <option value="Kepala Keluarga">Kepala Keluarga</option>
                        <option value="Orang Tua">Orang Tua / Mertua</option>
                        <option value="Famili Lain">Famili Lain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        name="jenis_kelamin"
                        required
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        name="tanggal_lahir"
                        required
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Status Pernikahan
                      </label>
                      <select
                        name="status_pernikahan"
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Menikah">Menikah</option>
                        <option value="Belum Menikah">Belum Menikah</option>
                        <option value="Cerai Hidup">Cerai Hidup</option>
                        <option value="Cerai Mati">Cerai Mati</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        No. HP / WhatsApp (Opsional)
                      </label>
                      <input
                        type="tel"
                        name="no_hp"
                        placeholder="Contoh: 08123456789 atau 62812..."
                        className="w-full px-3 py-1.5 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 border rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition flex items-center gap-1.5"
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Simpan Anggota Baru
                    </button>
                  </div>
                </form>
              )}

              {/* LIST ANGGOTA */}
              <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden bg-white shadow-sm">
                {keluarga.warga && keluarga.warga.length > 0 ? (
                  keluarga.warga.map((w) => {
                    const isEditing = editingMemberId === w.id;
                    const isConfirmingDelete = deletingMemberId === w.id;
                    const { usia, kategori } = hitungUsia(w.tanggal_lahir);
                    const phone = w.nomor_telepon || (w.no_hp as string) || '';

                    if (isEditing) {
                      return (
                        <form
                          key={w.id}
                          onSubmit={handleUpdateMember}
                          className="p-4 bg-amber-50/50 border-2 border-amber-200 rounded-xl m-2 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900">
                              Edit Data: {w.nama_lengkap}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingMemberId(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                required
                                value={editFormData.nama_lengkap}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, nama_lengkap: e.target.value })
                                }
                                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Hubungan Keluarga
                              </label>
                              <select
                                value={editFormData.hubungan_keluarga}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, hubungan_keluarga: e.target.value })
                                }
                                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                              >
                                <option value="Kepala Keluarga">Kepala Keluarga</option>
                                <option value="Istri">Istri</option>
                                <option value="Anak">Anak</option>
                                <option value="Orang Tua">Orang Tua / Mertua</option>
                                <option value="Famili Lain">Famili Lain</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Jenis Kelamin
                              </label>
                              <select
                                value={editFormData.jenis_kelamin}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, jenis_kelamin: e.target.value as any })
                                }
                                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                              >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Tanggal Lahir
                              </label>
                              <input
                                type="date"
                                required
                                value={editFormData.tanggal_lahir}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, tanggal_lahir: e.target.value })
                                }
                                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Status Pernikahan
                              </label>
                              <select
                                value={editFormData.status_pernikahan}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, status_pernikahan: e.target.value })
                                }
                                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                              >
                                <option value="Menikah">Menikah</option>
                                <option value="Belum Menikah">Belum Menikah</option>
                                <option value="Cerai Hidup">Cerai Hidup</option>
                                <option value="Cerai Mati">Cerai Mati</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                No. HP / WhatsApp
                              </label>
                              <input
                                type="tel"
                                value={editFormData.nomor_telepon}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, nomor_telepon: e.target.value })
                                }
                                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingMemberId(null)}
                              className="px-3 py-1 border rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-1 rounded-lg flex items-center gap-1.5"
                            >
                              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Simpan Perubahan
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={w.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">
                              {w.nama_lengkap}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                              {w.hubungan_keluarga} ({w.jenis_kelamin})
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                              {usia} Thn • {kategori}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Lahir: {formatTanggalIndo(w.tanggal_lahir)}
                            </span>
                            {w.status_pernikahan && (
                              <span className="text-slate-400">
                                • {w.status_pernikahan}
                              </span>
                            )}
                            {phone && (
                              <a
                                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                              >
                                <Phone className="w-3 h-3" />
                                {phone}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* AKSI EDIT & DELETE ANGGOTA */}
                        <div className="flex items-center gap-1 self-end sm:self-center">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                              <span className="text-[10px] text-red-600 font-semibold px-1">
                                Hapus?
                              </span>
                              <button
                                onClick={() => handleDeleteMember(w.id)}
                                disabled={isLoading}
                                className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded"
                              >
                                Ya
                              </button>
                              <button
                                onClick={() => setDeletingMemberId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(w)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Edit Anggota Keluarga"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingMemberId(w.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Hapus Anggota Keluarga"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data anggota keluarga terdaftar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
