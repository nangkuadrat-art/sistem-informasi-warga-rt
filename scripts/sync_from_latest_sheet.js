const fs = require('fs');
const xlsx = require('xlsx');

const currentPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(currentPath);
const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

function parseTagihanFromSheet(sheet, periodPrefix) {
  const list = [];
  for (let i = 25; i <= 80; i++) {
    const r = sheet[i];
    if (!r || !r[0]) continue;
    const no = Number(r[0]);
    const alamat = String(r[1]).trim();
    const nama = String(r[2]).trim();
    const iuran = Number(r[3]) || 0;
    const dendaRonda = Number(r[4]) || 0;
    const dendaKB = Number(r[5]) || 0;
    const totalDenda = Number(r[6]) || 0;
    const tunggakanLalu = Number(r[7]) || 0;
    const titipanLalu = Number(r[8]) || 0;
    const totalTagihan = Number(r[9]) || 0;
    const bayar = Number(r[10]) || 0;
    const kurangLebih = Number(r[11]) || 0;
    const donatur = Number(r[12]) || 0;
    const titipanDepan = Number(r[13]) || 0;
    const statusStr = r[14] ? String(r[14]).trim() : '';
    const ket = r[15] ? String(r[15]).trim() : '';

    const m = alamat.match(/([A-Za-z]+)\s*(\d+)/i);
    const blok = m ? m[1].toUpperCase() : '';
    const noRumah = m ? m[2] : '';

    let statusBayar = 'belum_bayar';
    if (statusStr === 'KOSONG' || totalTagihan === 0 || nama === '-') statusBayar = 'kosong';
    else if (statusStr === 'LUNAS' || bayar >= totalTagihan) statusBayar = 'lunas';
    else if (bayar > 0) statusBayar = 'sebagian';

    list.push({
      id: `tagihan-${periodPrefix}-${no}`,
      no_unit: no,
      blok_rumah: blok,
      nomor_rumah: noRumah,
      alamat: `Blok ${blok}/${noRumah}`,
      nama_warga: nama,
      iuran_pokok: iuran,
      denda_ronda: dendaRonda,
      denda_kerja_bakti: dendaKB,
      total_denda: totalDenda,
      tunggakan_bulan_lalu: tunggakanLalu,
      titipan_bulan_lalu: titipanLalu,
      total_tagihan: totalTagihan,
      total_terbayar: bayar,
      kurang_lebih: kurangLebih,
      donatur: donatur,
      titipan_depan: titipanDepan,
      status_bayar: statusBayar,
      status_label: statusStr,
      keterangan: ket
    });
  }
  return list;
}

const sepTagihan = parseTagihanFromSheet(sepSheet, 'periode-sep-2026');
const oktTagihan = parseTagihanFromSheet(oktSheet, 'periode-okt-2026');

// Load current db_kas_periods.json to keep transactions intact
const dbKasPath = 'C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_kas_periods.json';
const dbKas = JSON.parse(fs.readFileSync(dbKasPath, 'utf-8'));

// Update September
const pSep = dbKas.periods.find(p => p.id === 'periode-sep-2026');
if (pSep) {
  pSep.tagihan = sepTagihan;
  pSep.saldo_awal = 5534500;
  pSep.total_masuk = 8182000;
  pSep.total_keluar = 4814000;
  pSep.saldo_akhir = 8902500;
  pSep.status = 'closed';
}

// Update October
const pOkt = dbKas.periods.find(p => p.id === 'periode-okt-2026');
if (pOkt) {
  pOkt.tagihan = oktTagihan;
  pOkt.saldo_awal = 8902500;
  pOkt.total_masuk = 1875000;
  pOkt.total_keluar = 844000;
  pOkt.saldo_akhir = 9933500;
  pOkt.status = 'open';
}

fs.writeFileSync(dbKasPath, JSON.stringify(dbKas, null, 2), 'utf-8');
console.log('Successfully updated db_kas_periods.json!');

// Update db_warga.json for Unit 33 (Blok I/2) and Unit 13 (YONGKI)
const dbWargaPath = 'C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_warga.json';
if (fs.existsSync(dbWargaPath)) {
  const units = JSON.parse(fs.readFileSync(dbWargaPath, 'utf-8'));
  
  // Unit 33
  const u33 = units.find(u => u.no_unit === 33 || (u.blok_rumah === 'I' && u.nomor_rumah === '2'));
  if (u33) {
    u33.nama_kepala_keluarga = '-';
    u33.status_rumah = 'kosong';
    u33.status_keluarga = 'nonaktif';
    u33.iuran_pokok = 0;
    u33.denda_ronda = 0;
    u33.denda_kerja_bakti = 0;
    u33.total_denda = 0;
    u33.tunggakan_bulan_lalu = 0;
    u33.total_tagihan = 0;
    u33.total_terbayar = 0;
    u33.status_bayar = 'kosong';
    u33.warga = [];
    console.log('Updated Unit 33 (Blok I/2) in db_warga.json as Kosong');
  }

  // Unit 13 (YONGKI)
  const u13 = units.find(u => u.no_unit === 13 || (u.blok_rumah === 'UT' && u.nomor_rumah === '25'));
  if (u13) {
    u13.nama_kepala_keluarga = 'YONGKI';
    u13.username = 'yongki';
    console.log('Updated Unit 13 (Blok UT/25) in db_warga.json as YONGKI');
  }

  fs.writeFileSync(dbWargaPath, JSON.stringify(units, null, 2), 'utf-8');
  console.log('Successfully updated db_warga.json!');
}
