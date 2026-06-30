'use client';
import { useState, useMemo } from 'react';

const uniq = (a) => [...new Set(a.filter(Boolean))].sort();
const lastPath = (url) => { const c = String(url).replace(/\/$/, ''); const p = c.split('/'); return p[p.length - 1] || c.slice(-10); };
function formatPrice(p) { if (p === '' || p == null) return ''; const n = Number(String(p).replace(/,/g, '')); return isNaN(n) ? String(p) : n.toLocaleString('th-TH'); }
function copy(text, msg, setToast) { if (!text) return; navigator.clipboard?.writeText(text).then(() => { setToast(msg); setTimeout(() => setToast(''), 1400); }); }

function buildOnline(rows) {
  return (rows || []).slice(1)
    .filter((r) => r[0] && r[1] && r[2])
    .map((r) => ({ level: r[0], courseGroup: r[1], subject: r[2], type: r[3], price: r[4], hours: r[5], productId: r[6], productUrl: r[7], courseUrl: r[8] }));
}

function UrlCell({ url, setToast }) {
  if (!url) return null;
  return <span><span title={url}>{lastPath(url)}</span> <button className="online-copy" onClick={() => copy(url, 'Copy URL แล้ว', setToast)}>Copy</button></span>;
}

export default function Online({ rows }) {
  const data = useMemo(() => buildOnline(rows), [rows]);
  const [level, setLevel] = useState(''); const [group, setGroup] = useState(''); const [kw, setKw] = useState(''); const [toast, setToast] = useState('');
  const levels = useMemo(() => uniq(data.map((r) => r.level)), [data]);
  const groups = useMemo(() => uniq(data.map((r) => r.courseGroup)), [data]);

  const filtered = useMemo(() => {
    const s = kw.toLowerCase().trim();
    return data.filter((r) => {
      const all = [r.level, r.courseGroup, r.subject, r.type, r.price, r.hours, r.productId, r.productUrl, r.courseUrl].join(' ').toLowerCase();
      return (!level || r.level === level) && (!group || r.courseGroup === group) && (!s || all.indexOf(s) !== -1);
    });
  }, [data, level, group, kw]);

  return (
    <>
      <div className="top-title">
        <div><h1>คอร์สออนไลน์</h1><div className="subtext">ค้นหา Product ID และ URL สำหรับ BBAONLINE</div></div>
        <a className="primary-btn" href="https://www.bbaonline.net/wp-admin" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>BBAONLINE Login</a>
      </div>
      <div className="card">
        <div className="filter-grid four">
          <div><label>ระดับ</label><select value={level} onChange={(e) => setLevel(e.target.value)}><option value="">ทุกระดับ</option>{levels.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
          <div><label>กลุ่มคอร์ส</label><select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">ทุกกลุ่มคอร์ส</option>{groups.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
          <div><label>ค้นหา</label><input type="text" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Product ID / วิชา / URL" /></div>
          <div style={{ alignSelf: 'end' }}><button className="primary-btn" onClick={() => { setLevel(''); setGroup(''); setKw(''); }}>ล้าง</button></div>
        </div>
        <div className="count">พบข้อมูล {filtered.length} รายการ</div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>กลุ่มคอร์ส</th><th>ชื่อ/วิชา</th><th>ราคา</th><th>Product ID</th><th>Product URL</th><th>Course URL</th></tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>{r.courseGroup}</td><td>{r.subject}</td><td>{formatPrice(r.price)}</td>
                <td>{r.productId} {r.productId && <button className="online-copy" onClick={() => copy(r.productId, 'Copy Product ID แล้ว', setToast)}>Copy</button>}</td>
                <td><UrlCell url={r.productUrl} setToast={setToast} /></td>
                <td><UrlCell url={r.courseUrl} setToast={setToast} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
