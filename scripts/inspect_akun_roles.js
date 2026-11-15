const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = xlsx.readFile('C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14.xlsx');
const akunSheet = xlsx.utils.sheet_to_json(wb.Sheets['AKUN'], { header: 1 });
console.log('=== AKUN SHEET ===');
akunSheet.slice(0, 20).forEach((r, idx) => console.log(idx, r));

const warga = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/lib/data/db_warga.json'), 'utf-8'));
console.log('=== ROLES IN DB_WARGA ===');
const roles = {};
warga.forEach(w => {
  const k = `${w.role} (${w.role_label})`;
  roles[k] = (roles[k] || 0) + 1;
});
console.log(roles);
console.log('Sample users:', warga.slice(0, 5).map(u => ({
  id: u.id, no_unit: u.no_unit, alamat: u.alamat, nama: u.nama_kepala_keluarga,
  username: u.username, role: u.role, role_label: u.role_label, status_keluarga: u.status_keluarga
})));
