import { UserPermissions, UserRole } from '@/lib/data/userPermissions';

export const SESSION_COOKIE_NAME = 'rt03_session';

export interface SessionPayload {
  id: string;
  unit_id?: string | null;
  no_unit?: number | null;
  alamat?: string;
  nama: string;
  username: string;
  role: UserRole;
  role_label: string;
  kategori: 'pengurus' | 'warga';
  permissions: UserPermissions;
  exp: number;
}

const SECRET_KEY =
  process.env.AUTH_SECRET || 'rt03-rw14-bptw-tritih-lor-session-secret-2026';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const enc = new TextEncoder();
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await getHmacKey('sign');
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const sig = toBase64Url(new Uint8Array(sigBuffer));
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, sig] = parts;
  if (!body || !sig) return null;

  try {
    const enc = new TextEncoder();
    const key = await getHmacKey('verify');
    const sigBytes = fromBase64Url(sig);
    const sigArrayBuffer = new ArrayBuffer(sigBytes.byteLength);
    new Uint8Array(sigArrayBuffer).set(sigBytes);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigArrayBuffer,
      enc.encode(body)
    );
    if (!valid) return null;

    const dec = new TextDecoder();
    const json = dec.decode(fromBase64Url(body));
    const parsed = JSON.parse(json) as SessionPayload;

    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getDefaultHomeForSession(session: SessionPayload): string {
  const p = session.permissions;
  if (p?.warga_view) return '/admin/warga';
  if (p?.kas_view) return '/admin/kas';
  if (p?.closing_manage) return '/admin/closing';
  if (p?.surat_manage) return '/admin/surat';
  if (p?.ronda_manage) return '/admin/ronda';
  if (p?.kerja_bakti_manage) return '/admin/kerja-bakti';
  if (p?.users_manage) return '/admin/users';
  return '/warga/dashboard';
}

export function canAccessAdminPath(
  session: SessionPayload,
  pathname: string
): boolean {
  const p = session.permissions;
  if (!p) return false;
  if (pathname.startsWith('/admin/warga')) return !!p.warga_view || !!p.warga_manage;
  if (pathname.startsWith('/admin/kas')) return !!p.kas_view || !!p.kas_manage;
  if (pathname.startsWith('/admin/closing')) return !!p.closing_manage;
  if (pathname.startsWith('/admin/surat')) return !!p.surat_manage;
  if (pathname.startsWith('/admin/ronda')) return !!p.ronda_manage;
  if (pathname.startsWith('/admin/kerja-bakti')) return !!p.kerja_bakti_manage;
  if (pathname.startsWith('/admin/users')) return !!p.users_manage;
  return session.kategori === 'pengurus';
}
