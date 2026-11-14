'use client';

import { useState } from 'react';
import { updateKeluarga, StatusRumah } from '@/app/(dashboard)/admin/warga/actions';
import { Pencil, X, Loader2, Save, Building } from 'lucide-react';

interface ModalEditKeluargaProps {
  keluarga: {
    id: string;
    nama_kepala_keluarga: string;
    blok_rumah: string;
    nomor_rumah: string;
    status_rumah: string;
    status_keluarga: string;
    role_label?: string;
    alamat_lengkap?: string;
  };
}

export default function ModalEditKeluarga({ keluarga }: ModalEditKeluargaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama_kepala_keluarga: keluarga.nama_kepala_keluarga === '-' ? '' : keluarga.nama_kepala_keluarga,
    blok_rumah: keluarga.blok_rumah,
    nomor_rumah: keluarga.nomor_rumah,
    status_rumah: keluarga.status_rumah as StatusRumah,
    status_keluarga: keluarga.status_keluarga as 'aktif' | 'nonaktif' | 'pindah',
    role_label: keluarga.role_label || 'Warga',
    alamat_lengkap: keluarga.alamat_lengkap || '',
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const result = await updateKeluarga(keluarga.id, {
      nama_kepala_keluarga: formData.nama_kepala_keluarga || '-',
      blok_rumah: formData.blok_rumah,
      nomor_rumah: formData.nomor_rumah,
      status_rumah: formData.status_rumah,
      status_keluarga: formData.status_keluarga,
      role_label: formData.role_label,
      alamat_lengkap: formData.alamat_lengkap,
    });

    if (result.success) {
      setIsOpen(false);
    } else {
      setErrorMsg(result.error || 'Terjadi kesalahan sistem');
    }
    setIsLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
        title="Edit Data Rumah Tangga"
      >
        <Pencil className="w-3.5 h-3.5 text-slate-600" />
        <span className="hidden sm:inline">Edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Edit Data Rumah Tangga</h3>
                  <p className="text-xs text-slate-400">
                    Blok {keluarga.blok_rumah} No. {keluarga.nomor_rumah}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Blok Rumah
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.blok_rumah}
                    onChange={(e) => setFormData({ ...formData, blok_rumah: e.target.value })}
                    placeholder="Contoh: UT, E, G, I, K, L"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nomor Rumah
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomor_rumah}
                    onChange={(e) => setFormData({ ...formData, nomor_rumah: e.target.value })}
                    placeholder="Contoh: 1, 3, 5"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Kepala Keluarga / Penanggungjawab
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_kepala_keluarga}
                  onChange={(e) => setFormData({ ...formData, nama_kepala_keluarga: e.target.value })}
                  placeholder="Isi '-' jika unit kosong"
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status Tempat Tinggal
                  </label>
                  <select
                    value={formData.status_rumah}
                    onChange={(e) => setFormData({ ...formData, status_rumah: e.target.value as StatusRumah })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="pemilik">Rumah Pribadi (Pemilik)</option>
                    <option value="kontrak">Kontrak / Sewa</option>
                    <option value="kost">Kost</option>
                    <option value="kosong">Unit Kosong</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.status_keluarga}
                    onChange={(e) => setFormData({ ...formData, status_keluarga: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="aktif">Aktif Berpenghuni</option>
                    <option value="nonaktif">Non-Aktif / Kosong</option>
                    <option value="pindah">Pindah Rumah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Jabatan / Penugasan Pengurus RT
                </label>
                <select
                  value={formData.role_label}
                  onChange={(e) => setFormData({ ...formData, role_label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Warga">Warga Biasa</option>
                  <option value="Ketua RT">Ketua RT</option>
                  <option value="Bendahara RT">Bendahara RT</option>
                  <option value="Keamanan RT">Keamanan RT / Sie Kamtib</option>
                  <option value="Superadmin">Superadmin RT</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat_lengkap}
                  onChange={(e) => setFormData({ ...formData, alamat_lengkap: e.target.value })}
                  placeholder="Perum BPTW Tritih Lor Blok ..., Jeruklegi, Cilacap"
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
