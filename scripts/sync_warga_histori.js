const fs = require('fs');
const xlsx = require('xlsx');

const xlsxPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_live.xlsx';
const dbKasPath = 'C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_kas_periods.json';
const dbHistoriPath = 'C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_warga_histori.json';

const wb = xlsx.readFile(xlsxPath);

function parseExcelDate(val) {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  if (typeof val === 'number' && val > 30000) {
    // Excel date serial (UTC)
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str || str === '-') return null;
  return str;
}

function normAlamat(raw) {
  const m = String(raw || '').match(/([A-Za-z]+)\s*[\/\s-]?\s*(\d+)/i);
  if (!m) return String(raw || '').trim().toUpperCase();
  return `${m[1].toUpperCase()}/${m[2]}`;
}

// 1. Update tanggal_pembayaran on db_kas_periods.json
const dbKas = JSON.parse(fs.readFileSync(dbKasPath, 'utf-8'));

function attachPaymentDates(sheetName, periodId) {
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  const period = dbKas.periods.find((p) => p.id === periodId);
  if (!period) return;
  for (let i = 25; i <= 80; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const noUnit = Number(r[0]);
    const tgl = parseExcelDate(r[16]);
    const item = period.tagihan.find((t) => Number(t.no_unit) === noUnit);
    if (item) {
      item.tanggal_pembayaran = tgl;
    }
  }
}

attachPaymentDates('KAS SEPTEMBER 2026', 'periode-sep-2026');
attachPaymentDates('KAS OKTOBER 2026', 'periode-okt-2026');

fs.writeFileSync(dbKasPath, JSON.stringify(dbKas, null, 2), 'utf-8');

// 2. Build db_warga_histori.json from KRITERIA RONDA, DENDA RONDA OKT, KRITERIA KERJA BAKTI, KAS SEP & OKT
const kriteriaRondaRows = xlsx.utils.sheet_to_json(wb.Sheets['KRITERIA RONDA'], { header: 1 });
const kriteriaKbRows = xlsx.utils.sheet_to_json(wb.Sheets['KRITERIA KERJA BAKTI'], { header: 1 });
const dendaRondaOktRows = xlsx.utils.sheet_to_json(wb.Sheets['DENDA RONDA OKT'], { header: 1 });

const pSep = dbKas.periods.find((p) => p.id === 'periode-sep-2026');
const pOkt = dbKas.periods.find((p) => p.id === 'periode-okt-2026');

// Map DENDA RONDA OKT by normalized Blok/No (e.g. "UT/1")
const rondaOktByBlok = new Map();
for (let i = 10; i < dendaRondaOktRows.length; i++) {
  const r = dendaRondaOktRows[i];
  if (!r || !r[0] || typeof r[0] !== 'number') continue;
  const blokKey = normAlamat(r[2]);
  const mingguan = [
    { minggu: 'M1', status: String(r[4] || 'Absen').trim() },
    { minggu: 'M2', status: String(r[5] || 'Absen').trim() },
    { minggu: 'M3', status: String(r[6] || 'Absen').trim() },
    { minggu: 'M4', status: String(r[7] || 'Absen').trim() },
    { minggu: 'M5', status: String(r[8] || 'Absen').trim() },
  ];
  const hadirCount = mingguan.filter((m) => m.status.toLowerCase() === 'hadir').length;
  rondaOktByBlok.set(blokKey, {
    kategori: String(r[3] || '').trim(),
    mingguan,
    hadir_count: hadirCount,
    total_sesi: 5,
    denda: Number(r[10]) || 0,
  });
}

// Map KRITERIA KERJA BAKTI by no_unit
const kbByUnit = new Map();
for (let i = 6; i < kriteriaKbRows.length; i++) {
  const r = kriteriaKbRows[i];
  if (!r || typeof r[0] !== 'number') continue;
  kbByUnit.set(Number(r[0]), {
    kriteria: String(r[6] || 'Tidak Wajib').trim(),
    denda_per_absen: Number(r[7]) || 0,
  });
}

const historiList = [];
for (let i = 6; i < kriteriaRondaRows.length; i++) {
  const r = kriteriaRondaRows[i];
  if (!r || typeof r[0] !== 'number') continue;

  const noUnit = Number(r[0]);
  const blok = String(r[1] || '').trim().toUpperCase();
  const noRumah = String(r[2] || '').trim();
  const blokKey = `${blok}/${noRumah}`;
  const alamat = `Blok ${blokKey}`;
  const namaWarga = String(r[3] || '-').trim();
  const kriteriaRonda = String(r[9] || 'Tidak Ronda').trim();
  const dendaFullRonda = Number(r[10]) || 0;
  const dendaPerAbsenRonda = Number(r[11]) || 0;

  const tSep = pSep?.tagihan?.find((t) => Number(t.no_unit) === noUnit);
  const tOkt = pOkt?.tagihan?.find((t) => Number(t.no_unit) === noUnit);

  const oktDetail = rondaOktByBlok.get(blokKey) || null;
  const dendaRondaSep = Number(tSep?.denda_ronda || 0);
  const dendaRondaOkt = oktDetail ? oktDetail.denda : Number(tOkt?.denda_ronda || 0);

  const isWajibRonda = kriteriaRonda.toLowerCase().includes('wajib');
  const targetMinHadir = kriteriaRonda.toLowerCase().includes('luar kota') ? 4 : 4;

  const rondaHistori = [
    {
      periode_id: 'periode-okt-2026',
      periode_nama: 'Oktober 2026',
      status: !isWajibRonda
        ? 'Bebas / Tidak Ronda'
        : dendaRondaOkt === 0
        ? 'Terpenuhi (Bebas Denda)'
        : oktDetail && oktDetail.hadir_count > 0
        ? `Hadir Sebagian (${oktDetail.hadir_count}/5)`
        : 'Tidak Hadir / Denda',
      hadir_count: oktDetail ? oktDetail.hadir_count : null,
      total_sesi: oktDetail ? oktDetail.total_sesi : null,
      mingguan: oktDetail ? oktDetail.mingguan : [],
      denda: dendaRondaOkt,
      catatan: !isWajibRonda
        ? kriteriaRonda
        : dendaRondaOkt === 0
        ? 'Kehadiran wajib ronda bulan Oktober terpenuhi tanpa denda.'
        : `Terdapat denda ketidakhadiran ronda sebesar Rp ${dendaRondaOkt.toLocaleString('id-ID')}.`,
    },
    {
      periode_id: 'periode-sep-2026',
      periode_nama: 'September 2026',
      status: !isWajibRonda
        ? 'Bebas / Tidak Ronda'
        : dendaRondaSep === 0
        ? 'Terpenuhi (Bebas Denda)'
        : 'Ada Ketidakhadiran / Denda',
      hadir_count: null,
      total_sesi: null,
      mingguan: [],
      denda: dendaRondaSep,
      catatan: !isWajibRonda
        ? kriteriaRonda
        : dendaRondaSep === 0
        ? 'Kewajiban ronda bulan September terpenuhi tanpa denda.'
        : `Rekap closing September mencatat denda ronda Rp ${dendaRondaSep.toLocaleString('id-ID')}.`,
    },
  ];

  const kbMeta = kbByUnit.get(noUnit) || { kriteria: 'Tidak Wajib', denda_per_absen: 0 };
  const isWajibKb = kbMeta.kriteria.toLowerCase().includes('wajib') && !kbMeta.kriteria.toLowerCase().includes('tidak wajib');
  const dendaKbSep = Number(tSep?.denda_kerja_bakti || 0);
  const dendaKbOkt = Number(tOkt?.denda_kerja_bakti || 0);

  const buildKbStatus = (denda, periodeNama) => {
    if (!isWajibKb && denda === 0) {
      return {
        status: kbMeta.kriteria,
        catatan: `Kategori unit: ${kbMeta.kriteria} pada periode ${periodeNama}.`,
      };
    }
    if (denda === 0) {
      return {
        status: 'Hadir / Bebas Denda',
        catatan: `Hadir atau dibebaskan pada kegiatan kerja bakti ${periodeNama}.`,
      };
    }
    return {
      status: 'Tidak Hadir',
      catatan: `Tidak hadir kerja bakti ${periodeNama} (Denda Rp ${denda.toLocaleString('id-ID')}).`,
    };
  };

  const kbOktStatus = buildKbStatus(dendaKbOkt, 'Oktober 2026');
  const kbSepStatus = buildKbStatus(dendaKbSep, 'September 2026');

  const kbHistori = [
    {
      periode_id: 'periode-okt-2026',
      periode_nama: 'Oktober 2026',
      status: kbOktStatus.status,
      denda: dendaKbOkt,
      catatan: kbOktStatus.catatan,
    },
    {
      periode_id: 'periode-sep-2026',
      periode_nama: 'September 2026',
      status: kbSepStatus.status,
      denda: dendaKbSep,
      catatan: kbSepStatus.catatan,
    },
  ];

  historiList.push({
    no_unit: noUnit,
    alamat,
    nama_warga: namaWarga,
    ronda: {
      kriteria: kriteriaRonda,
      denda_full: dendaFullRonda,
      denda_per_absen: dendaPerAbsenRonda,
      target_minimal_hadir: isWajibRonda ? targetMinHadir : 0,
      histori: rondaHistori,
    },
    kerja_bakti: {
      kriteria: kbMeta.kriteria,
      denda_per_absen: kbMeta.denda_per_absen,
      histori: kbHistori,
    },
  });
}

fs.writeFileSync(dbHistoriPath, JSON.stringify(historiList, null, 2), 'utf-8');
console.log('Generated db_warga_histori.json for', historiList.length, 'units');
console.log('Sample Unit 1 (TITO):', JSON.stringify(historiList[0], null, 2));
console.log('Sample Payment Date Sep & Okt Unit 3 (Hardi):', {
  sep: pSep?.tagihan?.find((t) => t.no_unit === 3)?.tanggal_pembayaran,
  okt: pOkt?.tagihan?.find((t) => t.no_unit === 3)?.tanggal_pembayaran,
});
