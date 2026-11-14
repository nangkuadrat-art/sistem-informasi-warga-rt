'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  addTransaksiKasPeriod,
  updateTransaksiKasPeriod,
  deleteTransaksiKasPeriod,
  recordBayarTagihanStore,
} from '@/lib/data/storeKas';

export async function createTransaksiKas(formData: FormData) {
  try {
    const periode_id = (formData.get('periode_id') as string) || 'periode-okt-2026';
    const kategori = (formData.get('kategori') as string) || 'operasional';
    const jenis = (formData.get('jenis') as 'masuk' | 'keluar') || 'keluar';
    const nominal = parseFloat(formData.get('nominal') as string) || 0;
    const keterangan = formData.get('keterangan') as string;
    const tanggal_transaksi =
      (formData.get('tanggal_transaksi') as string) || new Date().toISOString().split('T')[0];

    // Simpan ke local store persisten periode
    addTransaksiKasPeriod(periode_id, {
      tanggal_transaksi,
      keterangan,
      jenis,
      kategori,
      nominal,
    });

    // Supabase sync (jika aktif)
    try {
      const supabase = await createClient();
      await supabase.from('transaksi_kas').insert({
        periode_id: periode_id === 'default' ? null : periode_id,
        kategori,
        jenis,
        nominal,
        keterangan,
        tanggal_transaksi,
      });
    } catch {
      // Abaikan jika Supabase offline
    }

    revalidatePath('/admin/kas');
    revalidatePath('/admin/closing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan transaksi' };
  }
}

export async function updateTransaksiKas(formData: FormData) {
  try {
    const periode_id = formData.get('periode_id') as string;
    const tx_id = formData.get('tx_id') as string;
    const kategori = formData.get('kategori') as string;
    const jenis = formData.get('jenis') as 'masuk' | 'keluar';
    const nominal = parseFloat(formData.get('nominal') as string) || 0;
    const keterangan = formData.get('keterangan') as string;
    const tanggal_transaksi = formData.get('tanggal_transaksi') as string;

    const updated = updateTransaksiKasPeriod(periode_id, tx_id, {
      kategori,
      jenis,
      nominal,
      keterangan,
      tanggal_transaksi,
    });

    if (!updated) {
      return { success: false, error: 'Transaksi tidak ditemukan' };
    }

    revalidatePath('/admin/kas');
    revalidatePath('/admin/closing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui transaksi' };
  }
}

export async function deleteTransaksiKas(periodeId: string, txId: string) {
  try {
    const deleted = deleteTransaksiKasPeriod(periodeId, txId);
    if (!deleted) {
      return { success: false, error: 'Transaksi tidak ditemukan' };
    }

    revalidatePath('/admin/kas');
    revalidatePath('/admin/closing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus transaksi' };
  }
}

export async function bayarIuranWarga(
  periodeId: string,
  tagihanId: string,
  nominalBayar: number,
  metode: string = 'TUNAI',
  autoAddKas: boolean = true
) {
  try {
    // 1. Update ke local store JSON
    recordBayarTagihanStore(periodeId, tagihanId, nominalBayar, metode, autoAddKas);

    // 2. Supabase sync (jika tersambung)
    try {
      const supabase = await createClient();
      const { data: tagihan } = await supabase
        .from('tagihan_bulanan')
        .select('*, keluarga(nama_kepala_keluarga, blok_rumah, nomor_rumah)')
        .eq('id', tagihanId)
        .single();

      if (tagihan) {
        const terbayarBaru = Number(tagihan.total_terbayar) + nominalBayar;
        const totalTagihan = Number(tagihan.total_tagihan);
        const statusBaru =
          terbayarBaru >= totalTagihan ? 'lunas' : terbayarBaru > 0 ? 'sebagian' : 'belum_bayar';

        await supabase
          .from('tagihan_bulanan')
          .update({
            total_terbayar: terbayarBaru,
            status_bayar: statusBaru,
            tanggal_bayar: new Date().toISOString(),
            metode_bayar: metode,
          })
          .eq('id', tagihanId);

        if (autoAddKas) {
          await supabase.from('transaksi_kas').insert({
            periode_id: tagihan.periode_id,
            kategori: 'iuran_warga',
            jenis: 'masuk',
            nominal: nominalBayar,
            keterangan: `Iuran Bulanan ${tagihan.keluarga?.nama_kepala_keluarga} (Blok ${tagihan.keluarga?.blok_rumah}/${tagihan.keluarga?.nomor_rumah})`,
          });
        }
      }
    } catch {
      // Abaikan jika Supabase offline
    }

    revalidatePath('/admin/kas');
    revalidatePath('/admin/closing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses pembayaran' };
  }
}
