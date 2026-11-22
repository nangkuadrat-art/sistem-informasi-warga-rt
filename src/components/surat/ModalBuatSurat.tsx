'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnitRumahRT } from '@/lib/data/masterDataGoogleSheets';
import { JenisSurat } from '@/lib/data/storeSurat';
import { createSuratAction } from '@/app/(dashboard)/admin/surat/actions';
import {
  Plus,
  X,
  Mail,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldAlert,
  Hammer,
  FileText,
  AlertTriangle,
  Building,
} from 'lucide-react';

interface Props {
  units: UnitRumahRT[];
  defaultJenis?: JenisSurat;
}

export default function ModalBuatSurat({ units, defaultJenis = 'undangan_rapat' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jenis, setJenis] = useState<JenisSurat>(defaultJenis);
  const router = useRouter();

  // Auto-filled states from resident selector
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [pemohonTempatLahir, setPemohonTempatLahir] = useState('Cilacap');
  const [pemohonTglLahir, setPemohonTglLahir] = useState('');
  const [pemohonUsia, setPemohonUsia] = useState('');
  const [pemohonKategori, setPemohonKategori] = useState('');
  const [pemohonJK, setPemohonJK] = useState<'L' | 'P'>('L');
  const [pemohonAlamat, setPemohonAlamat] = useState('');
  const [tujuanNama, setTujuanNama] = useState('');
  const [tujuanAlamat, setTujuanAlamat] = useState('');

  // Perihal default presets
  const [perihal, setPerihal] = useState('Undangan Rapat Rutin Warga RT.03');

  const handleJenisChange = (newJenis: JenisSurat) => {
    setJenis(newJenis);
    if (newJenis === 'undangan_rapat') {
      setPerihal('Undangan Rapat Musyawarah Warga RT.03 / RW.14');
      setTujuanNama('Bapak/Ibu Seluruh Warga RT.03 / RW.14');
      setTujuanAlamat('Perumahan BPTW Tritih Lor, Cilacap');
    } else if (newJenis === 'undangan_kerja_bakti') {
      setPerihal('Undangan Kerja Bakti & Gotong Royong Lingkungan RT.03');
      setTujuanNama('Seluruh Warga RT.03 / RW.14 (Perwakilan 1 Orang per KK)');
      setTujuanAlamat('Perumahan BPTW Tritih Lor, Cilacap');
    } else if (newJenis === 'surat_pengantar') {
      setPerihal('Surat Pengantar Pelayanan Administrasi Warga');
      setTujuanNama('Yth. Kepala Kelurahan Tritih Lor / Instansi Terkait');
      setTujuanAlamat('di Tempat');
    } else if (newJenis === 'surat_peringatan') {
      setPerihal('Surat Peringatan & Imbauan Ketertiban Warga RT.03');
      setTujuanNama('');
      setTujuanAlamat('');
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    setTujuanNama(`Bapak/Ibu ${unit.nama_kepala_keluarga}`);
    setTujuanAlamat(unit.alamat_lengkap || `Blok ${unit.blok_rumah}/${unit.nomor_rumah}`);

    // If there is head of family in member list
    const head = unit.warga?.find((w) => w.hubungan_keluarga === 'Kepala Keluarga') || unit.warga?.[0];
    if (head) {
      setSelectedMemberName(head.nama_lengkap);
      setPemohonTglLahir(head.tanggal_lahir || '');
      setPemohonUsia(head.usia_text || '');
      setPemohonKategori(head.kategori_usia || '');
      setPemohonJK((head.jenis_kelamin as 'L' | 'P') || 'L');
      setPemohonAlamat(unit.alamat_lengkap || `Blok ${unit.blok_rumah}/${unit.nomor_rumah}`);
    } else {
      setSelectedMemberName(unit.nama_kepala_keluarga);
      setPemohonAlamat(unit.alamat_lengkap || `Blok ${unit.blok_rumah}/${unit.nomor_rumah}`);
    }
  };

  const handleMemberSelect = (memberName: string) => {
    setSelectedMemberName(memberName);
    const unit = units.find((u) => u.id === selectedUnitId);
    if (!unit) return;
    const member = unit.warga?.find((w) => w.nama_lengkap === memberName);
    if (member) {
      setPemohonTglLahir(member.tanggal_lahir || '');
      setPemohonUsia(member.usia_text || '');
      setPemohonKategori(member.kategori_usia || '');
      setPemohonJK((member.jenis_kelamin as 'L' | 'P') || 'L');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('jenis', jenis);
    await createSuratAction(formData);
    setLoading(false);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => {
          handleJenisChange(defaultJenis);
          setIsOpen(true);
        }}
        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm shadow-teal-500/20 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Buat Surat Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Mail className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Buat Surat Resmi RT.03</h3>
                  <p className="text-xs text-teal-100">
                    Format resmi Kop RT.03 RW.14 Tritih Lor, Jeruklegi, Cilacap
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR JENIS SURAT */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleJenisChange('undangan_rapat')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    jenis === 'undangan_rapat'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Undangan Rapat
                </button>

                <button
                  type="button"
                  onClick={() => handleJenisChange('undangan_kerja_bakti')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    jenis === 'undangan_kerja_bakti'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  Kerja Bakti
                </button>

                <button
                  type="button"
                  onClick={() => handleJenisChange('surat_pengantar')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    jenis === 'surat_pengantar'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Pengantar Admin
                </button>

                <button
                  type="button"
                  onClick={() => handleJenisChange('surat_peringatan')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    jenis === 'surat_peringatan'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Surat Peringatan
                </button>
              </div>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <input type="hidden" name="jenis" value={jenis} />

              {/* DATA UMUM SURAT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Surat (Otomatis / Bisa Disesuaikan)
                  </label>
                  <input
                    type="text"
                    name="nomor_surat"
                    defaultValue={`AUTO/RT03-RW14/XI/${new Date().getFullYear()}`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Surat Dikeluarkan
                  </label>
                  <input
                    type="date"
                    name="tanggal_surat"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perihal / Hal Surat
                  </label>
                  <input
                    type="text"
                    name="perihal"
                    value={perihal}
                    onChange={(e) => setPerihal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kepada Yth. (Nama / Tujuan)
                  </label>
                  <input
                    type="text"
                    name="tujuan_nama"
                    value={tujuanNama}
                    onChange={(e) => setTujuanNama(e.target.value)}
                    placeholder="Contoh: Seluruh Warga RT.03 / Bp. Agus"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Tujuan
                  </label>
                  <input
                    type="text"
                    name="tujuan_alamat"
                    value={tujuanAlamat}
                    onChange={(e) => setTujuanAlamat(e.target.value)}
                    placeholder="Contoh: Perumahan BPTW Tritih Lor / di Tempat"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* DROPDOWN PEMILIHAN UNIT / WARGA (KHUSUS PENGANTAR & PERINGATAN) */}
              {(jenis === 'surat_pengantar' || jenis === 'surat_peringatan') && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <User className="w-4 h-4 text-teal-600" />
                    Pilih Dari Data Warga Terdaftar (Otomatis Mengisi Data):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Pilih Rumah / Kepala Keluarga (56 Unit)
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => handleUnitSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="">-- Pilih Kepala Keluarga / Unit --</option>
                        {units
                          .filter((u) => u.nama_kepala_keluarga !== '-')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              Blok {u.blok_rumah}/{u.nomor_rumah} - {u.nama_kepala_keluarga}
                            </option>
                          ))}
                      </select>
                    </div>

                    {jenis === 'surat_pengantar' && selectedUnitId && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Pilih Anggota Keluarga Pemohon
                        </label>
                        <select
                          value={selectedMemberName}
                          onChange={(e) => handleMemberSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        >
                          {units
                            .find((u) => u.id === selectedUnitId)
                            ?.warga?.map((w, idx) => (
                              <option key={idx} value={w.nama_lengkap}>
                                {w.nama_lengkap} ({w.hubungan_keluarga})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FIELD KHUSUS UNDANGAN RAPAT & KERJA BAKTI */}
              {(jenis === 'undangan_rapat' || jenis === 'undangan_kerja_bakti') && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    {jenis === 'undangan_rapat' ? (
                      <Calendar className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Hammer className="w-4 h-4 text-orange-600" />
                    )}
                    Detail Jadwal & Lokasi Kegiatan
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Hari, Tanggal Acara
                      </label>
                      <input
                        type="text"
                        name="acara_hari_tanggal"
                        defaultValue="Minggu, 22 November 2026"
                        placeholder="Contoh: Minggu, 22 November 2026"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Waktu / Jam
                      </label>
                      <input
                        type="text"
                        name="acara_waktu"
                        defaultValue={
                          jenis === 'undangan_rapat'
                            ? "19.30 WIB (Ba'da Isya) s.d. Selesai"
                            : '07.00 WIB s.d. 10.30 WIB'
                        }
                        placeholder="Contoh: 19.30 WIB s.d. Selesai"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tempat / Titik Kumpul
                      </label>
                      <input
                        type="text"
                        name="acara_tempat"
                        defaultValue={
                          jenis === 'undangan_rapat'
                            ? 'Rumah Ketua RT (Bp. Yuli Ardinurman) Blok I/3'
                            : 'Pos Ronda RT.03 RW.14'
                        }
                        placeholder="Contoh: Balai Warga / Pos Ronda"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agenda Acara / Pokok Pembahasan (Gunakan baris baru untuk penomoran)
                    </label>
                    <textarea
                      name="agenda"
                      rows={3}
                      defaultValue={
                        jenis === 'undangan_rapat'
                          ? '1. Laporan Pertanggungjawaban Kas September - Oktober 2026\n2. Evaluasi Efektivitas Jadwal Ronda Malam Pos Kamling\n3. Pembahasan Kerja Bakti Drainase Musim Hujan'
                          : '1. Pembersihan saluran air dan drainase Blok UT s.d Blok L\n2. Pemangkasan dahan pohon liar di jalur penerangan umum (PJU)\n3. Pengecatan dan perapian Pos Ronda'
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Tambahan / Himbauan
                    </label>
                    <input
                      type="text"
                      name="catatan_khusus"
                      defaultValue={
                        jenis === 'undangan_rapat'
                          ? 'Dimohon kehadiran tepat waktu. Bagi yang berhalangan dapat diwakili anggota keluarga dewasa.'
                          : 'Dianjurkan membawa alat kerja pribadi (cangkul, sabit, sapu). Denda ketidakhadiran tanpa izin Rp 25.000.'
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* FIELD KHUSUS SURAT PENGANTAR ADMINISTRASI (NO NIK, NO KK!) */}
              {jenis === 'surat_pengantar' && (
                <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Data Pemohon (Identitas Tanpa NIK/KK Sesuai Privasi)
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      Kebijakan Privasi RT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap Pemohon
                      </label>
                      <input
                        type="text"
                        name="pemohon_nama"
                        value={selectedMemberName}
                        onChange={(e) => setSelectedMemberName(e.target.value)}
                        placeholder="Contoh: Muhammad Faris Noveandri"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        name="pemohon_jenis_kelamin"
                        value={pemohonJK}
                        onChange={(e) => setPemohonJK(e.target.value as 'L' | 'P')}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        name="pemohon_tempat_lahir"
                        value={pemohonTempatLahir}
                        onChange={(e) => setPemohonTempatLahir(e.target.value)}
                        placeholder="Cilacap"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        name="pemohon_tanggal_lahir"
                        value={pemohonTglLahir}
                        onChange={(e) => setPemohonTglLahir(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Usia & Kategori Usia
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="pemohon_usia"
                          value={pemohonUsia}
                          onChange={(e) => setPemohonUsia(e.target.value)}
                          placeholder="30 th"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          name="pemohon_kategori_usia"
                          value={pemohonKategori}
                          onChange={(e) => setPemohonKategori(e.target.value)}
                          placeholder="Dewasa"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Agama
                      </label>
                      <input
                        type="text"
                        name="pemohon_agama"
                        defaultValue="Islam"
                        placeholder="Islam"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pekerjaan
                      </label>
                      <input
                        type="text"
                        name="pemohon_pekerjaan"
                        defaultValue="Karyawan Swasta"
                        placeholder="Karyawan Swasta / Wiraswasta / PNS"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alamat Tinggal Lengkap
                      </label>
                      <input
                        type="text"
                        name="pemohon_alamat"
                        value={pemohonAlamat}
                        onChange={(e) => setPemohonAlamat(e.target.value)}
                        placeholder="Perumahan BPTW Tritih Lor Blok ..., RT.03 RW.14, Kel. Tritih Lor, Kec. Jeruklegi, Cilacap"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keperluan Surat Pengantar
                    </label>
                    <textarea
                      name="keperluan_surat"
                      rows={2}
                      defaultValue="Pengantar kelengkapan berkas administrasi penerbitan SKCK / Pembaruan Data Kependudukan ke Kelurahan Tritih Lor."
                      placeholder="Tuliskan keperluan pengurusan berkas..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Keterangan Kelakuan Baik / Keaktifan Warga
                      </label>
                      <input
                        type="text"
                        name="keterangan_tambahan"
                        defaultValue="Orang tersebut adalah benar warga RT.03 RW.14 yang berkelakuan baik dan belum pernah terlibat masalah pidana."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Masa Berlaku Surat
                      </label>
                      <input
                        type="text"
                        name="berlaku_hingga"
                        defaultValue="30 (tiga puluh) hari sejak tanggal dikeluarkan"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FIELD KHUSUS SURAT PERINGATAN WARGA */}
              {jenis === 'surat_peringatan' && (
                <div className="border border-red-200 rounded-2xl p-4 bg-red-50/30 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Rincian Peringatan & Pelanggaran Tata Tertib RT
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tingkat Peringatan
                      </label>
                      <select
                        name="peringatan_tingkat"
                        defaultValue="SP 1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-red-500 focus:outline-none font-bold"
                      >
                        <option value="Teguran">Surat Teguran / Imbauan</option>
                        <option value="SP 1">Surat Peringatan 1 (SP 1)</option>
                        <option value="SP 2">Surat Peringatan 2 (SP 2)</option>
                        <option value="SP 3">Surat Peringatan 3 (SP 3 - Keras)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ringkasan Bentuk Pelanggaran / Tunggakan
                      </label>
                      <input
                        type="text"
                        name="peringatan_pelanggaran"
                        defaultValue="Tunggakan akumulasi iuran kas bulanan dan denda ronda sejumlah Rp 350.000"
                        placeholder="Contoh: Tunggakan kas 3 bulan / Absensi ronda 3x berturut-turut"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uraian Masalah & Dasar Pembukuan Kas / Absensi
                    </label>
                    <textarea
                      name="peringatan_uraian"
                      rows={3}
                      defaultValue="Berdasarkan rekapitulasi pembukuan kas dan absensi RT.03 RW.14, tercatat kewajiban yang belum diselesaikan. Kami mengharapkan itikad baik dan kerja sama Bapak/Ibu demi kelancaran operasional lingkungan bersama."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Batas Waktu / Tenggat Penyelesaian
                      </label>
                      <input
                        type="text"
                        name="peringatan_tenggat"
                        defaultValue="10 (sepuluh) hari kalender sejak surat ini diterima"
                        placeholder="Contoh: 7 hari kerja / Paling lambat 25 November 2026"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Konsekuensi / Opsi Musyawarah
                      </label>
                      <input
                        type="text"
                        name="peringatan_sanksi"
                        defaultValue="Dapat dibayarkan ke Bendahara RT atau musyawarah langsung dengan Ketua RT."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PENANDATANGAN */}
              <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Penandatangan Utama
                  </label>
                  <input
                    type="text"
                    name="penandatangan_nama"
                    defaultValue="Yuli Ardinurman"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    name="penandatangan_jabatan"
                    defaultValue="Ketua RT.03 / RW.14"
                    className="w-full px-3 py-1.5 mt-1 border border-slate-200 rounded-lg text-[11px] text-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penandatangan Kedua (Opsional: Sekretaris / Koordinator)
                  </label>
                  <input
                    type="text"
                    name="penandatangan_kedua_nama"
                    defaultValue={
                      jenis === 'undangan_kerja_bakti'
                        ? 'Nanang Dedi A.'
                        : jenis === 'surat_peringatan'
                        ? 'Bendahara RT'
                        : 'Sekretaris RT'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="penandatangan_kedua_jabatan"
                    defaultValue={
                      jenis === 'undangan_kerja_bakti'
                        ? 'Koordinator Kebersihan'
                        : jenis === 'surat_peringatan'
                        ? 'Bendahara Kas RT'
                        : 'Sekretaris RT.03'
                    }
                    className="w-full px-3 py-1.5 mt-1 border border-slate-200 rounded-lg text-[11px] text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-sm"
                >
                  {loading ? 'Menyimpan...' : 'Terbitkan & Simpan Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
