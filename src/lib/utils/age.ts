export function hitungUsia(tanggalLahir: string): { usia: number; kategori: string } {
  if (!tanggalLahir) return { usia: 0, kategori: '-' };
  
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 0) age = 0;

  // Klasifikasi Usia Standar RT (Sesuai Dokumen Resmi RT.03 RW.14 Tritih Lor)
  let kategori = 'Dewasa';
  if (age > 60) {
    kategori = 'Lansia';
  } else if (age >= 45) {
    kategori = 'Pra-lansia';
  } else if (age >= 19) {
    kategori = 'Dewasa';
  } else if (age >= 10) {
    kategori = 'Remaja';
  } else if (age >= 5) {
    kategori = 'Anak-anak';
  } else if (age >= 1) {
    kategori = 'Balita';
  } else {
    kategori = 'Bayi';
  }

  return { usia: age, kategori };
}

export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
