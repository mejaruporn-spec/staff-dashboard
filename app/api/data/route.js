// อ่านจาก Neon ก่อน → ถ้าว่าง/ล่ม fallback ไป Google Sheet (ผ่าน roster.gs endpoint)
// คืน JSON รูปแบบเดิม { students, schedule, online, ... } — พาเนล React ไม่ต้องแก้
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

let cache = { at: 0, data: null };

// header 11 คอลัมน์ (ลำดับ N:X) — ให้ Schedule panel หา 'ครั้งที่' เจอที่ index 1 แล้ว offset ตรง
const SCHED_HEAD = ['วันที่', 'ครั้งที่', 'ระดับ', 'คอร์ส', 'วัน', 'รอบ/ห้อง', 'เวลา', 'ชั่วโมง', 'วิชา', 'ครู', 'หมายเหตุ'];

async function fromNeon() {
  const [sheetRows, schedRows] = await Promise.all([
    sql`SELECT dataset, cells FROM staff_sheets ORDER BY dataset, idx`,
    sql`SELECT session_date, session_no, level, course, day, room, time_range, hours, subject, teacher, note
        FROM staff_schedule ORDER BY idx`,
  ]);
  if (!sheetRows.length && !schedRows.length) return null; // ยังไม่ได้ sync → fallback ไป Sheet

  const out = {};
  // ชีตทั่วไป (students / online / bonus / ...) จาก generic blob
  for (const r of sheetRows) {
    (out[r.dataset] = out[r.dataset] || []).push(JSON.parse(r.cells));
  }
  // schedule ประกอบกลับเป็น grid รูปเดิม (header + แถวข้อมูล 11 คอลัมน์)
  if (schedRows.length) {
    out.schedule = [SCHED_HEAD].concat(
      schedRows.map((r) => [
        r.session_date, r.session_no, r.level, r.course, r.day,
        r.room, r.time_range, r.hours, r.subject, r.teacher, r.note,
      ])
    );
  }
  return out;
}

// fallback: อ่านสดจาก Google Sheet ผ่าน Apps Script endpoint
async function fromSheet() {
  const url = `${process.env.SHEET_ENDPOINT}?token=${encodeURIComponent(process.env.SHEET_TOKEN || '')}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch endpoint failed ' + res.status);
  const json = await res.json();
  if (json.error) throw new Error('endpoint: ' + json.error);
  return json;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache.data && now - cache.at < 60000) return Response.json(cache.data);

    let data = null;
    try { data = await fromNeon(); } catch (e) { data = null; } // Neon ล่ม/ตารางยังไม่มี → ลอง Sheet
    if (!data) data = await fromSheet();                        // Neon ว่าง/ล่ม → Sheet

    cache = { at: now, data };
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e && e.message || e) }, { status: 500 });
  }
}
