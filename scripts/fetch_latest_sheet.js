const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/1jyxyn4NiqiS2eQa7mY6QAxdG4ajWt6xqfVqHRuBouUg/export?format=xlsx';
const dest = 'C:/Users/HP/.gemini/antigravity/scratch/data_rt03_rw14_latest.xlsx';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirect if 302/307
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log('Redirecting to:', res.headers.location);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download complete:', dest);
        resolve();
      });
    }).on('error', reject);
  });
}

downloadFile(url, dest)
  .then(() => console.log('Successfully fetched latest Google Spreadsheet!'))
  .catch(err => console.error('Error downloading:', err.message));
