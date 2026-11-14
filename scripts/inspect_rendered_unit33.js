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

async function inspectUnit33() {
  const htmlSep = await fetchUrl('http://localhost:3000/admin/closing?periode=periode-sep-2026');
  const idxSep = htmlSep.indexOf('Blok I/2');
  if (idxSep !== -1) {
    console.log('--- Unit 33 in September Closing Table ---');
    console.log(htmlSep.substring(idxSep - 200, idxSep + 600));
  } else {
    console.log('Blok I/2 not found in September');
  }

  const htmlOkt = await fetchUrl('http://localhost:3000/admin/closing?periode=periode-okt-2026');
  const idxOkt = htmlOkt.indexOf('Blok I/2');
  if (idxOkt !== -1) {
    console.log('--- Unit 33 in October Closing Table ---');
    console.log(htmlOkt.substring(idxOkt - 200, idxOkt + 600));
  } else {
    console.log('Blok I/2 not found in October');
  }
}

inspectUnit33();
