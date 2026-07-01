'use client';
import { useState, useMemo, useEffect } from 'react';

const TEACHER_PHOTOS = {
  'ครูแคร์': '1csXJRFa9dofvCT-LBDyaCeS9Unb3lE7p', 'ครูน้ำ': '1QNO96LwExcWSKe7RfjJp-jABtxj2FHhK',
  'ครูโจ้': '1htZnlJPc5k10nByhOlHrn8x_XZAflOAk', 'ครูแอม': '1cJQvCZ8UBPyJH6cnq82UkJt-jpBz657a',
  'ครูโอรีโอ้': '1IrPsutWbtaCeqk3GnH8Zjj1Z-3y-7xrD', 'ครูโอริโอ้': '1IrPsutWbtaCeqk3GnH8Zjj1Z-3y-7xrD',
  'ครูฝ้าย': '1bbfqIrfGNgkhA3ucwuRxD-szjFR2-dM0', 'ครูจจ': '1_OmIip5Zo4Eu4vsJfavN3HpNdsDVOqTP',
  'ครูเฟลม': '1Unesflsta3YPMB8el0V3GvRksg4fQPcV', 'ครูเอก': '1iPJSGTWXJhOnfbSh7gIR2aPffOUgyYtt',
  'ครูข้าว': '14wPNMAYIVXsXRSy7CleodJVyZ4Zo3sFg', 'ครูข้าวฟ่าง': '14wPNMAYIVXsXRSy7CleodJVyZ4Zo3sFg',
};
const photoUrl = (t) => (TEACHER_PHOTOS[t] ? 'https://drive.google.com/thumbnail?id=' + TEACHER_PHOTOS[t] + '&sz=w400' : '');

const TH_MONTH = { 'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5, 'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11 };
const TH_MO_ARR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const pad2 = (n) => ('0' + n).slice(-2);

function parseThaiDate(x) {
  const s = String(x == null ? '' : x).trim();
  // รูปแบบใหม่: dd/mm/yyyy ค.ศ. (เช่น 15/03/2026) — ปีเต็ม 4 หลัก
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  // fallback: รูปแบบเดิม เดือนย่อไทย + ปี 2 หลัก (เช่น 15/มี.ค./26)
  m = s.match(/^(\d{1,2})\/(.+?)\/(\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]); const mon = TH_MONTH[m[2].trim()];
  if (mon === undefined) return null;
  let y = Number(m[3]); if (y < 100) y += 2000;
  const d = new Date(y, mon, day); return isNaN(d.getTime()) ? null : d;
}
const ymd = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
function thDate(s) {
  const d = new Date(s + 'T00:00:00');
  const wd = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][d.getDay()];
  return wd + ' ' + d.getDate() + ' ' + TH_MO_ARR[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}
const courseTerm = (c) => { const m = String(c).match(/(\d+)\s*$/); return m ? ('0' + m[1]).slice(-2) : ''; };
const timeStart = (t) => { const m = String(t).match(/(\d{1,2})[.:](\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };
function timeEnd(t) { const a = String(t).match(/(\d{1,2})[.:](\d{2})/g) || []; if (a.length >= 2) { const m = a[1].match(/(\d{1,2})[.:](\d{2})/); return Number(m[1]) * 60 + Number(m[2]); } return timeStart(t); }
function normalizeRoom(course, day, room) {
  if (String(day).indexOf('อาทิตย์') < 0) return room;
  const c = String(course).toUpperCase();
  if (c.indexOf('INTENSIVE') >= 0) return 'ห้อง A';
  if (c.indexOf('FUNDAMENTAL') >= 0) return 'ห้อง C';
  if (c.indexOf('BASIC') >= 0) return /zoom/i.test(room) ? 'ห้อง D' : 'ห้อง B';
  return room;
}
const roundTag = (r) => { const m = String(r).match(/(เช้า|บ่าย)/); return m ? m[1] : ''; };
const roomLabel = (s) => { const t = roundTag(s.round); return t ? s.room + ' (' + t + ')' : s.room; };
const subClass = (subject) => 'sub-' + String(subject).replace(/\s/g, '');
function shortCourse(course) { const c = String(course || '').toUpperCase(); if (c.indexOf('BASIC') >= 0) return 'Basic'; if (c.indexOf('FUND') >= 0) return 'Funda'; if (c.indexOf('INT') >= 0) return 'Intensive'; return course; }

function buildSessions(grid) {
  let loc = null;
  for (let r = 0; r < grid.length && !loc; r++) for (let c = 0; c < grid[r].length; c++) if (String(grid[r][c]).trim() === 'ครั้งที่') { loc = { r, c }; break; }
  if (!loc) return [];
  const c = loc.c, out = [];
  for (let r = loc.r + 1; r < grid.length; r++) {
    const row = grid[r];
    const teacher = String(row[c + 8] || '').trim();
    const course = String(row[c + 2] || '').trim();
    const subject = String(row[c + 7] || '').trim();
    if (!teacher || !course) continue;
    const d = parseThaiDate(row[c - 1]); if (!d) continue;
    const time = String(row[c + 5] || '').trim();
    const hc = row[c + 6];
    const hours = (hc === '' || hc == null) ? Math.round((timeEnd(time) - timeStart(time)) / 60 * 100) / 100 : Number(hc);
    out.push({ date: ymd(d), dayName: String(row[c + 3] || '').trim(), level: String(row[c + 1] || '').trim(), course, term: courseTerm(course), room: normalizeRoom(course, String(row[c + 3] || ''), String(row[c + 4] || '').trim()), time, start: timeStart(time), end: timeEnd(time), hours, subject, teacher, round: String(row[c + 4] || '').trim() });
  }
  return out;
}

function Timeline({ rows, date }) {
  if (!rows.length) return <div className="card empty">ไม่มีคลาสในวันนี้</div>;
  const rooms = [...new Set(rows.map((r) => r.room))].sort();
  const minS = Math.floor(Math.min(...rows.map((r) => r.start)) / 60) * 60;
  const maxE = Math.ceil(Math.max(...rows.map((r) => r.end)) / 60) * 60;
  const px = 1.15, height = (maxE - minS) * px;
  const cols = '70px repeat(' + rooms.length + ', minmax(150px,1fr))';
  const hours = []; for (let t = minS; t <= maxE; t += 60) hours.push(t);
  return (
    <>
      <div className="subtext" style={{ fontWeight: 900, color: 'var(--red-dark)', margin: '0 0 8px' }}>{thDate(date)} · {rows.length} คลาส</div>
      <div className="timeline-wrap">
        <div className="timeline-head" style={{ gridTemplateColumns: cols }}><div>เวลา</div>{rooms.map((r) => <div key={r}>{r}</div>)}</div>
        <div className="timeline-body" style={{ gridTemplateColumns: cols, height: height + 'px' }}>
          <div className="axis">{hours.map((t) => <div className="hour-line" key={t} style={{ top: ((t - minS) * px) + 'px' }}>{pad2(Math.floor(t / 60))}:00</div>)}</div>
          {rooms.map((room) => (
            <div className="room-col" key={room}>
              {rows.filter((r) => r.room === room).map((r, i) => (
                <div key={i} className={'event ' + subClass(r.subject)} style={{ top: ((r.start - minS) * px) + 'px', height: (Math.max((r.end - r.start) * px, 40) - 4) + 'px' }}>
                  <b>{r.subject}</b><div>{r.teacher}</div><div><b>{r.time}</b> · {shortCourse(r.course)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MonthCard({ y, m, dateSet }) {
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(<div className="cal-cell empty" key={'e' + i} />);
  for (let d = 1; d <= days; d++) {
    const ds = y + '-' + pad2(m + 1) + '-' + pad2(d);
    let cls = 'cal-cell'; if (dateSet[ds] === 'เสาร์') cls += ' sat'; else if (dateSet[ds] === 'อาทิตย์') cls += ' sun';
    cells.push(<div className={cls} key={d}>{d}</div>);
  }
  return (
    <div className="cal-month">
      <div className="cal-title">{['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][m]} {y + 543}</div>
      <div className="cal-days">{['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((d, i) => <div className={'cal-h' + (i >= 5 ? ' we' : '')} key={i}>{d}</div>)}{cells}</div>
    </div>
  );
}

export default function Schedule({ rows }) {
  const sessions = useMemo(() => buildSessions(rows), [rows]);
  const [sub, setSub] = useState('week');

  const terms = useMemo(() => [...new Set(sessions.map((s) => s.term).filter(Boolean).concat(['01', '02', '03', '04']))].sort(), [sessions]);
  const termDates = (term, day) => [...new Set(sessions.filter((s) => s.term === term && s.dayName === day).map((s) => s.date))].sort();

  // --- week tab ---
  const [weekTerm, setWeekTerm] = useState('');
  const [weekNo, setWeekNo] = useState(1);

  const allWeeks = useMemo(() => {
    const w = [];
    terms.forEach((term) => {
      const sat = termDates(term, 'เสาร์'), sun = termDates(term, 'อาทิตย์');
      const n = Math.max(sat.length, sun.length);
      for (let i = 0; i < n; i++) {
        const ts = [sat[i], sun[i]].filter(Boolean).map((x) => new Date(x + 'T00:00:00').getTime());
        if (ts.length) w.push({ term, weekNo: i + 1, t: Math.min(...ts) });
      }
    });
    return w;
  }, [terms, sessions]);

  useEffect(() => {
    if (!allWeeks.length || weekTerm) return;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const up = allWeeks.filter((w) => w.t >= now.getTime()).sort((a, b) => a.t - b.t);
    const pick = up.length ? up[0] : [...allWeeks].sort((a, b) => b.t - a.t)[0];
    setWeekTerm(pick.term); setWeekNo(pick.weekNo);
  }, [allWeeks, weekTerm]);

  const weekCount = Math.max(termDates(weekTerm, 'เสาร์').length, termDates(weekTerm, 'อาทิตย์').length, 1);
  const satDate = termDates(weekTerm, 'เสาร์')[weekNo - 1];
  const sunDate = termDates(weekTerm, 'อาทิตย์')[weekNo - 1];
  const daySessions = (date) => sessions.filter((s) => s.term === weekTerm && s.date === date);

  // --- teacher tab ---
  const teachers = useMemo(() => [...new Set(sessions.map((s) => s.teacher).filter(Boolean))].sort(), [sessions]);
  const [teacher, setTeacher] = useState('');
  const [tTerm, setTTerm] = useState('ALL');
  useEffect(() => { if (teachers.length && !teacher) setTeacher(teachers[0]); }, [teachers, teacher]);

  const tRows = sessions.filter((s) => s.teacher === teacher && (tTerm === 'ALL' || s.term === tTerm));
  const regular = useMemo(() => {
    const map = {}; const order = { 'เสาร์': 1, 'อาทิตย์': 2 };
    tRows.forEach((s) => { const rd = roomLabel(s); const k = [s.dayName, s.level, s.course, rd, s.time].join('|'); if (!map[k]) map[k] = { day: s.dayName, grade: s.level, course: s.course, room: rd, time: s.time, start: s.start }; });
    return Object.values(map).sort((a, b) => (order[a.day] || 9) - (order[b.day] || 9) || a.start - b.start || a.course.localeCompare(b.course, 'th'));
  }, [tRows]);
  const dateSet = useMemo(() => { const o = {}; tRows.forEach((s) => { if (s.date) o[s.date] = s.dayName; }); return o; }, [tRows]);
  const months = useMemo(() => {
    const dates = Object.keys(dateSet).sort(); if (!dates.length) return [];
    const first = new Date(dates[0] + 'T00:00:00'), last = new Date(dates[dates.length - 1] + 'T00:00:00');
    let y = first.getFullYear(), m = first.getMonth(); const out = [];
    while (y < last.getFullYear() || (y === last.getFullYear() && m <= last.getMonth())) { out.push({ y, m }); m++; if (m > 11) { m = 0; y++; } }
    return out;
  }, [dateSet]);

  return (
    <>
      <div className="top-title"><div><h1>ตารางเรียน</h1></div></div>
      <div className="tabs-inline">
        <button className={sub === 'week' ? 'active' : ''} onClick={() => setSub('week')}>ตารางรายสัปดาห์</button>
        <button className={sub === 'teacher' ? 'active' : ''} onClick={() => setSub('teacher')}>ตารางครูรายคน</button>
      </div>

      {sub === 'week' && (
        <>
          <div className="card">
            <div className="filter-grid two">
              <div><label>คอร์ส</label><select value={weekTerm} onChange={(e) => { setWeekTerm(e.target.value); setWeekNo(1); }}>{terms.map((t) => <option key={t} value={t}>คอร์ส {t}</option>)}</select></div>
              <div><label>สัปดาห์</label><select value={weekNo} onChange={(e) => setWeekNo(Number(e.target.value))}>{Array.from({ length: weekCount }, (_, i) => i + 1).map((i) => <option key={i} value={i}>สัปดาห์ {i}</option>)}</select></div>
            </div>
          </div>
          <h3 style={{ color: 'var(--red-dark)' }}>วันเสาร์</h3>
          {satDate ? <Timeline rows={daySessions(satDate)} date={satDate} /> : <div className="card empty">ไม่มีตารางวันเสาร์</div>}
          <h3 style={{ color: 'var(--red-dark)', marginTop: 22 }}>วันอาทิตย์</h3>
          {sunDate ? <Timeline rows={daySessions(sunDate)} date={sunDate} /> : <div className="card empty">ไม่มีตารางวันอาทิตย์</div>}
        </>
      )}

      {sub === 'teacher' && (
        <>
          <div className="card">
            <div className="filter-grid two">
              <div><label>เลือกคุณครู</label><select value={teacher} onChange={(e) => setTeacher(e.target.value)}>{teachers.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label>คอร์ส</label><div className="chip-row">{['ALL'].concat(terms).map((t) => <button key={t} className={'chip' + (tTerm === t ? ' active' : '')} onClick={() => setTTerm(t)}>{t === 'ALL' ? 'ทุกคอร์ส' : 'คอร์ส ' + t}</button>)}</div></div>
            </div>
          </div>

          <div className="card teacher-head">
            {photoUrl(teacher) ? <img src={photoUrl(teacher)} alt="" /> : <div className="teacher-noimg">{(teacher || '?').slice(0, 1)}</div>}
            <div><h2 style={{ margin: 0, color: 'var(--red-dark)' }}>{teacher}</h2><div className="subtext">ตารางสอน {regular.length} รายการ</div></div>
          </div>

          {tRows.length === 0 ? <div className="card empty">ไม่มีคลาสตามเงื่อนไข</div> : (
            <>
              <div className="card">
                <div className="sec-title">📋 ตารางสอนประจำ</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>วัน</th><th>ชั้น</th><th className="left">คอร์ส</th><th className="left">ห้องเรียน</th><th>เวลาเรียน</th></tr></thead>
                  <tbody>{regular.map((r, i) => (
                    <tr key={i}><td>{r.day}</td><td><span className="tag">{r.grade}</span></td><td className="left">{r.course}</td><td className="left">{r.room}</td><td style={{ fontWeight: 800, color: 'var(--red-dark)', whiteSpace: 'nowrap' }}>{r.time}</td></tr>
                  ))}</tbody>
                </table></div>
              </div>
              <div className="card">
                <div className="sec-title">🗓️ ปฏิทินวันเรียนทั้งหมด</div>
                <div className="cal-legend"><span className="dot sat" />วันเสาร์<span className="dot sun" style={{ marginLeft: 14 }} />วันอาทิตย์</div>
                <div className="cal-grid">{months.map((mo, i) => <MonthCard key={i} y={mo.y} m={mo.m} dateSet={dateSet} />)}</div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
