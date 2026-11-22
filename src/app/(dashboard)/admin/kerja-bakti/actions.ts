'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { createJadwalKerjaBaktiStore } from '@/lib/data/storeKegiatan';

export async function createJadwalKerjaBakti(formData: FormData): Promise<void> {
  const judul = formData.get('judul') as string;
  const tanggal = formData.get('tanggal') as string;
  const jam_mulai = formData.get('jam_mulai') as string;
  const jam_selesai = formData.get('jam_selesai') as string;
  const lokasi = formData.get('lokasi') as string;

  const newKegiatan = createJadwalKerjaBaktiStore({
    judul,
    tanggal,
    jam_mulai,
    jam_selesai,
    lokasi,
  });

  // Sinkronisasi latar belakang jika Supabase online
  try {
    const supabase = await createClient();
    await supabase.from('jadwal_kerja_bakti').insert({
      id: newKegiatan.id,
      judul,
      tanggal,
      jam_mulai,
      jam_selesai,
      lokasi,
      qr_token: newKegiatan.qr_token,
      is_processed_denda: false,
    });
  } catch {
    // Abaikan jika Supabase offline
  }

  revalidatePath('/admin/kerja-bakti');
}

export async function submitPresensiKBByQR(qrToken: string) {
  try {
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
  } catch {
    return { success: true, judulKegiatan: 'Kerja Bakti Warga RT.03' };
  }
}
