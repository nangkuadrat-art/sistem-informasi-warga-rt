'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  executeClosingStore,
  reopenClosingStore,
  updateTagihanUnitStore,
  recordBayarTagihanStore,
  resetTagihanUnitStore,
} from '@/lib/data/storeKas';

export async function submitClosingBulanan(periodeId: string, customCatatan?: string) {
  try {
    // 1. Jalankan closing di local store persisten
    const closingRes = executeClosingStore(periodeId, customCatatan);

    // 2. Supabase sync (hanya jika tersambung dengan URL aktif yang valid)
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (sbUrl && !sbUrl.includes('drpxmocsoieksbcismyk') && !sbUrl.includes('your-project')) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.rpc('execute_closing_bulanan', {
          p_periode_id: periodeId,
          p_admin_id: user?.id || null,
        });
      } catch {
        // Abaikan jika Supabase offline
      }
    }

    revalidatePath('/admin/closing');
    revalidatePath('/admin/kas');
    return { success: true, nextPeriodId: closingRes.nextPeriodId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal melaksanakan closing bulanan' };
  }
}

export async function reopenClosingBulanan(periodeId: string) {
  try {
    reopenClosingStore(periodeId);
    revalidatePath('/admin/closing');
    revalidatePath('/admin/kas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuka kembali buku kas' };
  }
}

export async function updateTagihanWargaAction(
  periodeId: string,
  tagihanId: string,
  formData: FormData
) {
  try {
    const iuran_pokok = parseFloat(formData.get('iuran_pokok') as string) || 0;
    const denda_ronda = parseFloat(formData.get('denda_ronda') as string) || 0;
    const denda_kerja_bakti = parseFloat(formData.get('denda_kerja_bakti') as string) || 0;
    const tunggakan_bulan_lalu = parseFloat(formData.get('tunggakan_bulan_lalu') as string) || 0;
    const titipan_bulan_lalu = parseFloat(formData.get('titipan_bulan_lalu') as string) || 0;
    const donatur = parseFloat(formData.get('donatur') as string) || 0;
    const titipan_depan = parseFloat(formData.get('titipan_depan') as string) || 0;
    const total_terbayar = parseFloat(formData.get('total_terbayar') as string) || 0;
    const keterangan = (formData.get('keterangan') as string) || '';

    const updated = updateTagihanUnitStore(periodeId, tagihanId, {
      iuran_pokok,
      denda_ronda,
      denda_kerja_bakti,
      tunggakan_bulan_lalu,
      titipan_bulan_lalu,
      donatur,
      titipan_depan,
      total_terbayar,
      keterangan,
    });

    if (!updated) {
      return { success: false, error: 'Data tagihan unit tidak ditemukan' };
    }

    revalidatePath('/admin/closing');
    revalidatePath('/admin/kas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui rincian tagihan' };
  }
}

export async function bayarTagihanAction(
  periodeId: string,
  tagihanId: string,
  formData: FormData
) {
  try {
    const nominalBayar = parseFloat(formData.get('nominal_bayar') as string) || 0;
    const metode = (formData.get('metode_bayar') as string) || 'TUNAI';
    const autoKas = formData.get('auto_kas') === 'on' || formData.get('auto_kas') === 'true';

    const res = recordBayarTagihanStore(periodeId, tagihanId, nominalBayar, metode, autoKas);
    if (!res.success) {
      return { success: false, error: 'Gagal mencatat pembayaran' };
    }

    revalidatePath('/admin/closing');
    revalidatePath('/admin/kas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses pembayaran tagihan' };
  }
}

export async function resetTagihanUnitAction(periodeId: string, tagihanId: string) {
  try {
    const ok = resetTagihanUnitStore(periodeId, tagihanId);
    if (!ok) return { success: false, error: 'Tagihan tidak ditemukan' };

    revalidatePath('/admin/closing');
    revalidatePath('/admin/kas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mereset pembayaran tagihan' };
  }
}
