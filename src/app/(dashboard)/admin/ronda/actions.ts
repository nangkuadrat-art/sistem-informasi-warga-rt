'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createJadwalRondaStore, prosesAutoDendaRondaStore } from '@/lib/data/storeKegiatan';

export async function createJadwalRonda(formData: FormData): Promise<void> {
  const tanggal = formData.get('tanggal') as string;
  const jam_mulai = formData.get('jam_mulai') as string;
  const jam_selesai = formData.get('jam_selesai') as string;
  const catatan = (formData.get('catatan') as string) || '';
  const wargaIds = (formData.getAll('warga_ids') as string[]) || [];

  createJadwalRondaStore({
    tanggal,
    jam_mulai,
    jam_selesai,
    catatan,
    warga_ids: wargaIds,
  });

  // Sinkronisasi latar belakang jika Supabase online
  try {
    const supabase = await createClient();
    const { data: jadwal } = await supabase
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

    if (jadwal && wargaIds.length > 0) {
      const pesertaRows = wargaIds.map((wId) => ({
        jadwal_id: jadwal.id,
        warga_id: wId,
      }));
      await supabase.from('peserta_ronda').insert(pesertaRows);
    }
  } catch {
    // Abaikan jika Supabase offline
  }

  revalidatePath('/admin/ronda');
}

export async function prosesAutoDendaRonda(jadwalId: string) {
  const res = prosesAutoDendaRondaStore(jadwalId);

  try {
    const supabase = await createClient();
    await supabase
      .from('jadwal_ronda')
      .update({ is_processed_denda: true })
      .eq('id', jadwalId);
  } catch {
    // Abaikan jika Supabase offline
  }

  revalidatePath('/admin/ronda');
  revalidatePath('/admin/closing');
  return res;
}
