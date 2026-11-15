import fs from 'fs';
import { getDbFilePath, getDefaultJson } from './dbPathHelper';
import { getDbUnits, saveDbUnits } from './store';
import {
  UserAccount,
  UserRole,
  UserPermissions,
  ROLE_METADATA,
  isPengurusRole,
  getDefaultPermissionsForRole,
} from './userPermissions';

const DB_USERS_PATH = getDbFilePath('db_users.json');

export function getAllUsers(): UserAccount[] {
  try {
    if (fs.existsSync(DB_USERS_PATH)) {
      const data = fs.readFileSync(DB_USERS_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading db_users.json:', e);
  }
  return (getDefaultJson('db_users.json') as UserAccount[]) || [];
}

export function saveAllUsers(users: UserAccount[]): void {
  try {
    fs.writeFileSync(DB_USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db_users.json:', e);
  }
}

function syncUserToWargaUnit(user: UserAccount): void {
  if (!user.unit_id) return;
  try {
    const units = getDbUnits();
    const unit = units.find((u) => u.id === user.unit_id);
    if (unit) {
      unit.role = user.role;
      unit.role_label = user.role_label;
      unit.username = user.status === 'aktif' ? user.username : null;
      if (user.status === 'non_aktif' && unit.status_rumah === 'kosong') {
        unit.status_keluarga = 'nonaktif';
      } else if (user.status === 'aktif') {
        unit.status_keluarga = 'aktif';
      }
      saveDbUnits(units);
    }
  } catch (e) {
    console.error('Failed syncing user update to db_warga:', e);
  }
}

export function createUserStore(input: {
  nama: string;
  username: string;
  password?: string;
  no_hp?: string;
  role: UserRole;
  status?: 'aktif' | 'non_aktif';
  unit_id?: string | null;
  permissions?: UserPermissions;
}): UserAccount {
  const users = getAllUsers();
  const cleanUsername = input.username.trim().toLowerCase().replace(/\s+/g, '');

  if (!cleanUsername) {
    throw new Error('Username wajib diisi');
  }

  const duplicate = users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (duplicate) {
    throw new Error(`Username "${cleanUsername}" sudah digunakan oleh ${duplicate.nama}`);
  }

  let no_unit: number | null = null;
  let alamat = '-';
  if (input.unit_id) {
    const units = getDbUnits();
    const matchedUnit = units.find((u) => u.id === input.unit_id);
    if (matchedUnit) {
      no_unit = matchedUnit.no_unit;
      alamat = matchedUnit.alamat;
    }
  }

  const meta = ROLE_METADATA[input.role] || ROLE_METADATA.warga;
  const status = input.status || (input.role === 'non_aktif' ? 'non_aktif' : 'aktif');

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    unit_id: input.unit_id || null,
    no_unit,
    alamat,
    nama: input.nama.trim(),
    username: cleanUsername,
    password: input.password?.trim() || '12345',
    no_hp: input.no_hp?.trim() || '',
    role: input.role,
    role_label: meta.label,
    kategori: isPengurusRole(input.role) ? 'pengurus' : 'warga',
    status,
    permissions: input.permissions ? { ...input.permissions } : getDefaultPermissionsForRole(input.role),
    created_at: new Date().toISOString(),
  };

  users.unshift(newUser);
  saveAllUsers(users);
  syncUserToWargaUnit(newUser);
  return newUser;
}

export function updateUserStore(
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
): UserAccount {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    throw new Error('Akun user tidak ditemukan');
  }

  const existing = users[idx];

  if (input.username !== undefined) {
    const cleanUsername = input.username.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      throw new Error('Username tidak boleh kosong');
    }
    const duplicate = users.find(
      (u) => u.id !== id && u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      throw new Error(`Username "${cleanUsername}" sudah digunakan oleh ${duplicate.nama}`);
    }
    existing.username = cleanUsername;
  }

  if (input.nama !== undefined) {
    existing.nama = input.nama.trim();
  }

  if (input.password !== undefined && input.password.trim() !== '') {
    existing.password = input.password.trim();
  }

  if (input.no_hp !== undefined) {
    existing.no_hp = input.no_hp.trim();
  }

  if (input.unit_id !== undefined) {
    existing.unit_id = input.unit_id || null;
    if (input.unit_id) {
      const units = getDbUnits();
      const matchedUnit = units.find((u) => u.id === input.unit_id);
      if (matchedUnit) {
        existing.no_unit = matchedUnit.no_unit;
        existing.alamat = matchedUnit.alamat;
      }
    } else {
      existing.no_unit = null;
      existing.alamat = 'Pengurus / Eksternal';
    }
  }

  if (input.role !== undefined) {
    const meta = ROLE_METADATA[input.role] || ROLE_METADATA.warga;
    existing.role = input.role;
    existing.role_label = meta.label;
    existing.kategori = isPengurusRole(input.role) ? 'pengurus' : 'warga';
  }

  if (input.status !== undefined) {
    existing.status = input.status;
  }

  if (input.permissions !== undefined) {
    existing.permissions = { ...input.permissions };
  }

  existing.updated_at = new Date().toISOString();
  users[idx] = existing;
  saveAllUsers(users);
  syncUserToWargaUnit(existing);

  return existing;
}

export function toggleUserStatusStore(id: string): UserAccount {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    throw new Error('Akun user tidak ditemukan');
  }

  const user = users[idx];
  const nextStatus = user.status === 'aktif' ? 'non_aktif' : 'aktif';
  user.status = nextStatus;

  if (nextStatus === 'aktif') {
    if (user.role === 'non_aktif') {
      user.role = 'warga';
      user.role_label = ROLE_METADATA.warga.label;
      user.kategori = 'warga';
    }
    const anyEnabled = Object.values(user.permissions).some(Boolean);
    if (!anyEnabled) {
      user.permissions = getDefaultPermissionsForRole(user.role);
    }
    if (user.password === '-' || !user.password) {
      user.password = '12345';
    }
  } else {
    // Nonaktifkan akses login portal/admin tanpa menghilangkan role historis kecuali memang non_aktif
    Object.keys(user.permissions).forEach((k) => {
      user.permissions[k as keyof UserPermissions] = false;
    });
  }

  user.updated_at = new Date().toISOString();
  users[idx] = user;
  saveAllUsers(users);
  syncUserToWargaUnit(user);

  return user;
}

export function resetUserPasswordStore(id: string, newPassword = '12345'): UserAccount {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    throw new Error('Akun user tidak ditemukan');
  }

  users[idx].password = newPassword;
  users[idx].updated_at = new Date().toISOString();
  saveAllUsers(users);
  return users[idx];
}

export function deleteUserStore(id: string): void {
  const users = getAllUsers();
  const target = users.find((u) => u.id === id);
  const filtered = users.filter((u) => u.id !== id);
  saveAllUsers(filtered);

  if (target?.unit_id) {
    try {
      const units = getDbUnits();
      const unit = units.find((u) => u.id === target.unit_id);
      if (unit) {
        unit.username = null;
        unit.role = 'non_aktif';
        unit.role_label = 'Non-Aktif';
        saveDbUnits(units);
      }
    } catch (e) {
      console.error('Failed clearing deleted user unit ref:', e);
    }
  }
}
