import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const g = (row, i) => String(row && row[i] == null ? '' : row[i]).trim();

// แกะบล็อกตารางสอน (N:X) ออกจาก grid ดิบ โดยอิง header 'ครั้งที่' เหมือน buildSessions ฝั่งเว็บ
// คืน array ของ 11 คอลัมน์: [วันที่, ครั้งที่, ระดับ, คอร์ส, วัน, รอบ/ห้อง, เวลา, ชั่วโมง, วิชา, ครู, หมายเหตุ]
function parseSchedule(grid) {
  if (!Array.isArray(grid)) return [];
  let loc = null;
  for (let r = 0; r < grid.length && !loc; r++) {
    const row = grid[r] || [];
    for (let c = 0; c < row.length; c++) {
      if (String(row[c]).trim() === 'ครั้งที่') { loc = { r, c }; break; }
    }
  }
  if (!loc) return [];
  const c = loc.c, out = [];
  for (let r = loc.r + 1; r < grid.length; r++) {
    const row = grid[r];
    const course = g(row, c + 2), teacher = g(row, c + 8);
    if (!course || !teacher) continue; // ข้ามแถวว่าง/ท้ายตาราง (ตรงกับ logic ฝั่งเว็บ)
    out.push([
      g(row, c - 1), g(row, c), g(row, c + 1), course, g(row, c + 3),
      g(row, c + 4), g(row, c + 5), g(row, c + 6), g(row, c + 7), teacher, g(row, c + 9),
    ]);
  }
  return out;
}

// GET /api/sync?token=<SHEET_TOKEN>  → ดึง roster.gs endpoint → เขียนทับ Neon
export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get('token') !== process.env.SHEET_TOKEN) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const res = await fetch(
      `${process.env.SHEET_ENDPOINT}?token=${encodeURIComponent(process.env.SHEET_TOKEN)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('fetch sheet failed ' + res.status);
    const data = await res.json();
    if (data.error) throw new Error('endpoint: ' + data.error);

    // --- schedule → ตารางคอลัมน์จริง (อ่านง่ายใน DB) ---
    await sql`CREATE TABLE IF NOT EXISTS staff_schedule (
      idx int, session_date text, session_no text, level text, course text,
      day text, room text, time_range text, hours text, subject text, teacher text, note text)`;
    const sched = parseSchedule(data.schedule);
    await sql`TRUNCATE staff_schedule`;
    if (sched.length) {
      const col = (j) => sched.map((r) => r[j]);
      const idx = sched.map((_, i) => i);
      await sql`
        INSERT INTO staff_schedule (idx, session_date, session_no, level, course, day, room, time_range, hours, subject, teacher, note)
        SELECT * FROM UNNEST(${idx}::int[], ${col(0)}::text[], ${col(1)}::text[], ${col(2)}::text[], ${col(3)}::text[],
                             ${col(4)}::text[], ${col(5)}::text[], ${col(6)}::text[], ${col(7)}::text[], ${col(8)}::text[],
                             ${col(9)}::text[], ${col(10)}::text[])`;
    }

    // --- ชีตอื่น (students / online / bonus / ...) → generic blob เหมือนเดิม ---
    await sql`CREATE TABLE IF NOT EXISTS staff_sheets (dataset text, idx int, cells text)`;
    const datasets = Object.keys(data).filter((k) => k !== 'schedule' && Array.isArray(data[k]));
    await sql`TRUNCATE staff_sheets`;
    const synced = { schedule: sched.length };
    for (const key of datasets) {
      const rows = data[key];
      const ds = [], idx = [], cells = [];
      rows.forEach((row, i) => {
        ds.push(key); idx.push(i);
        cells.push(JSON.stringify(Array.isArray(row) ? row : [row]));
      });
      if (ds.length) await sql`
        INSERT INTO staff_sheets (dataset, idx, cells)
        SELECT * FROM UNNEST(${ds}::text[], ${idx}::int[], ${cells}::text[])`;
      synced[key] = rows.length;
    }

    return Response.json({ ok: true, synced, at: new Date().toISOString() });
  } catch (err) {
    return Response.json({ ok: false, error: String(err && err.message || err) }, { status: 500 });
  }
}
