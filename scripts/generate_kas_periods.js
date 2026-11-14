const fs = require('fs');
const xlsx = require('xlsx');

const excelPath = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx';
const wb = xlsx.readFile(excelPath);

const sepSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS SEPTEMBER 2026'], { header: 1 });
const oktSheet = xlsx.utils.sheet_to_json(wb.Sheets['KAS OKTOBER 2026'], { header: 1 });

// Parse September Transactions
const sepTxList = [
  {
    id: "tx-sep-1",
    tanggal_transaksi: "2026-09-01",
    keterangan: "Sisa Saldo Kas Bulan Sebelumnya (Agustus 2026)",
    jenis: "masuk",
    kategori: "saldo_awal",
    nominal: 5534500
  },
  {
    id: "tx-sep-2",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Total Masukan Bersih Iuran Warga Bulan Ini",
    jenis: "masuk",
    kategori: "iuran_warga",
    nominal: 4747000
  },
  {
    id: "tx-sep-3",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Donatur Kas RT (Sumbangan Warga/Kegiatan)",
    jenis: "masuk",
    kategori: "donasi",
    nominal: 3435000
  },
  {
    id: "tx-sep-4",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Dana Apresiasi Pengurus RT",
    jenis: "keluar",
    kategori: "operasional",
    nominal: 400000
  },
  {
    id: "tx-sep-5",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Dansos RW (6 Bulan: April s.d. September 2026)",
    jenis: "keluar",
    kategori: "sosial",
    nominal: 1776000
  },
  {
    id: "tx-sep-6",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Uang Snack Rapat RT (Bp. Bambang)",
    jenis: "keluar",
    kategori: "konsumsi",
    nominal: 120000
  },
  {
    id: "tx-sep-7",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Ajangsana Anak Pak Dwi Utama (Sakit)",
    jenis: "keluar",
    kategori: "sosial",
    nominal: 150000
  },
  {
    id: "tx-sep-8",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Akomodasi Konsumsi Kerja Bakti Warga 2026",
    jenis: "keluar",
    kategori: "konsumsi",
    nominal: 168000
  },
  {
    id: "tx-sep-9",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Pembayaran Pengangkutan Sampah Pos ke Mas Bekti",
    jenis: "keluar",
    kategori: "kebersihan",
    nominal: 200000
  },
  {
    id: "tx-sep-10",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Iuran Pembangunan Balai RW 14",
    jenis: "keluar",
    kategori: "pembangunan",
    nominal: 1000000
  },
  {
    id: "tx-sep-11",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Perbaikan Penerangan Jalan Umum (PJU) Blok G",
    jenis: "keluar",
    kategori: "perbaikan",
    nominal: 700000
  },
  {
    id: "tx-sep-12",
    tanggal_transaksi: "2026-09-30",
    keterangan: "Biaya Konsumsi Gotong Royong Balai RW",
    jenis: "keluar",
    kategori: "konsumsi",
    nominal: 300000
  }
];

// Parse September Tagihan (56 units)
const sepTagihanList = [];
for (let i = 25; i <= 80; i++) {
  const r = sepSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const alamat = String(r[1]).trim();
  const nama = String(r[2]).trim();
  const iuran = Number(r[3]) || 0;
  const dendaRonda = Number(r[4]) || 0;
  const dendaKb = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const totalTagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;
  const kurangLebih = Number(r[10]) || 0;
  const donatur = Number(r[11]) || 0;

  const m = alamat.match(/([A-Za-z]+)\s*(\d+)/i);
  const blok = m ? m[1].toUpperCase() : '';
  const noRumah = m ? m[2] : '';

  let statusBayar = 'belum_bayar';
  if (totalTagihan === 0) statusBayar = 'kosong';
  else if (bayar >= totalTagihan) statusBayar = 'lunas';
  else if (bayar > 0) statusBayar = 'sebagian';

  sepTagihanList.push({
    id: `tagihan-sep-${no}`,
    no_unit: no,
    blok_rumah: blok,
    nomor_rumah: noRumah,
    alamat: `Blok ${blok}/${noRumah}`,
    nama_warga: nama,
    iuran_pokok: iuran,
    denda_ronda: dendaRonda,
    denda_kerja_bakti: dendaKb,
    total_denda: totalDenda,
    titipan_lalu: titipanLalu,
    total_tagihan: totalTagihan,
    total_terbayar: bayar,
    kurang_lebih: kurangLebih,
    donatur: donatur,
    status_bayar: statusBayar
  });
}

// Parse October Tagihan (56 units) with explicit links to September
const oktTagihanList = [];
for (let i = 25; i <= 80; i++) {
  const r = oktSheet[i];
  if (!r || !r[0]) continue;
  const no = Number(r[0]);
  const alamat = String(r[1]).trim();
  const nama = String(r[2]).trim();
  const iuran = Number(r[3]) || 0;
  const dendaRonda = Number(r[4]) || 0;
  const dendaKb = Number(r[5]) || 0;
  const totalDenda = Number(r[6]) || 0;
  const titipanLalu = Number(r[7]) || 0;
  const totalTagihan = Number(r[8]) || 0;
  const bayar = Number(r[9]) || 0;

  const m = alamat.match(/([A-Za-z]+)\s*(\d+)/i);
  const blok = m ? m[1].toUpperCase() : '';
  const noRumah = m ? m[2] : '';

  let statusBayar = 'belum_bayar';
  if (totalTagihan === 0) statusBayar = 'kosong';
  else if (bayar >= totalTagihan) statusBayar = 'lunas';
  else if (bayar > 0) statusBayar = 'sebagian';

  // Cari tagihan september
  const sepItem = sepTagihanList.find(s => s.no_unit === no);
  const tunggakanDariSep = sepItem && sepItem.kurang_lebih < 0 ? Math.abs(sepItem.kurang_lebih) : 0;
  const titipanDariSep = sepItem && sepItem.kurang_lebih > 0 ? sepItem.kurang_lebih : 0;

  oktTagihanList.push({
    id: `tagihan-okt-${no}`,
    no_unit: no,
    blok_rumah: blok,
    nomor_rumah: noRumah,
    alamat: `Blok ${blok}/${noRumah}`,
    nama_warga: nama,
    iuran_pokok: iuran,
    denda_ronda: dendaRonda,
    denda_kerja_bakti: dendaKb,
    total_denda: totalDenda,
    tunggakan_bulan_lalu: tunggakanDariSep,
    titipan_bulan_lalu: titipanDariSep,
    total_tagihan: totalTagihan,
    total_terbayar: bayar,
    status_bayar: statusBayar
  });
}

// Write to JSON database files
const kasMultiPeriod = {
  periods: [
    {
      id: "periode-sep-2026",
      bulan: 9,
      tahun: 2026,
      nama: "September 2026",
      status: "closed",
      closed_at: "2026-09-30T23:59:59Z",
      saldo_awal: 5534500,
      total_masuk: 8182000,
      total_keluar: 4814000,
      saldo_akhir: 8902500,
      catatan_closing: "Buku kas September 2026 telah ditutup (closing). Saldo akhir Rp 8.902.500 telah digulirkan menjadi saldo awal Oktober 2026.",
      transaksi: sepTxList,
      tagihan: sepTagihanList
    },
    {
      id: "periode-okt-2026",
      bulan: 10,
      tahun: 2026,
      nama: "Oktober 2026",
      status: "open",
      saldo_awal: 8902500,
      total_masuk: 1875000,
      total_keluar: 844000,
      saldo_akhir: 9933500,
      catatan_closing: "Periode aktif berjalan. Saldo awal bergulir otomatis dari saldo akhir September 2026.",
      transaksi: [
        {
          id: "tx-okt-1",
          tanggal_transaksi: "2026-10-01",
          keterangan: "Sisa Saldo Kas Bulan Sebelumnya (September 2026)",
          jenis: "masuk",
          kategori: "saldo_awal",
          nominal: 8902500
        },
        {
          id: "tx-okt-2",
          tanggal_transaksi: "2026-10-31",
          keterangan: "Total Masukan Bersih Iuran Warga Bulan Ini",
          jenis: "masuk",
          kategori: "iuran_warga",
          nominal: 1875000
        },
        {
          id: "tx-okt-3",
          tanggal_transaksi: "2026-10-31",
          keterangan: "Dana Apresiasi Pengurus RT",
          jenis: "keluar",
          kategori: "operasional",
          nominal: 400000
        },
        {
          id: "tx-okt-4",
          tanggal_transaksi: "2026-10-31",
          keterangan: "Biaya Operasional Listrik Pos Ronda",
          jenis: "keluar",
          kategori: "keamanan",
          nominal: 203000
        },
        {
          id: "tx-okt-5",
          tanggal_transaksi: "2026-10-31",
          keterangan: "Tagihan Air Bersih PDAM Pos Ronda",
          jenis: "keluar",
          kategori: "keamanan",
          nominal: 86000
        },
        {
          id: "tx-okt-6",
          tanggal_transaksi: "2026-10-31",
          keterangan: "Uang Snack Rapat RT (Bp. Hardi)",
          jenis: "keluar",
          kategori: "konsumsi",
          nominal: 120000
        },
        {
          id: "tx-okt-7",
          tanggal_transaksi: "2026-10-31",
          keterangan: "Pembelian Obat Nyamuk Baigon untuk Pos Ronda",
          jenis: "keluar",
          kategori: "keamanan",
          nominal: 35000
        }
      ],
      tagihan: oktTagihanList
    }
  ]
};

fs.writeFileSync('C:/Users/HP/.gemini/antigravity/scratch/sistem-informasi-warga-rt/src/lib/data/db_kas_periods.json', JSON.stringify(kasMultiPeriod, null, 2), 'utf-8');
console.log('Successfully generated db_kas_periods.json with September and October data!');
