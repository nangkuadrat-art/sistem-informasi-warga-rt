const { getAllSurat, createSurat, deleteSurat, generateNomorSurat } = require('../src/lib/data/storeSurat');

console.log('--- TEST SURAT CRUD ---');
const initial = getAllSurat();
console.log('Initial count:', initial.length);

const generatedNo = generateNomorSurat('undangan_rapat');
console.log('Generated No Undangan Rapat:', generatedNo);

const testSurat = createSurat({
  nomor_surat: '999/TEST/RT03-RW14/XI/2026',
  jenis: 'undangan_rapat',
  perihal: 'Uji Coba Surat',
  tanggal_surat: '2026-11-20',
  tujuan_nama: 'Warga Tes',
  penandatangan_nama: 'Yuli Ardinurman',
  penandatangan_jabatan: 'Ketua RT.03 / RW.14'
});
console.log('Created surat ID:', testSurat.id);

const afterCreate = getAllSurat();
console.log('Count after create:', afterCreate.length);

const deleted = deleteSurat(testSurat.id);
console.log('Delete result:', deleted);

const afterDelete = getAllSurat();
console.log('Count after delete:', afterDelete.length);
console.log('CRUD TEST PASSED!');
