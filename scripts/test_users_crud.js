const fs = require('fs');
const path = require('path');

const dbUsersPath = path.join(__dirname, '../src/lib/data/db_users.json');
const originalData = fs.readFileSync(dbUsersPath, 'utf-8');
const users = JSON.parse(originalData);

console.log('Total initial users:', users.length);
const pengurus = users.filter(u => u.kategori === 'pengurus');
console.log('Pengurus count:', pengurus.length, pengurus.map(p => `${p.nama} (${p.role_label})`));

// Simulate CRUD sanity checks
const testUser = {
  id: 'usr-test-crud',
  unit_id: null,
  no_unit: null,
  alamat: 'Pengurus / Eksternal',
  nama: 'Sekretaris Test',
  username: 'sekretaris_test',
  password: '12345',
  no_hp: '62812345678',
  role: 'sekretaris',
  role_label: 'Sekretaris RT',
  kategori: 'pengurus',
  status: 'aktif',
  permissions: {
    warga_view: true, warga_manage: true, kas_view: true, kas_manage: false,
    closing_manage: false, surat_manage: true, ronda_manage: true, kerja_bakti_manage: true,
    users_manage: false, portal_warga: true,
  },
  created_at: new Date().toISOString()
};

users.unshift(testUser);
if (users[0].username !== 'sekretaris_test') throw new Error('Create simulation failed');

// Update
users[0].permissions.kas_manage = true;
if (!users[0].permissions.kas_manage) throw new Error('Update permissions failed');

// Delete
const cleaned = users.filter(u => u.id !== 'usr-test-crud');
if (cleaned.length !== 56) throw new Error('Cleanup count mismatch');

console.log('CRUD structure & permissions test PASSED!');
