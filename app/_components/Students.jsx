'use client';
import { useState, useMemo } from 'react';

// ---- helpers (port จาก Code.gs/Index.html) ----
const checked = (v) => String(v).trim() === '1';
const normalize = (t) => String(t || '').trim().replace(/\s+/g, '').toLowerCase();
const cleanPhone = (p) => String(p || '').replace(/[^\d+]/g, '');
const modeLabel = (m) => (m === 'Onsite' ? 'On-site' : (m || '-'));

function parseCourse(name) {
  const s = String(name || '');
  let grade = '';
  if (/basic/i.test(s)) grade = 'ป.4'; else if (/fun/i.test(s)) grade = 'ป.5'; else if (/int/i.test(s)) grade = 'ป.6';
  const isSpecial = /pre|ตะลุย|mini\s*exam/i.test(s);
  let term = '';
  if (!isSpecial) { const m = s.match(/(?:basic|funda|fun|int|intensive)\s*0*([1-4])/i); if (m) term = m[1]; }
  let mode = '';
  if (/zoom/i.test(s)) mode = 'Zoom'; else if (/on[\s-]*site/i.test(s)) mode = 'Onsite';
  let room = ''; const rm = s.match(/\b([A-D])\b\s*$/); if (rm) room = rm[1];
  return { grade, term, mode, room, special: isSpecial };
}

function buildStudents(rows) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const order = row[0] || '', firstName = row[2] || '', lastName = row[3] || '', id = row[13] || '';
    const fk = normalize(firstName), lk = normalize(lastName);
    if (!fk || !lk) return;
    const key = fk + '|' + lk + '|' + id;
    if (!map.has(key)) map.set(key, {
      orders: [], sortOrder: Number(order) || 999999, prefix: row[1] || '', firstName, lastName,
      nickname: row[4] || '', phone: row[5] || '', line: row[6] || '', id, pass: row[14] || '',
      courses: [], searchText: [firstName, lastName, row[4], row[5], row[6], id].join(' ').toLowerCase(),
    });
    const st = map.get(key);
    if (order && st.orders.indexOf(order) === -1) st.orders.push(order);
    if (Number(order) && Number(order) < st.sortOrder) st.sortOrder = Number(order);
    const course = row[7] || '';
    if (course) st.courses.push({ name: course, sci: checked(row[8]), math: checked(row[9]), thai: checked(row[10]), social: checked(row[11]), eng: checked(row[12]) });
  });
  return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function subjectTags(c) {
  const t = [];
  if (c.sci) t.push('วิทย์'); if (c.math) t.push('คณิต'); if (c.thai) t.push('ไทย'); if (c.social) t.push('สังคม'); if (c.eng) t.push('อังกฤษ');
  return t.join(' · ') || '-';
}

function copy(text, setToast) {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => { setToast('Copy แล้ว'); setTimeout(() => setToast(''), 1400); });
}

function CourseRows({ courses }) {
  if (!courses.length) return <div className="subtext">ไม่พบข้อมูลคอร์ส</div>;
  return (
    <div style={{ overflow: 'auto' }}>
      <div className="course-row" style={{ fontWeight: 900, color: 'var(--muted)' }}>
        <div>คอร์ส</div><div>วิทย์</div><div>คณิต</div><div>ไทย</div><div>สังคม</div><div>อังกฤษ</div>
      </div>
      {courses.map((c, i) => (
        <div className="course-row" key={i}>
          <div style={{ fontWeight: 800 }}>{c.name}</div>
          <div>{c.sci ? 'วิทย์' : ''}</div><div>{c.math ? 'คณิต' : ''}</div><div>{c.thai ? 'ไทย' : ''}</div><div>{c.social ? 'สังคม' : ''}</div><div>{c.eng ? 'อังกฤษ' : ''}</div>
        </div>
      ))}
    </div>
  );
}

function StudentCard({ st, setToast }) {
  const full = [st.prefix, st.firstName, st.lastName].join(' ').replace(/\s+/g, ' ').trim();
  return (
    <div className="card student-card">
      <div className="student-head"><div className="tiny-label">ลำดับ {st.orders.join(', ') || '-'}</div><b>{full}</b> <span className="subtext">({st.nickname || '-'})</span></div>
      <div className="info-grid">
        <div className="info-cell"><div className="tiny-label">LINE@</div><div className="big-value">{st.line || '-'} <button className="online-copy" onClick={() => copy(st.line, setToast)}>Copy</button></div></div>
        <div className="info-cell"><div className="tiny-label">เบอร์โทร</div><div className="big-value"><a href={'tel:' + cleanPhone(st.phone)}>{st.phone || '-'}</a></div></div>
        <div className="info-cell"><div className="tiny-label">ID</div><div className="big-value">{st.id || '-'}</div></div>
        <div className="info-cell"><div className="tiny-label">Password</div><div className="big-value">{st.pass || '-'}</div></div>
      </div>
      <div className="course-list"><div className="tiny-label" style={{ marginBottom: 8 }}>คอร์สที่ลงทะเบียน</div><CourseRows courses={st.courses} /></div>
    </div>
  );
}

function DupCard({ st, conflicts, setToast }) {
  const full = [st.prefix, st.firstName, st.lastName].join(' ').replace(/\s+/g, ' ').trim();
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <b style={{ fontSize: 17 }}>{full}</b> <span className="subtext">({st.nickname || '-'})</span>
          <div className="big-value" style={{ color: '#16a34a', margin: '6px 0' }}>{st.line || '-'} <button className="online-copy" onClick={() => copy(st.line, setToast)}>Copy</button></div>
        </div>
        <div className="tag" style={{ whiteSpace: 'nowrap' }}>ID {st.id || '-'}</div>
      </div>
      {conflicts.map((g, gi) => (
        <div className="dup-box" key={gi}>
          <div style={{ fontWeight: 900, color: '#b45309', marginBottom: 6 }}>{g.label} — ลงซ้ำ {g.regs.length} รายการ</div>
          {g.regs.map((r, ri) => (
            <div key={ri} style={{ padding: '5px 0', borderTop: '1px solid #fde68a' }}>
              <b>{r.name}</b> <span className="tag">{modeLabel(r.mode)}</span> {r.room && <span className="tag">ห้อง {r.room}</span>} <span className="subtext">วิชา: {subjectTags(r)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Students({ rows }) {
  const students = useMemo(() => buildStudents(rows), [rows]);
  const [sub, setSub] = useState('search');
  const [toast, setToast] = useState('');
  const [sGrade, setSGrade] = useState(''); const [sTerm, setSTerm] = useState(''); const [kw, setKw] = useState('');
  const [dTerm, setDTerm] = useState(''); const [dGrade, setDGrade] = useState(''); const [dMode, setDMode] = useState('');

  const searchResults = useMemo(() => {
    if (!kw && !sGrade && !sTerm) return null;
    const terms = kw ? kw.toLowerCase().trim().split(/\s+/) : [];
    return students.filter((st) => {
      const ms = !terms.length || terms.every((t) => st.searchText.indexOf(t) !== -1);
      const mc = (!sGrade && !sTerm) || st.courses.some((c) => { const p = parseCourse(c.name); if (sGrade && p.grade !== sGrade) return false; if (sTerm && p.term !== sTerm) return false; return true; });
      return ms && mc;
    });
  }, [students, kw, sGrade, sTerm]);

  const dupResults = useMemo(() => {
    const out = [];
    students.forEach((st) => {
      const regs = st.courses.map((c) => ({ ...c, ...parseCourse(c.name) })).filter((r) => {
        if (!r.grade) return false;
        if (dGrade && r.grade !== dGrade) return false;
        if (dTerm && r.term !== dTerm) return false;
        if (dMode && r.mode !== dMode) return false;
        return true;
      });
      const groups = {};
      regs.forEach((r) => { const k = r.grade + ' · คอร์ส ' + (r.term || '-'); (groups[k] = groups[k] || []).push(r); });
      const conflicts = [];
      Object.keys(groups).forEach((k) => { const arr = groups[k]; const uniq = new Set(arr.map((r) => r.mode + '|' + r.room)); if (uniq.size >= 2) conflicts.push({ label: k, regs: arr }); });
      if (conflicts.length) out.push({ student: st, conflicts });
    });
    return out;
  }, [students, dGrade, dTerm, dMode]);

  return (
    <>
      <div className="top-title"><div><h1>นักเรียนทั้งหมด</h1><div className="subtext">ค้นหารายชื่อและตรวจการลงทะเบียนซ้ำ</div></div></div>
      <div className="tabs-inline">
        <button className={sub === 'search' ? 'active' : ''} onClick={() => setSub('search')}>ค้นหารายชื่อ</button>
        <button className={sub === 'dup' ? 'active' : ''} onClick={() => setSub('dup')}>ตรวจลงทะเบียนซ้ำ</button>
      </div>

      {sub === 'search' && (
        <>
          <div className="card">
            <div className="filter-grid">
              <div><label>ระดับชั้น</label><select value={sGrade} onChange={(e) => setSGrade(e.target.value)}><option value="">ทุกระดับ</option><option value="ป.4">ป.4</option><option value="ป.5">ป.5</option><option value="ป.6">ป.6</option></select></div>
              <div><label>คอร์ส</label><select value={sTerm} onChange={(e) => setSTerm(e.target.value)}><option value="">ทุกคอร์ส</option><option value="1">คอร์ส 1</option><option value="2">คอร์ส 2</option><option value="3">คอร์ส 3</option><option value="4">คอร์ส 4</option></select></div>
              <div><label>ค้นหา</label><input type="text" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="ชื่อ, สกุล, ชื่อเล่น, เบอร์, LINE, ID" /></div>
            </div>
            <div className="count">{searchResults === null ? '' : 'พบข้อมูล ' + searchResults.length + ' รายการ'}</div>
          </div>
          <div className="stack">
            {searchResults === null ? <div className="card empty">กรุณาเลือกระดับชั้น/คอร์ส หรือพิมพ์คำค้นหา</div>
              : searchResults.length === 0 ? <div className="card empty">ไม่พบข้อมูล</div>
                : searchResults.map((st, i) => <StudentCard key={i} st={st} setToast={setToast} />)}
          </div>
        </>
      )}

      {sub === 'dup' && (
        <>
          <div className="card">
            <div className="filter-grid">
              <div><label>คอร์ส</label><select value={dTerm} onChange={(e) => setDTerm(e.target.value)}><option value="">ทุกคอร์ส</option><option value="1">คอร์ส 1</option><option value="2">คอร์ส 2</option><option value="3">คอร์ส 3</option><option value="4">คอร์ส 4</option></select></div>
              <div><label>ชั้น</label><select value={dGrade} onChange={(e) => setDGrade(e.target.value)}><option value="">ทุกชั้น</option><option value="ป.4">ป.4 Basic</option><option value="ป.5">ป.5 Fundamental</option><option value="ป.6">ป.6 Intensive</option></select></div>
              <div><label>รูปแบบ</label><select value={dMode} onChange={(e) => setDMode(e.target.value)}><option value="">ทุกรูปแบบ</option><option value="Onsite">On-site</option><option value="Zoom">Zoom</option></select></div>
            </div>
            <div className="count">พบ {dupResults.length} คนที่ลงทะเบียนซ้ำ</div>
          </div>
          <div className="stack">
            {dupResults.length === 0 ? <div className="card empty">ไม่พบนักเรียนที่ลงทะเบียนซ้ำตามเงื่อนไข</div>
              : dupResults.map((r, i) => <DupCard key={i} st={r.student} conflicts={r.conflicts} setToast={setToast} />)}
          </div>
        </>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
