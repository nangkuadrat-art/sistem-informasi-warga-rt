'use client';

import { useState } from 'react';
import { createKeluarga, StatusRumah } from '@/app/(dashboard)/admin/warga/actions';
import { UserPlus, X, Loader2, Home, User } from 'lucide-react';

export default function ModalTambahKeluarga() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    blok_rumah: '',
    nomor_rumah: '',
    status_rumah: 'pemilik' as StatusRumah,
    nama_kepala_keluarga: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    no_hp: '',
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const result = await createKeluarga({
      nama_kepala_keluarga: formData.nama_kepala_keluarga,
      blok_rumah: formData.blok_rumah,
      nomor_rumah: formData.nomor_rumah,
      status_rumah: formData.status_rumah,
      tanggal_lahir: formData.tanggal_lahir,
      jenis_kelamin: formData.jenis_kelamin,
      no_hp: formData.no_hp,
    });

    if (result.success) {
      setIsOpen(false);
      setFormData({
        blok_rumah: '',
        nomor_rumah: '',
        status_rumah: 'pemilik',
        nama_kepala_keluarga: '',
        tanggal_lahir: '',
        jenis_kelamin: 'L',
        no_hp: '',
      });
    } else {
      setErrorMsg(result.error || 'Terjadi kesalahan saat menyimpan');
    }
    setIsLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm shadow-blue-500/20"
      >
        <UserPlus className="w-4 h-4" />
        Tambah Rumah Tangga
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Pendaftaran Rumah Tangga Baru
                  </h3>
                  <p className="text-xs text-slate-400">
                    Menambahkan unit hunian dan kepala keluarga baru di RT.03
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
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
                    Blok Rumah *
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
                    Nomor Rumah *
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
                  Status Kepemilikan Rumah *
                </label>
                <select
                  value={formData.status_rumah}
                  onChange={(e) => setFormData({ ...formData, status_rumah: e.target.value as StatusRumah })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="pemilik">Rumah Pribadi (Pemilik)</option>
                  <option value="kontrak">Kontrak / Sewa</option>
                  <option value="kost">Kost</option>
                </select>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Identitas Kepala Keluarga
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nama Lengkap Kepala Keluarga *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama_kepala_keluarga}
                      onChange={(e) => setFormData({ ...formData, nama_kepala_keluarga: e.target.value })}
                      placeholder="Nama lengkap tanpa gelar atau dengan gelar"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tanggal Lahir *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.tanggal_lahir}
                        onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Jenis Kelamin *
                      </label>
                      <select
                        value={formData.jenis_kelamin}
                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nomor HP / WhatsApp (Opsional)
                    </label>
                    <input
                      type="tel"
                      value={formData.no_hp}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
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
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Daftarkan Rumah Tangga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
