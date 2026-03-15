const ACCOUNT_ID = 'd53624886655cdd8ec0575389906dd2c';
const BUCKET = 'virel-media';
const TOKEN = 'i_KROebTyH5POqTAf1Ve683E0oGulFaH1FTMsHqt';

async function listObjects(cursor) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects${cursor ? '?cursor=' + cursor : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  return res.json();
}

async function deleteObject(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN}` } });
  return res.status;
}

let cursor = '';
let total = 0;
while (true) {
  const data = await listObjects(cursor);
  if (!data.result?.objects?.length) break;
  for (const obj of data.result.objects) {
    const status = await deleteObject(obj.key);
    console.log(`[${status}] ${obj.key}`);
    total++;
  }
  if (!data.result.truncated) break;
  cursor = data.result.cursor;
}
console.log(`Done: ${total} objects deleted`);
