'use server';

import { revalidatePath } from 'next/cache';
import { createSurat, deleteSurat, generateNomorSurat, JenisSurat, updateSurat } from '@/lib/data/storeSurat';

export async function createSuratAction(formData: FormData) {
  const jenis = formData.get('jenis') as JenisSurat;
  const nomor_surat = (formData.get('nomor_surat') as string) || generateNomorSurat(jenis);
  const perihal = formData.get('perihal') as string;
  const tanggal_surat = formData.get('tanggal_surat') as string;
  const tujuan_nama = formData.get('tujuan_nama') as string;
  const tujuan_alamat = formData.get('tujuan_alamat') as string;

  // Undangan Fields
  const acara_hari_tanggal = formData.get('acara_hari_tanggal') as string;
  const acara_waktu = formData.get('acara_waktu') as string;
  const acara_tempat = formData.get('acara_tempat') as string;
  const agenda = formData.get('agenda') as string;
  const catatan_khusus = formData.get('catatan_khusus') as string;

  // Pengantar Fields (NO NIK, NO KK!)
  const pemohon_nama = formData.get('pemohon_nama') as string;
  const pemohon_tempat_lahir = formData.get('pemohon_tempat_lahir') as string;
  const pemohon_tanggal_lahir = formData.get('pemohon_tanggal_lahir') as string;
  const pemohon_usia = formData.get('pemohon_usia') as string;
  const pemohon_kategori_usia = formData.get('pemohon_kategori_usia') as string;
  const pemohon_jenis_kelamin = (formData.get('pemohon_jenis_kelamin') as 'L' | 'P') || 'L';
  const pemohon_agama = formData.get('pemohon_agama') as string;
  const pemohon_pekerjaan = formData.get('pemohon_pekerjaan') as string;
  const pemohon_alamat = formData.get('pemohon_alamat') as string;
  const keperluan_surat = formData.get('keperluan_surat') as string;
  const keterangan_tambahan = formData.get('keterangan_tambahan') as string;
  const berlaku_hingga = formData.get('berlaku_hingga') as string;

  // Peringatan Fields
  const peringatan_tingkat = (formData.get('peringatan_tingkat') as 'Teguran' | 'SP 1' | 'SP 2' | 'SP 3') || 'SP 1';
  const peringatan_pelanggaran = formData.get('peringatan_pelanggaran') as string;
  const peringatan_uraian = formData.get('peringatan_uraian') as string;
  const peringatan_tenggat = formData.get('peringatan_tenggat') as string;
  const peringatan_sanksi = formData.get('peringatan_sanksi') as string;

  // Penandatangan
  const penandatangan_nama = (formData.get('penandatangan_nama') as string) || 'Yuli Ardinurman';
  const penandatangan_jabatan = (formData.get('penandatangan_jabatan') as string) || 'Ketua RT.03 / RW.14';
  const penandatangan_kedua_nama = formData.get('penandatangan_kedua_nama') as string;
  const penandatangan_kedua_jabatan = formData.get('penandatangan_kedua_jabatan') as string;

  createSurat({
    nomor_surat,
    jenis,
    perihal,
    lampiran: '-',
    tanggal_surat: tanggal_surat || new Date().toISOString().split('T')[0],
    tujuan_nama,
    tujuan_alamat,
    acara_hari_tanggal,
    acara_waktu,
    acara_tempat,
    agenda,
    catatan_khusus,
    pemohon_nama,
    pemohon_tempat_lahir,
    pemohon_tanggal_lahir,
    pemohon_usia,
    pemohon_kategori_usia,
    pemohon_jenis_kelamin,
    pemohon_agama,
    pemohon_pekerjaan,
    pemohon_alamat,
    keperluan_surat,
    keterangan_tambahan,
    berlaku_hingga,
    peringatan_tingkat,
    peringatan_pelanggaran,
    peringatan_uraian,
    peringatan_tenggat,
    peringatan_sanksi,
    penandatangan_nama,
    penandatangan_jabatan,
    penandatangan_kedua_nama,
    penandatangan_kedua_jabatan,
  });

  revalidatePath('/admin/surat');
  return { success: true };
}

export async function deleteSuratAction(id: string) {
  deleteSurat(id);
  revalidatePath('/admin/surat');
  return { success: true };
}
