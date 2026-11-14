'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function createJadwalKerjaBakti(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const judul = formData.get('judul') as string;
  const tanggal = formData.get('tanggal') as string;
  const jam_mulai = formData.get('jam_mulai') as string;
  const jam_selesai = formData.get('jam_selesai') as string;
  const lokasi = formData.get('lokasi') as string;

  const qr_token = 'KB-' + crypto.randomBytes(16).toString('hex');

  const { error } = await supabase.from('jadwal_kerja_bakti').insert({
    judul,
    tanggal,
    jam_mulai,
    jam_selesai,
    lokasi,
    qr_token,
    is_processed_denda: false,
  });

  if (error) {
    console.error('Gagal membuat jadwal kerja bakti:', error.message);
    return;
  }

  revalidatePath('/admin/kerja-bakti');
}

export async function submitPresensiKBByQR(qrToken: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Silakan login terlebih dahulu' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('keluarga_id, warga(id, nama_lengkap)')
    .eq('id', user.id)
    .single();

  if (!profile?.keluarga_id) {
    return { success: false, error: 'Akun belum ditautkan ke Kartu Keluarga!' };
  }

  const { data: kegiatan, error: kegErr } = await supabase
    .from('jadwal_kerja_bakti')
    .select('*')
    .eq('qr_token', qrToken)
    .single();

  if (kegErr || !kegiatan) {
    return { success: false, error: 'QR Code tidak valid!' };
  }

  const { data: existing } = await supabase
    .from('presensi_kerja_bakti')
    .select('id')
    .eq('jadwal_id', kegiatan.id)
    .eq('keluarga_id', profile.keluarga_id)
    .single();

  if (existing) {
    return { success: false, error: 'Keluarga Anda sudah tercatat hadir!' };
  }

  const wargaId = profile.warga?.[0]?.id || null;

  const { error: insertErr } = await supabase.from('presensi_kerja_bakti').insert({
    jadwal_id: kegiatan.id,
    keluarga_id: profile.keluarga_id,
    warga_id: wargaId,
    metode_presensi: 'QR_SCAN',
    status: 'hadir',
  });

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  return { success: true, judulKegiatan: kegiatan.judul };
}
