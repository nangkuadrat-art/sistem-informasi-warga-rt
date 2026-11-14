'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createJadwalRonda(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const tanggal = formData.get('tanggal') as string;
  const jam_mulai = formData.get('jam_mulai') as string;
  const jam_selesai = formData.get('jam_selesai') as string;
  const catatan = formData.get('catatan') as string;
  const wargaIds = formData.getAll('warga_ids') as string[];

  const { data: jadwal, error: jadwalErr } = await supabase
    .from('jadwal_ronda')
    .insert({
      tanggal,
      jam_mulai,
      jam_selesai,
      catatan,
      is_processed_denda: false,
    })
    .select('id')
    .single();

  if (jadwalErr || !jadwal) {
    console.error('Gagal membuat jadwal ronda:', jadwalErr?.message);
    return;
  }

  if (wargaIds.length > 0) {
    const pesertaRows = wargaIds.map((wId) => ({
      jadwal_id: jadwal.id,
      warga_id: wId,
    }));
    await supabase.from('peserta_ronda').insert(pesertaRows);
  }

  revalidatePath('/admin/ronda');
}

export async function prosesAutoDendaRonda(jadwalId: string) {
  const supabase = await createClient();

  const { data: jadwal } = await supabase
    .from('jadwal_ronda')
    .select('*')
    .eq('id', jadwalId)
    .single();

  if (!jadwal || jadwal.is_processed_denda) {
    return { success: false, error: 'Jadwal tidak ditemukan atau denda sudah diproses.' };
  }

  const { data: pengaturan } = await supabase
    .from('pengaturan_rt')
    .select('nominal_denda_ronda')
    .limit(1)
    .single();

  const nominalDenda = pengaturan?.nominal_denda_ronda || 20000.0;

  const { data: listPeserta } = await supabase
    .from('peserta_ronda')
    .select('warga_id, warga(nama_lengkap, keluarga_id)')
    .eq('jadwal_id', jadwalId);

  const { data: listPresensi } = await supabase
    .from('presensi_ronda')
    .select('warga_id, status')
    .eq('jadwal_id', jadwalId);

  const hadirOrIzinWargaIds = new Set(
    listPresensi?.filter((p) => p.status === 'hadir' || p.status === 'izin').map((p) => p.warga_id)
  );

  const dendaRowsToInsert: any[] = [];

  listPeserta?.forEach((peserta: any) => {
    if (!hadirOrIzinWargaIds.has(peserta.warga_id)) {
      dendaRowsToInsert.push({
        keluarga_id: peserta.warga?.keluarga_id,
        warga_id: peserta.warga_id,
        sumber_denda: 'ronda',
        referensi_id: jadwalId,
        nominal: nominalDenda,
        keterangan: `Denda Alfa Ronda Malam (${jadwal.tanggal}) - ${peserta.warga?.nama_lengkap}`,
        sudah_masuk_tagihan: false,
      });
    }
  });

  if (dendaRowsToInsert.length > 0) {
    await supabase.from('log_denda').insert(dendaRowsToInsert);
  }

  await supabase
    .from('jadwal_ronda')
    .update({ is_processed_denda: true })
    .eq('id', jadwalId);

  revalidatePath('/admin/ronda');
  revalidatePath('/admin/closing');
  return { success: true, totalAlfa: dendaRowsToInsert.length };
}
