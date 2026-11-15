'use server';

import { revalidatePath } from 'next/cache';
import {
  createUserStore,
  updateUserStore,
  toggleUserStatusStore,
  resetUserPasswordStore,
  deleteUserStore,
} from '@/lib/data/storeUsers';
import { UserRole, UserPermissions } from '@/lib/data/userPermissions';

export async function createUserAction(input: {
  nama: string;
  username: string;
  password?: string;
  no_hp?: string;
  role: UserRole;
  status?: 'aktif' | 'non_aktif';
  unit_id?: string | null;
  permissions?: UserPermissions;
}) {
  try {
    const data = createUserStore(input);
    revalidatePath('/admin/users');
    revalidatePath('/admin/warga');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menambah user' };
  }
}

export async function updateUserAction(
  id: string,
  input: {
    nama?: string;
    username?: string;
    password?: string;
    no_hp?: string;
    role?: UserRole;
    status?: 'aktif' | 'non_aktif';
    unit_id?: string | null;
    permissions?: UserPermissions;
  }
) {
  try {
    const data = updateUserStore(id, input);
    revalidatePath('/admin/users');
    revalidatePath('/admin/warga');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal memperbarui user' };
  }
}

export async function toggleUserStatusAction(id: string) {
  try {
    const data = toggleUserStatusStore(id);
    revalidatePath('/admin/users');
    revalidatePath('/admin/warga');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengubah status user' };
  }
}

export async function resetPasswordAction(id: string, newPassword = '12345') {
  try {
    const data = resetUserPasswordStore(id, newPassword);
    revalidatePath('/admin/users');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mereset password' };
  }
}

export async function deleteUserAction(id: string) {
  try {
    deleteUserStore(id);
    revalidatePath('/admin/users');
    revalidatePath('/admin/warga');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus user' };
  }
}
