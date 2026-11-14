'use client';

import React, { useState } from 'react';
import { SuratData } from '@/lib/data/storeSurat';
import { deleteSuratAction } from '@/app/(dashboard)/admin/surat/actions';
import {
  Printer,
  Share2,
  Copy,
  Check,
  Trash2,
  X,
  FileText,
  Calendar,
  Hammer,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  surat: SuratData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalViewSurat({ surat, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  // Format tanggal Indonesia
  const formatTanggalIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Generate pesan WA rapi & santun
  const generateWaMessage = () => {
    let msg = `*RUKUN TETANGGA 03 / RW 14 PERUMAHAN BPTW TRITIH LOR*\n`;
    msg += `==========================================\n\n`;

    if (surat.jenis === 'undangan_rapat') {
      msg += `*UNDANGAN RAPAT MUSYAWARAH WARGA RT.03*\n`;
      msg += `Nomor: ${surat.nomor_surat}\n\n`;
      msg += `Kepada Yth.\n*${surat.tujuan_nama}*\n\n`;
      msg += `Assalamu’alaikum Wr. Wb. / Salam Sejahtera,\n`;
      msg += `Mengharap dengan hormat kehadiran Bapak/Ibu dalam rangka *${surat.perihal}*, yang insya Allah diselenggarakan pada:\n\n`;
      msg += `📅 *Hari/Tanggal:* ${surat.acara_hari_tanggal || '-'}\n`;
      msg += `⏰ *Waktu:* ${surat.acara_waktu || '-'}\n`;
      msg += `📍 *Tempat:* ${surat.acara_tempat || '-'}\n`;
      msg += `📋 *Agenda Acara:*\n${surat.agenda || '-'}\n\n`;
      if (surat.catatan_khusus) {
        msg += `💡 *Catatan:* ${surat.catatan_khusus}\n\n`;
      }
      msg += `Mengingat pentingnya acara tersebut, kami mohon kehadiran Bapak/Ibu tepat waktu.\n\n`;
      msg += `Wassalamu’alaikum Wr. Wb.\n`;
      msg += `*Pengurus RT.03 RW.14*\nKetua RT: ${surat.penandatangan_nama}`;
    } else if (surat.jenis === 'undangan_kerja_bakti') {
      msg += `*UNDANGAN KERJA BAKTI & GOTONG ROYONG RT.03*\n`;
      msg += `Nomor: ${surat.nomor_surat}\n\n`;
      msg += `Kepada Yth.\n*${surat.tujuan_nama}*\n\n`;
      msg += `Salam sehat dan guyub rukun untuk seluruh warga.\n`;
      msg += `Dalam rangka menjaga kebersihan, kelancaran saluran air, dan kenyamanan lingkungan bersama, pengurus mengundang warga untuk hadir dalam kegiatan kerja bakti pada:\n\n`;
      msg += `📅 *Hari/Tanggal:* ${surat.acara_hari_tanggal || '-'}\n`;
      msg += `⏰ *Waktu:* ${surat.acara_waktu || '-'}\n`;
      msg += `📍 *Titik Kumpul:* ${surat.acara_tempat || '-'}\n`;
      msg += `🛠️ *Fokus Kerja Bakti:*\n${surat.agenda || '-'}\n\n`;
      if (surat.catatan_khusus) {
        msg += `💡 *Himbauan:* ${surat.catatan_khusus}\n\n`;
      }
      msg += `Atas partisipasi dan kerja samanya, kami ucapkan terima kasih.\n\n`;
      msg += `*Pengurus RT.03 RW.14*\nKetua RT: ${surat.penandatangan_nama}`;
    } else if (surat.jenis === 'surat_pengantar') {
      msg += `*SURAT PENGANTAR ADMINISTRASI RT.03 RW.14*\n`;
      msg += `Nomor: ${surat.nomor_surat}\n\n`;
      msg += `Kepada Yth. *${surat.tujuan_nama}*\n\n`;
      msg += `Menerangkan bahwa warga kami:\n`;
      msg += `• *Nama:* ${surat.pemohon_nama || '-'}\n`;
      msg += `• *TTL / Usia:* ${surat.pemohon_tempat_lahir || '-'}, ${surat.pemohon_tanggal_lahir || '-'} (${surat.pemohon_usia || '-'})\n`;
      msg += `• *Jenis Kelamin:* ${surat.pemohon_jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}\n`;
      msg += `• *Alamat:* ${surat.pemohon_alamat || '-'}\n\n`;
      msg += `*Keperluan:* ${surat.keperluan_surat || '-'}\n\n`;
      msg += `Surat pengantar resmi telah diterbitkan oleh Ketua RT.03 RW.14 Tritih Lor.\n`;
      msg += `*Ketua RT:* ${surat.penandatangan_nama}`;
    } else if (surat.jenis === 'surat_peringatan') {
      msg += `*SURAT PERINGATAN & IMBAUAN RT.03 RW.14*\n`;
      msg += `Nomor: ${surat.nomor_surat}\n`;
      msg += `Tingkat: *${surat.peringatan_tingkat || 'SP'}*\n\n`;
      msg += `Kepada Yth. *${surat.tujuan_nama}*\n`;
      msg += `Alamat: ${surat.tujuan_alamat || '-'}\n\n`;
      msg += `*Perihal:* ${surat.perihal}\n\n`;
      msg += `*Uraian Masalah:* ${surat.peringatan_pelanggaran || '-'}\n`;
      msg += `${surat.peringatan_uraian || ''}\n\n`;
      msg += `⏳ *Tenggat Waktu:* ${surat.peringatan_tenggat || '-'}\n`;
      if (surat.peringatan_sanksi) {
        msg += `⚖️ *Keterangan:* ${surat.peringatan_sanksi}\n\n`;
      }
      msg += `Demikian imbauan ini disampaikan untuk diselesaikan dengan baik.\n`;
      msg += `*Ketua RT.03 RW.14:* ${surat.penandatangan_nama}`;
    }

    return msg;
  };

  const handleCopyWa = () => {
    const text = generateWaMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWa = () => {
    const text = generateWaMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (confirm('Yakin ingin menghapus arsip surat ini?')) {
      setIsDeleting(true);
      await deleteSuratAction(surat.id);
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* CSS KHUSUS PRINT A4 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-letter-content,
          #print-letter-content * {
            visibility: visible;
          }
          #print-letter-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            background: white !important;
            color: black !important;
            font-size: 12pt;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* ACTION BAR ATAS (NO-PRINT) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                surat.jenis === 'undangan_rapat'
                  ? 'bg-blue-500/20 text-blue-300'
                  : surat.jenis === 'undangan_kerja_bakti'
                  ? 'bg-orange-500/20 text-orange-300'
                  : surat.jenis === 'surat_pengantar'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {surat.jenis.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-300 font-mono hidden sm:inline">
              {surat.nomor_surat}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWa}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin Teks WA
                </>
              )}
            </button>

            <button
              onClick={handleShareWa}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" /> Kirim WA
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / PDF
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-1.5 rounded-xl transition"
              title="Hapus Surat"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTAINER PREVIEW SURAT RESMI A4 */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100/70 flex justify-center">
          <div
            id="print-letter-content"
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-14 shadow-lg rounded-xl border border-slate-200/80 text-slate-900 font-serif leading-relaxed"
          >
            {/* KOP SURAT RESMI */}
            <div className="text-center relative pb-3">
              <div className="space-y-0.5">
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  PEMERINTAH KABUPATEN CILACAP • KECAMATAN JERUKLEGI
                </p>
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
                  KELURAHAN TRITIH LOR
                </p>
                <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-wider text-slate-900 mt-1">
                  RUKUN TETANGGA 03 / RUKUN WARGA 14
                </h2>
                <h3 className="text-base sm:text-lg font-bold font-sans tracking-wide text-slate-800">
                  PERUMAHAN BPTW TRITIH LOR
                </h3>
                <p className="text-[11px] font-sans text-slate-500 italic mt-0.5">
                  Sekretariat: Blok I No. 3 Perumahan BPTW Tritih Lor, Jeruklegi, Cilacap 53252 • Kontak: 0812-3456-7890
                </p>
              </div>

              {/* GARIS GANDA KOP SURAT */}
              <div className="border-b-[3px] border-slate-900 mt-3" />
              <div className="border-b border-slate-900 mt-[2px]" />
            </div>

            {/* TANGGAL & NOMOR SURAT */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start text-xs sm:text-sm">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-20 font-sans font-semibold">Nomor</span>
                  <span className="w-4">:</span>
                  <span className="font-mono font-semibold">{surat.nomor_surat}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-sans font-semibold">Lampiran</span>
                  <span className="w-4">:</span>
                  <span>{surat.lampiran || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-sans font-semibold">Perihal</span>
                  <span className="w-4">:</span>
                  <span className="font-bold underline">{surat.perihal}</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-0 text-left sm:text-right font-sans text-xs sm:text-sm">
                <p>Tritih Lor, {formatTanggalIndo(surat.tanggal_surat)}</p>
                <div className="mt-3 text-left">
                  <p className="font-semibold">Kepada Yth.</p>
                  <p className="font-bold text-slate-900">{surat.tujuan_nama}</p>
                  <p className="text-slate-600">{surat.tujuan_alamat || 'di Tempat'}</p>
                </div>
              </div>
            </div>

            {/* SALAM PEMBUKA */}
            <div className="mt-8 text-xs sm:text-sm">
              <p className="font-semibold">Dengan hormat,</p>
            </div>

            {/* KONTEN BERDASARKAN JENIS SURAT */}
            <div className="mt-3 text-xs sm:text-sm space-y-4 text-justify leading-relaxed">
              {/* 1. UNDANGAN RAPAT */}
              {surat.jenis === 'undangan_rapat' && (
                <>
                  <p>
                    Sehubungan dengan adanya agenda penting kemasyarakatan dan pelaporan pertanggungjawaban
                    lingkungan RT.03 RW.14 Perumahan BPTW Tritih Lor, dengan ini kami mengundang Bapak/Ibu
                    warga untuk menghadiri rapat musyawarah warga yang akan dilaksanakan pada:
                  </p>

                  <div className="pl-6 space-y-1.5 font-sans my-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Hari / Tanggal</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900">{surat.acara_hari_tanggal}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Waktu / Jam</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900">{surat.acara_waktu}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Tempat</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900">{surat.acara_tempat}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36 font-semibold text-slate-700 shrink-0">Agenda Rapat</span>
                      <span className="w-4 shrink-0">:</span>
                      <div className="font-medium whitespace-pre-line text-slate-800">
                        {surat.agenda}
                      </div>
                    </div>
                  </div>

                  {surat.catatan_khusus && (
                    <p className="italic text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <strong>Catatan:</strong> {surat.catatan_khusus}
                    </p>
                  )}

                  <p>
                    Mengingat pentingnya pokok pembahasan demi kemajuan dan kenyamanan lingkungan bersama,
                    kehadiran Bapak/Ibu sekalian sangat kami harapkan.
                  </p>
                </>
              )}

              {/* 2. UNDANGAN KERJA BAKTI */}
              {surat.jenis === 'undangan_kerja_bakti' && (
                <>
                  <p>
                    Dalam rangka menjaga kebersihan lingkungan, pencegahan genangan air saluran drainase
                    menjelang musim penghujan, serta memupuk rasa gotong royong warga, kami mengundang
                    Bapak/Ibu warga RT.03 RW.14 untuk berpartisipasi aktif dalam kegiatan kerja bakti pada:
                  </p>

                  <div className="pl-6 space-y-1.5 font-sans my-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Hari / Tanggal</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900">{surat.acara_hari_tanggal}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Waktu / Jam</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900">{surat.acara_waktu}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-semibold text-slate-700">Titik Kumpul</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900">{surat.acara_tempat}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36 font-semibold text-slate-700 shrink-0">Sasaran Kegiatan</span>
                      <span className="w-4 shrink-0">:</span>
                      <div className="font-medium whitespace-pre-line text-slate-800">
                        {surat.agenda}
                      </div>
                    </div>
                  </div>

                  {surat.catatan_khusus && (
                    <p className="text-slate-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <strong>Himbauan & Kebijakan:</strong> {surat.catatan_khusus}
                    </p>
                  )}

                  <p>
                    Atas perhatian, kepedulian, dan kebersamaan warga dalam menjaga lingkungan tetap asri
                    dan sehat, kami haturkan banyak terima kasih.
                  </p>
                </>
              )}

              {/* 3. SURAT PENGANTAR ADMINISTRASI (NO NIK, NO KK) */}
              {surat.jenis === 'surat_pengantar' && (
                <>
                  <p>
                    Yang bertanda tangan di bawah ini, Ketua Rukun Tetangga 03 / Rukun Warga 14 Perumahan
                    BPTW Tritih Lor, Kelurahan Tritih Lor, Kecamatan Jeruklegi, Kabupaten Cilacap, dengan
                    ini menerangkan dengan sebenarnya bahwa:
                  </p>

                  <div className="pl-6 space-y-1.5 font-sans my-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex">
                      <span className="w-44 font-semibold text-slate-700">Nama Lengkap</span>
                      <span className="w-4">:</span>
                      <span className="font-bold text-slate-900 uppercase">{surat.pemohon_nama}</span>
                    </div>
                    <div className="flex">
                      <span className="w-44 font-semibold text-slate-700">Tempat, Tanggal Lahir</span>
                      <span className="w-4">:</span>
                      <span>
                        {surat.pemohon_tempat_lahir || 'Cilacap'}, {formatTanggalIndo(surat.pemohon_tanggal_lahir)} (Usia {surat.pemohon_usia || '-'}, {surat.pemohon_kategori_usia || '-'})
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-44 font-semibold text-slate-700">Jenis Kelamin</span>
                      <span className="w-4">:</span>
                      <span>{surat.pemohon_jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-44 font-semibold text-slate-700">Agama</span>
                      <span className="w-4">:</span>
                      <span>{surat.pemohon_agama || 'Islam'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-44 font-semibold text-slate-700">Pekerjaan</span>
                      <span className="w-4">:</span>
                      <span>{surat.pemohon_pekerjaan || 'Karyawan Swasta'}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-44 font-semibold text-slate-700 shrink-0">Alamat Lengkap</span>
                      <span className="w-4 shrink-0">:</span>
                      <span className="font-medium text-slate-800">{surat.pemohon_alamat}</span>
                    </div>
                  </div>

                  <p>
                    Menerangkan bahwa nama tersebut di atas adalah benar-benar warga kami yang bertempat tinggal
                    pada alamat tersebut di atas.
                  </p>

                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 font-sans text-xs space-y-1">
                    <p className="font-bold text-emerald-900">Maksud / Keperluan Permohonan Surat:</p>
                    <p className="text-slate-800 font-medium">{surat.keperluan_surat}</p>
                  </div>

                  {surat.keterangan_tambahan && (
                    <p className="text-slate-700">{surat.keterangan_tambahan}</p>
                  )}

                  <p>
                    Surat pengantar ini berlaku selama <strong>{surat.berlaku_hingga || '30 hari'}</strong>{' '}
                    sejak tanggal diterbitkan. Demikian surat pengantar ini dibuat dengan sebenarnya untuk
                    dapat dipergunakan sebagaimana mestinya.
                  </p>
                </>
              )}

              {/* 4. SURAT PERINGATAN */}
              {surat.jenis === 'surat_peringatan' && (
                <>
                  <div className="text-center font-sans my-2">
                    <p className="font-bold text-base uppercase text-red-700 underline tracking-wide">
                      {surat.peringatan_tingkat || 'SURAT PERINGATAN'}
                    </p>
                    <p className="text-xs font-semibold text-slate-600">Nomor: {surat.nomor_surat}</p>
                  </div>

                  <p>
                    Berdasarkan catatan evaluasi pembukuan kas dan tata tertib ketertiban lingkungan RT.03
                    RW.14 Perumahan BPTW Tritih Lor, bersama surat ini kami sampaikan hal-hal sebagai berikut:
                  </p>

                  <div className="pl-6 space-y-2 font-sans my-4 bg-red-50/50 p-4 rounded-xl border border-red-200">
                    <div className="flex items-start">
                      <span className="w-36 font-semibold text-red-900 shrink-0">Perihal Peringatan</span>
                      <span className="w-4 shrink-0">:</span>
                      <span className="font-bold text-red-800">{surat.peringatan_pelanggaran}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36 font-semibold text-slate-700 shrink-0">Uraian / Keterangan</span>
                      <span className="w-4 shrink-0">:</span>
                      <span className="text-slate-800">{surat.peringatan_uraian}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36 font-semibold text-slate-700 shrink-0">Batas Penyelesaian</span>
                      <span className="w-4 shrink-0">:</span>
                      <span className="font-bold text-slate-900">{surat.peringatan_tenggat}</span>
                    </div>
                  </div>

                  {surat.peringatan_sanksi && (
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans">
                      <strong>Tindak Lanjut & Opsi Musyawarah:</strong> {surat.peringatan_sanksi}
                    </p>
                  )}

                  <p>
                    Kami sangat mengharapkan itikad baik dan kerja sama dari Bapak/Ibu demi kenyamanan,
                    kerukunan, dan kelangsungan operasional pelayanan seluruh warga RT.03 RW.14.
                  </p>
                </>
              )}
            </div>

            {/* SALAM PENUTUP */}
            <div className="mt-6 text-xs sm:text-sm">
              <p>Demikian surat ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
            </div>

            {/* TANDA TANGAN FORMAL DUA KOLOM */}
            <div className="mt-12 grid grid-cols-2 text-center text-xs sm:text-sm font-sans">
              <div>
                {surat.penandatangan_kedua_nama ? (
                  <>
                    <p className="font-semibold text-slate-700">{surat.penandatangan_kedua_jabatan || 'Sekretaris RT'}</p>
                    <div className="h-20" />
                    <p className="font-bold text-slate-900 underline">{surat.penandatangan_kedua_nama}</p>
                  </>
                ) : (
                  <div className="h-20" />
                )}
              </div>

              <div>
                <p className="font-semibold text-slate-700">{surat.penandatangan_jabatan || 'Ketua RT.03 / RW.14'}</p>
                <div className="h-20 flex items-center justify-center">
                  {/* STEMPEL WATERMARK RT */}
                  <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 flex items-center justify-center text-[9px] text-blue-500/40 font-bold uppercase rotate-[-12deg]">
                    RT 03 / RW 14
                  </div>
                </div>
                <p className="font-bold text-slate-900 underline uppercase">{surat.penandatangan_nama || 'Yuli Ardinurman'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
