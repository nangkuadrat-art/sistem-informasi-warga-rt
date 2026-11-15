'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentSession } from '@/lib/auth/serverSession';
import {
  DepositUsageType,
  submitDepositUsageStore,
} from '@/lib/data/storeDeposit';

export async function submitDepositUsageAction(formData: FormData) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { success: false, error: 'Sesi login tidak valid. Silakan login ulang.' };
    }

    const periodeId = String(formData.get('periode_id') || 'periode-okt-2026');
    const requestedUnit = Number(formData.get('no_unit') || 0);
    const isPengurus = session.kategori === 'pengurus';

    // Keamanan: warga hanya bisa memakai deposit unit miliknya sendiri
    const targetUnit = isPengurus && requestedUnit > 0 ? requestedUnit : Number(session.no_unit || 0);
    if (!targetUnit) {
      return { success: false, error: 'Unit warga tidak valid.' };
    }
    if (!isPengurus && requestedUnit > 0 && requestedUnit !== Number(session.no_unit)) {
      return { success: false, error: 'Anda tidak berhak menggunakan deposit unit lain.' };
    }

    const jenis = String(formData.get('jenis') || '') as DepositUsageType;
    if (!['bayar_iuran', 'donasi', 'tarik_tunai'].includes(jenis)) {
      return { success: false, error: 'Pilihan penggunaan deposit tidak valid.' };
    }

    const nominal = Number(formData.get('nominal') || 0);
    const catatan = String(formData.get('catatan') || '').trim();
    const metodePencairan =
      String(formData.get('metode_pencairan') || 'TUNAI') === 'TRANSFER'
        ? 'TRANSFER'
        : 'TUNAI';
    const infoRekening = String(formData.get('info_rekening') || '').trim();

    if (jenis === 'tarik_tunai' && metodePencairan === 'TRANSFER' && !infoRekening) {
      return {
        success: false,
        error: 'Mohon isi nomor rekening / e-wallet tujuan untuk metode Transfer.',
      };
    }

    const res = submitDepositUsageStore({
      periodeId,
      noUnit: targetUnit,
      usernamePemohon: session.username,
      jenis,
      nominal,
      catatan,
      metodePencairan,
      infoRekening,
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Gagal memproses penggunaan deposit.' };
    }

    revalidatePath('/warga/dashboard');
    revalidatePath('/admin/kas');
    revalidatePath('/admin/closing');
    return { success: true, message: res.message, record: res.record };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan saat memproses penggunaan deposit.',
    };
  }
}
