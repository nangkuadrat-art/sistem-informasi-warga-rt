const fs = require('fs');
const path = require('path');

function checkFile(relPath) {
  const content = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf-8');
  console.log(`Checking ${relPath}:`);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('no_unit: 33') || line.includes('no: 33') || line.includes('Blok I/2') || line.includes('Blok I') && line.includes('2')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
    if (line.includes('no_unit: 13') || line.includes('UT/25') || line.includes('YONGKI')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

checkFile('src/lib/data/initialKeluarga.ts');
checkFile('src/lib/data/masterDataGoogleSheets.ts');
