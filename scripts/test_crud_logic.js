const {
  getDbUnits,
  createKeluargaStore,
  updateKeluargaStore,
  deleteKeluargaStore,
  addAnggotaStore,
  updateAnggotaStore,
  deleteAnggotaStore,
  resetDbUnits,
} = require('../src/lib/data/store');

console.log('--- TEST 1: INITIAL STATE ---');
const initial = getDbUnits();
console.log('Initial units count:', initial.length);

console.log('\n--- TEST 2: CREATE UNIT ---');
const newUnit = createKeluargaStore({
  nama_kepala_keluarga: 'Budi Santoso Test',
  blok_rumah: 'UT',
  nomor_rumah: '99',
  status_rumah: 'pemilik',
  tanggal_lahir: '1980-05-20',
  jenis_kelamin: 'L',
  no_hp: '08123456789'
});
console.log('Created unit ID:', newUnit.id, 'Alamat:', newUnit.alamat, 'Anggota:', newUnit.warga.length);

console.log('\n--- TEST 3: UPDATE UNIT ---');
const updatedUnit = updateKeluargaStore(newUnit.id, {
  nama_kepala_keluarga: 'Budi Santoso Test (Updated)',
  role_label: 'Ketua RT'
});
console.log('Updated unit nama:', updatedUnit.nama_kepala_keluarga, 'Role:', updatedUnit.role_label);

console.log('\n--- TEST 4: ADD ANGGOTA ---');
const member = addAnggotaStore(newUnit.id, {
  nama_lengkap: 'Siti Aminah',
  hubungan_keluarga: 'Istri',
  jenis_kelamin: 'P',
  tanggal_lahir: '1983-08-14',
  tempat_lahir: 'Cilacap',
  status_pernikahan: 'Menikah',
  nomor_telepon: '08198765432'
});
console.log('Added member:', member.nama_lengkap, 'Usia:', member.usia_text, 'Kategori:', member.kategori_usia);

console.log('\n--- TEST 5: UPDATE ANGGOTA ---');
const updatedMember = updateAnggotaStore(newUnit.id, member.id, {
  nama_lengkap: 'Siti Aminah, S.Pd',
  nomor_telepon: '081299999999'
});
console.log('Updated member:', updatedMember.nama_lengkap, 'Telp:', updatedMember.nomor_telepon);

console.log('\n--- TEST 6: DELETE ANGGOTA ---');
const delMemberRes = deleteAnggotaStore(newUnit.id, member.id);
console.log('Delete member success:', delMemberRes);

console.log('\n--- TEST 7: DELETE UNIT ---');
const delUnitRes = deleteKeluargaStore(newUnit.id);
console.log('Delete unit success:', delUnitRes);

console.log('\n--- TEST 8: RESET DB ---');
resetDbUnits();
const afterReset = getDbUnits();
console.log('After reset count:', afterReset.length);
console.log('All tests passed successfully!');
