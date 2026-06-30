'use client';
import { useState, useMemo } from 'react';

function parseCourse(name) {
  const s = String(name || '');
  const isSpecial = /pre|ตะลุย|mini\s*exam/i.test(s);
  let term = '';
  if (!isSpecial) { const m = s.match(/(?:basic|funda|fun|int|intensive)\s*0*([1-4])/i); if (m) term = m[1]; }
  return { term };
}
const clean = (t) => String(t == null ? '' : t).trim().replace(/^"+|"+$/g, '');

function buildTextData(rows) {
  return (rows || [])
    .filter((r) => r[7] && (r[16] || r[17] || r[18]))
    .map((r) => ({
      name: r[2] || '', surname: r[3] || '', nickname: r[4] || '', phone: r[5] || '', lineName: r[6] || '', course: r[7] || '',
      replay: clean(r[16]), tracking: clean(r[17]), idpass: clean(r[18]),
    }));
}

const FIELD_CFG = {
  idpass: { label: 'ID/Pass ปิดคอร์ส', toast: 'Copy ID/Pass แล้ว' },
  tracking: { label: 'ที่อยู่จัดส่ง Tracking', toast: 'Copy ที่อยู่แล้ว' },
  replay: { label: 'ลิงก์เรียนย้อนหลัง', toast: 'Copy ลิงก์ย้อนหลังแล้ว' },
};

function copy(text, msg, setToast) {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => { setToast(msg); setTimeout(() => setToast(''), 1400); });
}

function TextCard({ item, fields, expand, setToast }) {
  const full = [item.name, item.surname].join(' ').trim();
  return (
    <div className="card student-card">
      <div className="student-head"><b style={{ color: '#16a34a' }}>{item.lineName || '-'}</b><div className="subtext">{full} ({item.nickname || '-'}) · {item.course}</div></div>
      {fields.map((f) => {
        const cfg = FIELD_CFG[f];
        const value = item[f] || '';
        if (!value) return <div className="text-block" key={f}><div className="text-body subtext">ไม่มีข้อมูล {cfg.label}</div></div>;
        return (
          <div className="text-block" key={f}>
            <div className="text-block-head"><b>{cfg.label}</b><button className="online-copy" onClick={() => copy(value, cfg.toast, setToast)}>Copy</button></div>
            <div className={'text-body' + (expand ? '' : ' clamp')}>{value}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Texts({ rows }) {
  const data = useMemo(() => buildTextData(rows), [rows]);
  const [term, setTerm] = useState(''); const [course, setCourse] = useState(''); const [mode, setMode] = useState('all');
  const [kw, setKw] = useState(''); const [expand, setExpand] = useState(false); const [toast, setToast] = useState('');

  const courseOptions = useMemo(() => {
    const set = {};
    data.forEach((it) => { if (!it.course) return; if (term && parseCourse(it.course).term !== term) return; set[it.course] = true; });
    return Object.keys(set).sort();
  }, [data, term]);

  const results = useMemo(() => {
    if (!term && !course && !kw) return null;
    const k = kw.trim().toLowerCase();
    return data.filter((it) => {
      const s = [it.name, it.surname, it.nickname, it.phone, it.lineName].join(' ').toLowerCase();
      if (k && s.indexOf(k) === -1) return false;
      if (course && it.course !== course) return false;
      if (term && parseCourse(it.course).term !== term) return false;
      return true;
    });
  }, [data, term, course, kw]);

  const fields = mode === 'all' ? ['idpass', 'tracking', 'replay'] : [mode];

  return (
    <>
      <div className="top-title"><div><h1>ส่ง text ID / ที่อยู่ / ย้อนหลัง</h1><div className="subtext">เลือกคอร์สหรือค้นหา แล้ว Copy ข้อความสำหรับส่ง LINE</div></div></div>
      <div className="card">
        <div className="filter-grid wrap">
          <div><label>คอร์ส</label><select value={term} onChange={(e) => { setTerm(e.target.value); setCourse(''); }}><option value="">ทุกคอร์ส</option><option value="1">คอร์ส 1</option><option value="2">คอร์ส 2</option><option value="3">คอร์ส 3</option><option value="4">คอร์ส 4</option></select></div>
          <div><label>คอร์สเรียน</label><select value={course} onChange={(e) => setCourse(e.target.value)}><option value="">ทุกคลาส</option>{courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label>แสดงข้อมูล</label><select value={mode} onChange={(e) => setMode(e.target.value)}><option value="all">แสดงทั้งหมด</option><option value="idpass">ID/Pass ปิดคอร์ส</option><option value="tracking">ที่อยู่จัดส่ง Tracking</option><option value="replay">ลิงก์เรียนย้อนหลัง</option></select></div>
          <div><label>ค้นหา</label><input type="text" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="ชื่อ / นามสกุล / ชื่อเล่น / เบอร์ / LINE" /></div>
        </div>
        <label style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={expand} onChange={(e) => setExpand(e.target.checked)} style={{ width: 'auto' }} /> กางข้อความทั้งหมด
        </label>
        <div className="count">{results === null ? '' : 'พบ ' + results.length + ' รายการ'}</div>
      </div>
      <div className="stack">
        {results === null ? <div className="card empty">กรุณาเลือกคอร์ส/คลาส หรือพิมพ์ค้นหา</div>
          : results.length === 0 ? <div className="card empty">ไม่พบข้อมูล</div>
            : results.slice(0, 70).map((it, i) => <TextCard key={i} item={it} fields={fields} expand={expand} setToast={setToast} />)}
      </div>
      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
