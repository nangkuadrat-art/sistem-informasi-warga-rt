const fs = require('fs');
const path = require('path');

const dbWargaPath = path.join(__dirname, '../src/lib/data/db_warga.json');
const dbUsersPath = path.join(__dirname, '../src/lib/data/db_users.json');

const units = JSON.parse(fs.readFileSync(dbWargaPath, 'utf-8'));

const DEFAULT_PERMS = {
  superadmin: {
    warga_view: true, warga_manage: true, kas_view: true, kas_manage: true,
    closing_manage: true, surat_manage: true, ronda_manage: true, kerja_bakti_manage: true,
    users_manage: true, portal_warga: true,
  },
  ketua_rt: {
    warga_view: true, warga_manage: true, kas_view: true, kas_manage: true,
    closing_manage: true, surat_manage: true, ronda_manage: true, kerja_bakti_manage: true,
    users_manage: true, portal_warga: true,
  },
  bendahara: {
    warga_view: true, warga_manage: false, kas_view: true, kas_manage: true,
    closing_manage: true, surat_manage: false, ronda_manage: false, kerja_bakti_manage: false,
    users_manage: false, portal_warga: true,
  },
  sekretaris: {
    warga_view: true, warga_manage: true, kas_view: true, kas_manage: false,
    closing_manage: false, surat_manage: true, ronda_manage: true, kerja_bakti_manage: true,
    users_manage: false, portal_warga: true,
  },
  keamanan: {
    warga_view: true, warga_manage: false, kas_view: false, kas_manage: false,
    closing_manage: false, surat_manage: false, ronda_manage: true, kerja_bakti_manage: true,
    users_manage: false, portal_warga: true,
  },
  warga: {
    warga_view: false, warga_manage: false, kas_view: false, kas_manage: false,
    closing_manage: false, surat_manage: false, ronda_manage: false, kerja_bakti_manage: false,
    users_manage: false, portal_warga: true,
  },
  non_aktif: {
    warga_view: false, warga_manage: false, kas_view: false, kas_manage: false,
    closing_manage: false, surat_manage: false, ronda_manage: false, kerja_bakti_manage: false,
    users_manage: false, portal_warga: false,
  },
};

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  ketua_rt: 'Ketua RT',
  bendahara: 'Bendahara RT',
  sekretaris: 'Sekretaris RT',
  keamanan: 'Keamanan RT',
  warga: 'Warga',
  non_aktif: 'Non-Aktif',
};

const PENGURUS_ROLES = new Set(['superadmin', 'ketua_rt', 'bendahara', 'sekretaris', 'keamanan']);

const users = units.map((u) => {
  const role = u.role && DEFAULT_PERMS[u.role] ? u.role : (u.status_keluarga === 'aktif' ? 'warga' : 'non_aktif');
  const isKosong = u.nama_kepala_keluarga === '-' || u.status_rumah === 'kosong' || role === 'non_aktif';
  const status = isKosong ? 'non_aktif' : 'aktif';

  let username = u.username;
  if (!username) {
    if (isKosong) {
      username = `unit_${u.no_unit}`;
    } else {
      username = u.nama_kepala_keluarga.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || `user${u.no_unit}`;
    }
  }

  // Ambil no hp dari anggota kepala keluarga atau anggota pertama yang punya
  let phone = '';
  if (Array.isArray(u.warga)) {
    const kk = u.warga.find((m) => m.hubungan_keluarga === 'Kepala Keluarga' && m.nomor_telepon) ||
               u.warga.find((m) => m.nomor_telepon);
    if (kk) phone = kk.nomor_telepon || '';
  }

  return {
    id: `usr-${u.id}`,
    unit_id: u.id,
    no_unit: u.no_unit,
    alamat: u.alamat,
    nama: isKosong ? `Unit Kosong (${u.alamat})` : u.nama_kepala_keluarga,
    username,
    password: isKosong ? '-' : '12345',
    no_hp: phone,
    role,
    role_label: ROLE_LABELS[role] || 'Warga',
    kategori: PENGURUS_ROLES.has(role) ? 'pengurus' : 'warga',
    status,
    permissions: { ...DEFAULT_PERMS[role] },
    created_at: '2026-09-01T00:00:00.000Z',
  };
});

fs.writeFileSync(dbUsersPath, JSON.stringify(users, null, 2), 'utf-8');
console.log(`Generated ${users.length} users in db_users.json!`);
const counts = {};
users.forEach(u => {
  counts[u.role] = (counts[u.role] || 0) + 1;
});
console.log('Role distribution:', counts);
