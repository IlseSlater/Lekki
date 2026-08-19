import fs from 'fs';

const path = 'c:/Users/Ilse.Slater/Downloads/lekki-har-01.har';
const h = JSON.parse(fs.readFileSync(path, 'utf8'));

for (const [i, e] of h.log.entries.entries()) {
  console.log(`\n=== Entry ${i} ===`);
  console.log('url', e.request.url);
  console.log('method', e.request.method);
  console.log('status', e.response.status, e.response.statusText);
  console.log('httpVersion', e.response.httpVersion);
  console.log('started', e.startedDateTime);
  console.log('timings', JSON.stringify(e.timings));
  console.log('serverIP', e.serverIPAddress);
  console.log('_error', e._error || e.response._error || e._failed || null);
  console.log('blocked', e.timings?.blocked, 'connect', e.timings?.connect, 'wait', e.timings?.wait, 'receive', e.timings?.receive);
  const reqOrigin = e.request.headers.find((x) => x.name.toLowerCase() === 'origin');
  const reqReferer = e.request.headers.find((x) => x.name.toLowerCase() === 'referer');
  console.log('origin', reqOrigin?.value);
  console.log('referer', reqReferer?.value);
  console.log('req headers', e.request.headers.map((x) => x.name + ':' + x.value).slice(0, 15).join(' | '));
  if (e.request.postData) console.log('post', e.request.postData.text?.slice(0, 300));
  console.log('res headers count', e.response.headers?.length);
  console.log('res body size', e.response.bodySize, 'content size', e.response.content?.size);
}
