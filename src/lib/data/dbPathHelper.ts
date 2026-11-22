import fs from 'fs';
import path from 'path';
import os from 'os';
import defaultKasPeriods from './db_kas_periods.json';
import defaultWarga from './db_warga.json';
import defaultSurat from './db_surat.json';
import defaultUsers from './db_users.json';
import defaultWargaHistori from './db_warga_histori.json';
import defaultDepositRequests from './db_deposit_requests.json';
import defaultJadwalRonda from './db_jadwal_ronda.json';
import defaultJadwalKerjaBakti from './db_jadwal_kerja_bakti.json';

const DEFAULT_MAP: Record<string, any> = {
  'db_kas_periods.json': defaultKasPeriods,
  'db_warga.json': defaultWarga,
  'db_surat.json': defaultSurat,
  'db_users.json': defaultUsers,
  'db_warga_histori.json': defaultWargaHistori,
  'db_deposit_requests.json': defaultDepositRequests,
  'db_jadwal_ronda.json': defaultJadwalRonda,
  'db_jadwal_kerja_bakti.json': defaultJadwalKerjaBakti,
};

/**
 * Mendapatkan path file database JSON yang aman baik untuk lingkungan lokal
 * maupun serverless (Vercel) di mana root filesystem bersifat read-only.
 */
export function getDbFilePath(filename: string): string {
  const localPath = path.join(process.cwd(), 'src/lib/data', filename);

  // Jika berjalan di lingkungan Vercel Serverless
  if (process.env.VERCEL) {
    const tmpPath = path.join(os.tmpdir(), filename);
    if (!fs.existsSync(tmpPath)) {
      const fallbackData = DEFAULT_MAP[filename];
      if (fs.existsSync(localPath)) {
        try {
          fs.copyFileSync(localPath, tmpPath);
        } catch {
          if (fallbackData) {
            try {
              fs.writeFileSync(tmpPath, JSON.stringify(fallbackData, null, 2), 'utf-8');
            } catch (err) {
              console.error(`Gagal menulis fallback ${filename} ke tmp:`, err);
            }
          }
        }
      } else if (fallbackData) {
        try {
          fs.writeFileSync(tmpPath, JSON.stringify(fallbackData, null, 2), 'utf-8');
        } catch (err) {
          console.error(`Gagal menulis fallback ${filename} ke tmp:`, err);
        }
      }
    }
    return tmpPath;
  }

  return localPath;
}

export function getDefaultJson(filename: string): any {
  return DEFAULT_MAP[filename] || null;
}
