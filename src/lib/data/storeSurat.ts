import fs from 'fs';
import path from 'path';
import { getDbFilePath } from './dbPathHelper';

export type JenisSurat =
  | 'undangan_rapat'
  | 'undangan_kerja_bakti'
  | 'surat_pengantar'
  | 'surat_peringatan';

export interface SuratData {
  id: string;
  nomor_surat: string;
  jenis: JenisSurat;
  perihal: string;
  lampiran?: string;
  tanggal_surat: string; // YYYY-MM-DD
  tujuan_nama: string;
  tujuan_alamat?: string;
  tujuan_unit_id?: string;

  // Undangan Rapat & Kerja Bakti
  acara_hari_tanggal?: string;
  acara_waktu?: string;
  acara_tempat?: string;
  agenda?: string;
  catatan_khusus?: string;

  // Surat Pengantar Administrasi
  // PRIVACY DIRECTIVE: No NIK, No KK!
  pemohon_nama?: string;
  pemohon_tempat_lahir?: string;
  pemohon_tanggal_lahir?: string;
  pemohon_usia?: string;
  pemohon_kategori_usia?: string;
  pemohon_jenis_kelamin?: 'L' | 'P';
  pemohon_agama?: string;
  pemohon_pekerjaan?: string;
  pemohon_alamat?: string;
  keperluan_surat?: string;
  keterangan_tambahan?: string;
  berlaku_hingga?: string;

  // Surat Peringatan
  peringatan_tingkat?: 'Teguran' | 'SP 1' | 'SP 2' | 'SP 3';
  peringatan_pelanggaran?: string;
  peringatan_uraian?: string;
  peringatan_tenggat?: string;
  peringatan_sanksi?: string;

  // Penandatangan
  penandatangan_nama: string;
  penandatangan_jabatan: string;
  penandatangan_kedua_nama?: string;
  penandatangan_kedua_jabatan?: string;

  created_at: string;
}

const DB_SURAT_PATH = getDbFilePath('db_surat.json');

const INITIAL_SURAT: SuratData[] = [
  {
    id: 'surat-1',
    nomor_surat: '012/UND-RAPAT/RT03-RW14/XI/2026',
    jenis: 'undangan_rapat',
    perihal: 'Undangan Rapat Rutin Warga & Pertanggungjawaban Kas RT',
    lampiran: '-',
    tanggal_surat: '2026-11-15',
    tujuan_nama: 'Bapak/Ibu Seluruh Warga RT.03 / RW.14',
    tujuan_alamat: 'Perumahan BPTW Tritih Lor, Cilacap',
    acara_hari_tanggal: 'Minggu, 22 November 2026',
    acara_waktu: '19.30 WIB (Ba’da Isya) s.d. Selesai',
    acara_tempat: 'Rumah Ketua RT (Bp. Yuli Ardinurman) Blok I/3',
    agenda: '1. Laporan Pertanggungjawaban Kas Periode September - Oktober 2026\n2. Evaluasi Jadwal Ronda Malam & Efektivitas Keamanan Pos Kamling\n3. Rencana Pengadaan Lampu PJU & Kerja Bakti Saluran Got',
    catatan_khusus: 'Mengingat pentingnya musyawarah lingkungan ini, dimohon kehadiran Bapak/Ibu tepat waktu. Apabila berhalangan hadir dapat diwakili oleh anggota keluarga dewasa.',
    penandatangan_nama: 'Yuli Ardinurman',
    penandatangan_jabatan: 'Ketua RT.03 / RW.14',
    penandatangan_kedua_nama: 'Sekretaris RT',
    penandatangan_kedua_jabatan: 'Sekretaris RT.03',
    created_at: '2026-11-13T09:00:00Z',
  },
  {
    id: 'surat-2',
    nomor_surat: '008/UND-KB/RT03-RW14/XI/2026',
    jenis: 'undangan_kerja_bakti',
    perihal: 'Undangan Kerja Bakti & Gotong Royong Warga RT.03 Menjelang Musim Hujan',
    lampiran: '-',
    tanggal_surat: '2026-11-18',
    tujuan_nama: 'Seluruh Warga RT.03 / RW.14 (Perwakilan 1 Orang per KK)',
    tujuan_alamat: 'Perumahan BPTW Tritih Lor, Cilacap',
    acara_hari_tanggal: 'Minggu, 29 November 2026',
    acara_waktu: '07.00 WIB s.d. 10.30 WIB',
    acara_tempat: 'Titik Kumpul: Pos Ronda RT.03 RW.14',
    agenda: '1. Normalisasi & pembersihan sedimentasi got/drainase saluran air Blok UT s.d Blok L\n2. Pemangkasan dahan pohon yang menghalangi penerangan jalan umum (PJU)\n3. Perapian dan pengecatan area Pos Ronda & Balai Bersama',
    catatan_khusus: 'Dihimbau membawa peralatan pribadi (cangkul, sabit, sapu lidi, karung). Disediakan konsumsi snack dan minuman dari kas RT. Sesuai kesepakatan warga, denda ketidakhadiran tanpa keterangan sebesar Rp 25.000.',
    penandatangan_nama: 'Yuli Ardinurman',
    penandatangan_jabatan: 'Ketua RT.03 / RW.14',
    penandatangan_kedua_nama: 'Nanang Dedi A.',
    penandatangan_kedua_jabatan: 'Koordinator Kebersihan',
    created_at: '2026-11-13T09:05:00Z',
  },
  {
    id: 'surat-3',
    nomor_surat: '024/SKP/RT03-RW14/XI/2026',
    jenis: 'surat_pengantar',
    perihal: 'Surat Pengantar Permohonan SKCK (Catatan Kepolisian)',
    lampiran: '-',
    tanggal_surat: '2026-11-13',
    tujuan_nama: 'Yth. Kepala Kelurahan Tritih Lor / Kapolsek Jeruklegi',
    tujuan_alamat: 'di Tempat',
    pemohon_nama: 'Muhammad Faris Noveandri',
    pemohon_tempat_lahir: 'Cilacap',
    pemohon_tanggal_lahir: '1996-03-20',
    pemohon_usia: '30 th',
    pemohon_kategori_usia: 'Dewasa',
    pemohon_jenis_kelamin: 'L',
    pemohon_agama: 'Islam',
    pemohon_pekerjaan: 'Karyawan Swasta',
    pemohon_alamat: 'Perumahan BPTW Tritih Lor Blok UT No. 17, RT.03 RW.14, Kel. Tritih Lor, Kec. Jeruklegi, Kab. Cilacap',
    keperluan_surat: 'Pengantar kelengkapan berkas penerbitan Surat Keterangan Catatan Kepolisian (SKCK) di Polsek Jeruklegi guna persyaratan administrasi melamar pekerjaan.',
    keterangan_tambahan: 'Nama tersebut di atas adalah benar-benar warga yang bertempat tinggal di lingkungan RT.03 RW.14 Tritih Lor, beritikad dan berkelakuan baik di masyarakat, serta belum pernah terlibat dalam pelanggaran hukum atau tindak pidana apapun.',
    berlaku_hingga: '13 Desember 2026 (30 hari sejak tanggal diterbitkan)',
    penandatangan_nama: 'Yuli Ardinurman',
    penandatangan_jabatan: 'Ketua RT.03 / RW.14',
    created_at: '2026-11-13T09:10:00Z',
  },
  {
    id: 'surat-4',
    nomor_surat: '005/SP-1/RT03-RW14/XI/2026',
    jenis: 'surat_peringatan',
    perihal: 'Surat Peringatan & Imbauan Penyelesaian Tunggakan Kas RT',
    lampiran: '-',
    tanggal_surat: '2026-11-13',
    tujuan_nama: 'Bapak Agus (Kepala Keluarga)',
    tujuan_alamat: 'Blok UT No. 23, Perumahan BPTW Tritih Lor',
    peringatan_tingkat: 'SP 1',
    peringatan_pelanggaran: 'Tunggakan akumulasi iuran kas bulanan dan denda ronda tercatat sejumlah Rp 425.000 (September - Oktober 2026)',
    peringatan_uraian: 'Berdasarkan rekapitulasi buku kas RT.03 RW.14 per penutupan buku Oktober 2026, tercatat kewajiban iuran pokok dan denda ronda yang belum diselesaikan. Kami mengharapkan kerja sama dan partisipasi aktif Bapak demi kelancaran operasional kebersihan, keamanan pos ronda, dan penerangan jalan lingkungan bersama.',
    peringatan_tenggat: '10 (sepuluh) hari kalender sejak surat ini diterima (paling lambat 23 November 2026)',
    peringatan_sanksi: 'Pembayaran dapat diserahkan langsung kepada Bendahara RT atau melalui transfer kas RT. Apabila terdapat kendala ekonomi, Bapak dipersilakan bermusyawarah langsung dengan Ketua RT untuk skema keringanan/angsuran.',
    penandatangan_nama: 'Yuli Ardinurman',
    penandatangan_jabatan: 'Ketua RT.03 / RW.14',
    penandatangan_kedua_nama: 'Bendahara RT',
    penandatangan_kedua_jabatan: 'Bendahara Kas RT',
    created_at: '2026-11-13T09:15:00Z',
  },
];

export function getAllSurat(): SuratData[] {
  try {
    if (!fs.existsSync(DB_SURAT_PATH)) {
      fs.writeFileSync(DB_SURAT_PATH, JSON.stringify(INITIAL_SURAT, null, 2), 'utf-8');
      return INITIAL_SURAT;
    }
    const data = fs.readFileSync(DB_SURAT_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      fs.writeFileSync(DB_SURAT_PATH, JSON.stringify(INITIAL_SURAT, null, 2), 'utf-8');
      return INITIAL_SURAT;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading db_surat.json, returning fallback initial data:', e);
    return INITIAL_SURAT;
  }
}

export function saveAllSurat(suratList: SuratData[]): void {
  try {
    fs.writeFileSync(DB_SURAT_PATH, JSON.stringify(suratList, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db_surat.json:', e);
  }
}

export function getSuratById(id: string): SuratData | null {
  const list = getAllSurat();
  return list.find((s) => s.id === id) || null;
}

export function createSurat(data: Omit<SuratData, 'id' | 'created_at'>): SuratData {
  const list = getAllSurat();
  const newSurat: SuratData = {
    ...data,
    id: `surat-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  list.unshift(newSurat);
  saveAllSurat(list);
  return newSurat;
}

export function updateSurat(id: string, data: Partial<SuratData>): SuratData | null {
  const list = getAllSurat();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  saveAllSurat(list);
  return list[idx];
}

export function deleteSurat(id: string): boolean {
  const list = getAllSurat();
  const filtered = list.filter((s) => s.id !== id);
  if (filtered.length === list.length) return false;
  saveAllSurat(filtered);
  return true;
}

// Helper penomoran otomatis
export function generateNomorSurat(jenis: JenisSurat): string {
  const list = getAllSurat();
  const sameTypeCount = list.filter((s) => s.jenis === jenis).length + 1;
  const numStr = String(sameTypeCount).padStart(3, '0');
  const now = new Date();
  const romawiBulan = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
    now.getMonth()
  ];
  const tahun = now.getFullYear();

  let kode = 'SURAT';
  switch (jenis) {
    case 'undangan_rapat':
      kode = 'UND-RAPAT';
      break;
    case 'undangan_kerja_bakti':
      kode = 'UND-KB';
      break;
    case 'surat_pengantar':
      kode = 'SKP';
      break;
    case 'surat_peringatan':
      kode = 'SP-1';
      break;
  }

  return `${numStr}/${kode}/RT03-RW14/${romawiBulan}/${tahun}`;
}
