const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function inspectTotals() {
  const htmlSep = await fetchUrl('http://localhost:3000/admin/closing?periode=periode-sep-2026');
  const tfootIdxSep = htmlSep.indexOf('<tfoot');
  if (tfootIdxSep !== -1) {
    console.log('--- September Table Footer ---');
    console.log(htmlSep.substring(tfootIdxSep, tfootIdxSep + 800));
  }

  const htmlOkt = await fetchUrl('http://localhost:3000/admin/closing?periode=periode-okt-2026');
  const tfootIdxOkt = htmlOkt.indexOf('<tfoot');
  if (tfootIdxOkt !== -1) {
    console.log('--- October Table Footer ---');
    console.log(htmlOkt.substring(tfootIdxOkt, tfootIdxOkt + 800));
  }
}

inspectTotals();
