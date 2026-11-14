import fs from 'fs';
import path from 'path';
import os from 'os';

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
      if (fs.existsSync(localPath)) {
        try {
          fs.copyFileSync(localPath, tmpPath);
        } catch (e) {
          console.error(`Gagal menyalin ${filename} ke ${tmpPath}:`, e);
        }
      }
    }
    return tmpPath;
  }

  return localPath;
}
