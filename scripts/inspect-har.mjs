import fs from 'fs';

const path = 'c:/Users/Ilse.Slater/Downloads/lekki-har-01.har';
const h = JSON.parse(fs.readFileSync(path, 'utf8'));
console.log('entries', h.log.entries.length);
console.log('creator', h.log.creator?.name, h.log.creator?.version);
console.log('browser', h.log.browser?.name, h.log.browser?.version);
if (h.log.pages?.length) {
  for (const p of h.log.pages) console.log('page', p.title, p.startedDateTime);
}
const byStatus = {};
for (const e of h.log.entries) {
  const s = e.response.status;
  byStatus[s] = (byStatus[s] || 0) + 1;
}
console.log('statusCounts', JSON.stringify(byStatus));
console.log('---');
for (const e of h.log.entries) {
  const url = e.request.url;
  const short = url.length > 140 ? url.slice(0, 140) + '…' : url;
  console.log(e.response.status, e.request.method, Math.round(e.time) + 'ms', short);
}
console.log('---ERRORS---');
for (const e of h.log.entries) {
  if (e.response.status >= 400 || e.response.status === 0) {
    console.log('FAIL', e.response.status, e.request.method, e.request.url);
    const text = e.response.content?.text;
    if (text) console.log('  body:', text.slice(0, 800));
  }
}
