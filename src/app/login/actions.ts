'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAllUsers } from '@/lib/data/storeUsers';
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  signSessionToken,
  getDefaultHomeForSession,
  canAccessAdminPath,
} from '@/lib/auth/session';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const usernameInput = String(formData.get('username') || '')
    .trim()
    .toLowerCase();
  const passwordInput = String(formData.get('password') || '').trim();
  const rememberMe = formData.get('remember') === 'true';
  const nextPath = String(formData.get('next') || '').trim();

  if (!usernameInput || !passwordInput) {
    return {
      success: false,
      error: 'Username dan password wajib diisi.',
    };
  }

  const users = getAllUsers();
  const matched = users.find(
    (u) => u.username.trim().toLowerCase() === usernameInput
  );

  if (!matched) {
    return {
      success: false,
      error: 'Username tidak ditemukan. Periksa kembali penulisan akun Anda.',
    };
  }

  if (matched.status === 'non_aktif' || matched.role === 'non_aktif') {
    return {
      success: false,
      error:
        'Akun ini berstatus Non-Aktif atau unit rumah kosong. Hubungi Pengurus RT untuk aktivasi.',
    };
  }

  if (matched.password !== passwordInput) {
    return {
      success: false,
      error: 'Password yang Anda masukkan salah.',
    };
  }

  const ttlMs = (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = {
    id: matched.id,
    unit_id: matched.unit_id ?? null,
    no_unit: matched.no_unit ?? null,
    alamat: matched.alamat || '-',
    nama: matched.nama,
    username: matched.username,
    role: matched.role,
    role_label: matched.role_label,
    kategori: matched.kategori,
    permissions: matched.permissions,
    exp: Date.now() + ttlMs,
  };

  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(ttlMs / 1000),
  });

  let target = getDefaultHomeForSession(payload);
  if (
    nextPath &&
    nextPath.startsWith('/') &&
    !nextPath.startsWith('//') &&
    !nextPath.startsWith('/login')
  ) {
    if (nextPath.startsWith('/admin') && canAccessAdminPath(payload, nextPath)) {
      target = nextPath;
    } else if (nextPath.startsWith('/warga') && payload.permissions?.portal_warga) {
      target = nextPath;
    }
  }

  return {
    success: true,
    redirectTo: target,
  };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
