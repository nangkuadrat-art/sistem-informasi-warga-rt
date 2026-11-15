export type UserRole =
  | 'superadmin'
  | 'ketua_rt'
  | 'bendahara'
  | 'sekretaris'
  | 'keamanan'
  | 'warga'
  | 'non_aktif';

export type PermissionKey =
  | 'warga_view'
  | 'warga_manage'
  | 'kas_view'
  | 'kas_manage'
  | 'closing_manage'
  | 'surat_manage'
  | 'ronda_manage'
  | 'kerja_bakti_manage'
  | 'users_manage'
  | 'portal_warga';

export type UserPermissions = Record<PermissionKey, boolean>;

export interface UserAccount {
  id: string;
  unit_id?: string | null;
  no_unit?: number | null;
  alamat?: string;
  nama: string;
  username: string;
  password: string;
  no_hp?: string;
  role: UserRole;
  role_label: string;
  kategori: 'pengurus' | 'warga';
  status: 'aktif' | 'non_aktif';
  permissions: UserPermissions;
  created_at: string;
  updated_at?: string;
}

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  description: string;
  modul: string;
}

export const PERMISSION_DEFINITIONS: PermissionDef[] = [
  {
    key: 'warga_view',
    label: 'Lihat Data Warga',
    description: 'Melihat direktori 56 unit rumah & daftar anggota keluarga',
    modul: 'Kependudukan',
  },
  {
    key: 'warga_manage',
    label: 'Kelola Data Warga (CRUD)',
    description: 'Tambah, ubah, hapus unit rumah dan anggota keluarga',
    modul: 'Kependudukan',
  },
  {
    key: 'kas_view',
    label: 'Lihat Buku Kas',
    description: 'Melihat riwayat mutasi kas masuk/keluar dan saldo RT',
    modul: 'Keuangan',
  },
  {
    key: 'kas_manage',
    label: 'Kelola Buku Kas (CRUD)',
    description: 'Catat, edit, dan hapus transaksi pemasukan/pengeluaran kas',
    modul: 'Keuangan',
  },
  {
    key: 'closing_manage',
    label: 'Kelola Closing Bulanan',
    description: 'Input bayar tagihan, edit komponen tagihan, dan tutup buku',
    modul: 'Keuangan',
  },
  {
    key: 'surat_manage',
    label: 'Kelola Surat Menyurat',
    description: 'Buat, edit, hapus, dan cetak undangan/pengantar/SP',
    modul: 'Administrasi',
  },
  {
    key: 'ronda_manage',
    label: 'Kelola Jadwal Ronda',
    description: 'Atur jadwal piket ronda malam dan verifikasi kehadiran',
    modul: 'Keamanan',
  },
  {
    key: 'kerja_bakti_manage',
    label: 'Kelola Kerja Bakti',
    description: 'Buat agenda kerja bakti, QR presensi, dan rekap denda',
    modul: 'Lingkungan',
  },
  {
    key: 'users_manage',
    label: 'Kelola User & Hak Akses',
    description: 'CRUD akun pengurus/warga, reset password, dan atur izin role',
    modul: 'Sistem',
  },
  {
    key: 'portal_warga',
    label: 'Akses Portal Warga',
    description: 'Login ke portal mandiri HP warga (tagihan & presensi QR)',
    modul: 'Portal',
  },
];

export interface RoleMetadataItem {
  role: UserRole;
  label: string;
  kategori: 'pengurus' | 'warga';
  badgeClass: string;
  description: string;
  defaultPermissions: UserPermissions;
}

export const ROLE_METADATA: Record<UserRole, RoleMetadataItem> = {
  superadmin: {
    role: 'superadmin',
    label: 'Superadmin',
    kategori: 'pengurus',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Akses penuh seluruh modul sistem, konfigurasi database, dan manajemen user.',
    defaultPermissions: {
      warga_view: true,
      warga_manage: true,
      kas_view: true,
      kas_manage: true,
      closing_manage: true,
      surat_manage: true,
      ronda_manage: true,
      kerja_bakti_manage: true,
      users_manage: true,
      portal_warga: true,
    },
  },
  ketua_rt: {
    role: 'ketua_rt',
    label: 'Ketua RT',
    kategori: 'pengurus',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Otoritas pimpinan RT: akses penuh data warga, surat, kegiatan, audit kas, & kelola user.',
    defaultPermissions: {
      warga_view: true,
      warga_manage: true,
      kas_view: true,
      kas_manage: true,
      closing_manage: true,
      surat_manage: true,
      ronda_manage: true,
      kerja_bakti_manage: true,
      users_manage: true,
      portal_warga: true,
    },
  },
  bendahara: {
    role: 'bendahara',
    label: 'Bendahara RT',
    kategori: 'pengurus',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Pengelola keuangan kas RT, penerimaan iuran, closing bulanan, & lihat data warga.',
    defaultPermissions: {
      warga_view: true,
      warga_manage: false,
      kas_view: true,
      kas_manage: true,
      closing_manage: true,
      surat_manage: false,
      ronda_manage: false,
      kerja_bakti_manage: false,
      users_manage: false,
      portal_warga: true,
    },
  },
  sekretaris: {
    role: 'sekretaris',
    label: 'Sekretaris RT',
    kategori: 'pengurus',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Pengelola administrasi kependudukan warga, surat menyurat, & agenda kerja bakti.',
    defaultPermissions: {
      warga_view: true,
      warga_manage: true,
      kas_view: true,
      kas_manage: false,
      closing_manage: false,
      surat_manage: true,
      ronda_manage: true,
      kerja_bakti_manage: true,
      users_manage: false,
      portal_warga: true,
    },
  },
  keamanan: {
    role: 'keamanan',
    label: 'Keamanan RT',
    kategori: 'pengurus',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Koordinator keamanan lingkungan: kelola jadwal ronda, scan presensi, & kerja bakti.',
    defaultPermissions: {
      warga_view: true,
      warga_manage: false,
      kas_view: false,
      kas_manage: false,
      closing_manage: false,
      surat_manage: false,
      ronda_manage: true,
      kerja_bakti_manage: true,
      users_manage: false,
      portal_warga: true,
    },
  },
  warga: {
    role: 'warga',
    label: 'Warga',
    kategori: 'warga',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Akun kepala keluarga warga untuk mengakses Portal Warga Mandiri (iuran & presensi).',
    defaultPermissions: {
      warga_view: false,
      warga_manage: false,
      kas_view: false,
      kas_manage: false,
      closing_manage: false,
      surat_manage: false,
      ronda_manage: false,
      kerja_bakti_manage: false,
      users_manage: false,
      portal_warga: true,
    },
  },
  non_aktif: {
    role: 'non_aktif',
    label: 'Non-Aktif',
    kategori: 'warga',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Unit rumah kosong atau akun dibekukan, tidak memiliki hak akses portal maupun admin.',
    defaultPermissions: {
      warga_view: false,
      warga_manage: false,
      kas_view: false,
      kas_manage: false,
      closing_manage: false,
      surat_manage: false,
      ronda_manage: false,
      kerja_bakti_manage: false,
      users_manage: false,
      portal_warga: false,
    },
  },
};

export function isPengurusRole(role: UserRole): boolean {
  return ['superadmin', 'ketua_rt', 'bendahara', 'sekretaris', 'keamanan'].includes(role);
}

export function getDefaultPermissionsForRole(role: UserRole): UserPermissions {
  return { ...ROLE_METADATA[role].defaultPermissions };
}
