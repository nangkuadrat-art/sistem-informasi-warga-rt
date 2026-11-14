'use server';

import { revalidatePath } from 'next/cache';
import {
  createKeluargaStore,
  updateKeluargaStore,
  deleteKeluargaStore,
  addAnggotaStore,
  updateAnggotaStore,
  deleteAnggotaStore,
  resetDbUnits,
} from '@/lib/data/store';
import { createClient } from '@/lib/supabase/server';

export type StatusRumah = 'pemilik' | 'kontrak' | 'kost' | 'kosong';
export type StatusKeaktifan = 'aktif' | 'pindah' | 'meninggal';

// ==========================================
// 1. CREATE KELUARGA (RUMAH TANGGA BARU)
// ==========================================
export async function createKeluarga(input: {
  nama_kepala_keluarga: string;
  blok_rumah: string;
  nomor_rumah: string;
  status_rumah: StatusRumah;
  no_hp?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: 'L' | 'P';
  alamat_lengkap?: string;
}) {
  try {
    const newUnit = createKeluargaStore({
      nama_kepala_keluarga: input.nama_kepala_keluarga,
      blok_rumah: input.blok_rumah,
      nomor_rumah: input.nomor_rumah,
      status_rumah: input.status_rumah,
      tanggal_lahir: input.tanggal_lahir,
      jenis_kelamin: input.jenis_kelamin,
      no_hp: input.no_hp,
      alamat_lengkap: input.alamat_lengkap,
    });

    // Supabase background sync (jika tersambung)
    try {
      const supabase = await createClient();
      await supabase.from('keluarga').insert({
        nama_kepala_keluarga: input.nama_kepala_keluarga,
        blok_rumah: input.blok_rumah.toUpperCase(),
        nomor_rumah: input.nomor_rumah,
        status_rumah: input.status_rumah,
        alamat_lengkap: newUnit.alamat_lengkap,
      });
    } catch {
      // Abaikan jika Supabase offline
    }

    revalidatePath('/admin/warga');
    return { success: true, data: newUnit };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menambahkan rumah tangga' };
  }
}

// ==========================================
// 2. UPDATE KELUARGA (EDIT RUMAH TANGGA)
// ==========================================
export async function updateKeluarga(
  id: string,
  input: {
    nama_kepala_keluarga: string;
    blok_rumah: string;
    nomor_rumah: string;
    status_rumah: StatusRumah;
    status_keluarga?: 'aktif' | 'nonaktif' | 'pindah';
    role_label?: string;
    alamat_lengkap?: string;
  }
) {
  try {
    const updated = updateKeluargaStore(id, input);
    if (!updated) {
      return { success: false, error: 'Data unit tidak ditemukan' };
    }

    // Supabase sync
    try {
      const supabase = await createClient();
      await supabase
        .from('keluarga')
        .update({
          nama_kepala_keluarga: input.nama_kepala_keluarga,
          blok_rumah: input.blok_rumah.toUpperCase(),
          nomor_rumah: input.nomor_rumah,
          status_rumah: input.status_rumah,
        })
        .eq('id', id);
    } catch {
      // Abaikan jika offline
    }

    revalidatePath('/admin/warga');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui data rumah tangga' };
  }
}

// ==========================================
// 3. DELETE KELUARGA (HAPUS RUMAH TANGGA)
// ==========================================
export async function deleteKeluarga(id: string) {
  try {
    const deleted = deleteKeluargaStore(id);
    if (!deleted) {
      return { success: false, error: 'Data unit tidak ditemukan' };
    }

    try {
      const supabase = await createClient();
      await supabase.from('keluarga').delete().eq('id', id);
    } catch {
      // Abaikan jika offline
    }

    revalidatePath('/admin/warga');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus unit' };
  }
}

// ==========================================
// 4. ADD ANGGOTA KELUARGA
// ==========================================
export async function addAnggotaKeluarga(formData: FormData) {
  try {
    const keluarga_id = formData.get('keluarga_id') as string;
    const nama_lengkap = formData.get('nama_lengkap') as string;
    const hubungan_keluarga = formData.get('hubungan_keluarga') as string;
    const jenis_kelamin = formData.get('jenis_kelamin') as 'L' | 'P';
    const tanggal_lahir = formData.get('tanggal_lahir') as string;
    const tempat_lahir = (formData.get('tempat_lahir') as string) || 'Cilacap';
    const status_pernikahan = (formData.get('status_pernikahan') as string) || 'Belum Menikah';
    const nomor_telepon = (formData.get('no_hp') as string) || '';

    const newMember = addAnggotaStore(keluarga_id, {
      nama_lengkap,
      hubungan_keluarga,
      jenis_kelamin,
      tanggal_lahir,
      tempat_lahir,
      status_pernikahan,
      nomor_telepon,
    });

    if (!newMember) {
      return { success: false, error: 'Keluarga tidak ditemukan' };
    }

    try {
      const supabase = await createClient();
      await supabase.from('warga').insert({
        keluarga_id,
        nama_lengkap,
        hubungan_keluarga,
        jenis_kelamin,
        tanggal_lahir,
        no_hp: nomor_telepon,
        status_warga: 'aktif',
      });
    } catch {
      // Abaikan jika offline
    }

    revalidatePath('/admin/warga');
    return { success: true, data: newMember };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menambahkan anggota keluarga' };
  }
}

// ==========================================
// 5. UPDATE ANGGOTA KELUARGA
// ==========================================
export async function updateAnggotaKeluarga(
  keluarga_id: string,
  anggota_id: string,
  input: {
    nama_lengkap: string;
    hubungan_keluarga: string;
    jenis_kelamin: 'L' | 'P';
    tanggal_lahir: string;
    tempat_lahir?: string;
    status_pernikahan?: string;
    nomor_telepon?: string;
    status_warga?: 'aktif' | 'pindah' | 'meninggal';
  }
) {
  try {
    const updated = updateAnggotaStore(keluarga_id, anggota_id, input);
    if (!updated) {
      return { success: false, error: 'Anggota keluarga tidak ditemukan' };
    }

    try {
      const supabase = await createClient();
      await supabase
        .from('warga')
        .update({
          nama_lengkap: input.nama_lengkap,
          hubungan_keluarga: input.hubungan_keluarga,
          jenis_kelamin: input.jenis_kelamin,
          tanggal_lahir: input.tanggal_lahir,
          no_hp: input.nomor_telepon,
          status_warga: input.status_warga || 'aktif',
        })
        .eq('id', anggota_id);
    } catch {
      // Abaikan jika offline
    }

    revalidatePath('/admin/warga');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memperbarui anggota keluarga' };
  }
}

// ==========================================
// 6. DELETE ANGGOTA KELUARGA
// ==========================================
export async function deleteAnggotaKeluarga(keluarga_id: string, anggota_id: string) {
  try {
    const deleted = deleteAnggotaStore(keluarga_id, anggota_id);
    if (!deleted) {
      return { success: false, error: 'Anggota keluarga tidak ditemukan' };
    }

    try {
      const supabase = await createClient();
      await supabase.from('warga').delete().eq('id', anggota_id);
    } catch {
      // Abaikan jika offline
    }

    revalidatePath('/admin/warga');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus anggota keluarga' };
  }
}

// ==========================================
// 7. UPDATE STATUS KEAKTIFAN WARGA
// ==========================================
export async function updateStatusWarga(
  keluarga_id: string,
  wargaId: string,
  status: StatusKeaktifan
) {
  try {
    const updated = updateAnggotaStore(keluarga_id, wargaId, { status_warga: status });
    if (!updated) {
      return { success: false, error: 'Warga tidak ditemukan' };
    }
    revalidatePath('/admin/warga');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengupdate status warga' };
  }
}

// ==========================================
// 8. RESET DATA KE MASTER GOOGLE SHEETS
// ==========================================
export async function resetToGoogleSheetsMaster() {
  try {
    resetDbUnits();
    revalidatePath('/admin/warga');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mereset data' };
  }
}
