// ดึง raw ข้อมูล 4 ชีตจาก Apps Script endpoint (ฝั่ง server) + cache 60 วิ
export const dynamic = 'force-dynamic';

let cache = { at: 0, data: null };

export async function GET() {
  try {
    const now = Date.now();
    if (cache.data && now - cache.at < 60000) return Response.json(cache.data);

    const url = `${process.env.SHEET_ENDPOINT}?token=${encodeURIComponent(process.env.SHEET_TOKEN || '')}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch endpoint failed ' + res.status);
    const json = await res.json();
    if (json.error) throw new Error('endpoint: ' + json.error);

    cache = { at: now, data: json };
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: String(e && e.message || e) }, { status: 500 });
  }
}
