import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah, NAMA_BULAN } from './currency';
import { summarizePemasukanBreakdown } from '@/lib/data/kasCategories';

export interface PeriodeInfo {
  bulan: number;
  tahun: number;
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  namaRtRw?: string;
}

export interface TransaksiItem {
  tanggal_transaksi: string;
  keterangan: string;
  kategori: string;
  jenis: 'masuk' | 'keluar';
  nominal: number;
}

export function exportKasToExcel(
  transaksiList: TransaksiItem[],
  periode: PeriodeInfo,
  namaRt: string = 'RT 03 / RW 14'
) {
  const breakdown = summarizePemasukanBreakdown(transaksiList);
  const summaryData = [
    ['LAPORAN BUKU KAS KEUANGAN WARGA', ''],
    ['LINGKUNGAN', namaRt],
    ['PERIODE', `${NAMA_BULAN[periode.bulan]} ${periode.tahun}`],
    ['', ''],
    ['RINGKASAN SALDO & PEMASUKAN', 'NOMINAL (RP)'],
    ['Saldo Awal (Bawaan Bulan Lalu)', periode.saldoAwal],
    ['  - Pemasukan Iuran Warga', breakdown.iuranWarga.total],
    ['  - Pemasukan Donasi', breakdown.donasi.total],
    ['  - Masukan Lainnya (Denda/Titipan/Lain)', breakdown.masukanLainnya.total],
    ['Total Pemasukan Bersih', periode.totalMasuk],
    ['Total Pengeluaran (Operasional)', periode.totalKeluar],
    ['Saldo Akhir Kas Berjalan', periode.saldoAkhir],
    ['', ''],
  ];

  const tableHeaders = ['No', 'Tanggal', 'Keterangan Transaksi', 'Kategori', 'Pemasukan (Rp)', 'Pengeluaran (Rp)'];
  const tableRows = transaksiList.map((item, idx) => [
    idx + 1,
    item.tanggal_transaksi,
    item.keterangan,
    item.kategori.replace(/_/g, ' ').toUpperCase(),
    item.jenis === 'masuk' ? item.nominal : 0,
    item.jenis === 'keluar' ? item.nominal : 0,
  ]);

  const worksheetData = [...summaryData, tableHeaders, ...tableRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 40 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Kas_${NAMA_BULAN[periode.bulan]}`);

  XLSX.writeFile(workbook, `Laporan_Kas_${namaRt.replace(/\s+/g, '_')}_${NAMA_BULAN[periode.bulan]}_${periode.tahun}.xlsx`);
}

export function exportKasToPDF(
  transaksiList: TransaksiItem[],
  periode: PeriodeInfo,
  namaRt: string = 'RT 03 / RW 14'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`RUKUN TETANGGA ${namaRt.toUpperCase()}`, 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`LAPORAN PERTANGGUNGJAWABAN BUKU KAS BULANAN`, 105, 24, { align: 'center' });
  doc.text(`Periode: ${NAMA_BULAN[periode.bulan]} ${periode.tahun}`, 105, 29, { align: 'center' });

  doc.setLineWidth(0.8);
  doc.line(14, 33, 196, 33);
  doc.setLineWidth(0.2);
  doc.line(14, 34, 196, 34);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 22, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Saldo Awal:', 20, 44);
  doc.text('Pemasukan (+):', 65, 44);
  doc.text('Pengeluaran (-):', 112, 44);
  doc.text('Saldo Akhir:', 155, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(periode.saldoAwal), 20, 52);
  doc.setTextColor(16, 185, 129);
  doc.text(formatRupiah(periode.totalMasuk), 65, 52);
  doc.setTextColor(239, 68, 68);
  doc.text(formatRupiah(periode.totalKeluar), 112, 52);
  doc.setTextColor(37, 99, 235);
  doc.text(formatRupiah(periode.saldoAkhir), 155, 52);

  const tableBody = transaksiList.map((item, idx) => [
    idx + 1,
    item.tanggal_transaksi,
    item.keterangan,
    item.kategori.replace(/_/g, ' ').toUpperCase(),
    item.jenis === 'masuk' ? formatRupiah(item.nominal) : '-',
    item.jenis === 'keluar' ? formatRupiah(item.nominal) : '-',
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['No', 'Tanggal', 'Keterangan', 'Kategori', 'Masuk', 'Keluar']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 70 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 120;
  const pageHeight = doc.internal.pageSize.height;

  if (finalY + 40 > pageHeight) {
    doc.addPage();
  }

  const signY = finalY + 40 > pageHeight ? 25 : finalY;
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`Ditetapkan pada: ${todayStr}`, 14, signY);

  doc.text('Mengetahui / Dibuat oleh,', 30, signY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text('Bendahara RT', 30, signY + 13);
  doc.line(30, signY + 34, 75, signY + 34);
  doc.setFont('helvetica', 'normal');
  doc.text('( .................................... )', 30, signY + 39);

  doc.text('Menyetujui,', 140, signY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text('Ketua RT', 140, signY + 13);
  doc.line(140, signY + 34, 185, signY + 34);
  doc.setFont('helvetica', 'normal');
  doc.text('( .................................... )', 140, signY + 39);

  doc.save(`Laporan_Kas_${namaRt.replace(/\s+/g, '_')}_${NAMA_BULAN[periode.bulan]}_${periode.tahun}.pdf`);
}
