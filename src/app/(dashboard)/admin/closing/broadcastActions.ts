'use server';

import { createClient } from '@/lib/supabase/server';
import { sendWhatsappMessage } from '@/lib/services/fonnte';
import { formatRupiah, NAMA_BULAN } from '@/lib/utils/currency';

export async function broadcastAllTagihanWA(periodeId: string) {
  const supabase = await createClient();

  const { data: periode } = await supabase
    .from('periode_buku')
    .select('bulan, tahun')
    .eq('id', periodeId)
    .single();

  if (!periode) return { success: false, error: 'Periode tidak ditemukan' };

  const namaBulanTahun = `${NAMA_BULAN[periode.bulan]} ${periode.tahun}`;

  const { data: listTagihan } = await supabase
    .from('tagihan_bulanan')
    .select('*, keluarga(*, warga(no_hp, hubungan_keluarga))')
    .eq('periode_id', periodeId)
    .neq('status_bayar', 'lunas');

  if (!listTagihan || listTagihan.length === 0) {
    return { success: false, error: 'Tidak ada tagihan yang perlu dibroadcast.' };
  }

  let totalTerkirim = 0;

  for (const t of listTagihan) {
    const kepala = t.keluarga?.warga?.find((w: any) => w.hubungan_keluarga === 'Kepala Keluarga');
    const noHp = kepala?.no_hp;

    if (noHp && noHp !== '-') {
      const pesan = `*PEMBERITAHUAN IURAN RT.03 RW.14*
Yth. Bpk/Ibu *${t.keluarga.nama_kepala_keluarga}* (Blok ${t.keluarga.blok_rumah}/${t.keluarga.nomor_rumah})

Rincian tagihan iuran periode *${namaBulanTahun}*:
• Iuran Pokok: ${formatRupiah(t.iuran_pokok)}
• Tunggakan Lalu: ${formatRupiah(t.tunggakan_bulan_lalu)}
• Denda: ${formatRupiah(t.total_denda)}
*TOTAL TAGIHAN: ${formatRupiah(t.total_tagihan)}*

Terima kasih atas partisipasinya.`;

      await sendWhatsappMessage(noHp, pesan);
      totalTerkirim++;
    }
  }

  return { success: true, totalTerkirim };
}
