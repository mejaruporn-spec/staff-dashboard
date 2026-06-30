'use client';
import { useState, useEffect } from 'react';

const LOGO = 'https://drive.google.com/thumbnail?id=1ayFFlwsu2AW6RSq6TOUj0Gx8EKf72luM&sz=w200';
const NAV = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'students', label: '👥 นักเรียนทั้งหมด' },
  { id: 'texts', label: '💬 ส่ง text' },
  { id: 'schedule', label: '📅 ตารางเรียน' },
  { id: 'online', label: '🌐 คอร์สออนไลน์' },
];

// ---- helpers (port จาก Code.gs) ----
const num = (v) => Number(v) || 0;
const gradeOf = (c) => { const s = String(c); if (/basic/i.test(s)) return 'ป.4'; if (/fun/i.test(s)) return 'ป.5'; if (/int/i.test(s)) return 'ป.6'; return 'อื่นๆ'; };
const courseNoOf = (c) => { const s = String(c); if (/pre/i.test(s)) return 'คอร์ส 1'; if (s.includes('1')) return 'คอร์ส 1'; if (s.includes('2')) return 'คอร์ส 2'; if (s.includes('3')) return 'คอร์ส 3'; if (s.includes('4')) return 'คอร์ส 4'; return 'อื่นๆ'; };

function computeDashboard(students) {
  const map = {};
  students.forEach((row) => {
    const course = row[7];
    if (!course) return;
    if (!map[course]) map[course] = { courseName: course, grade: gradeOf(course), courseNo: courseNoOf(course), sci: 0, math: 0, thai: 0, soc: 0, eng: 0 };
    map[course].sci += num(row[8]); map[course].math += num(row[9]); map[course].thai += num(row[10]); map[course].soc += num(row[11]); map[course].eng += num(row[12]);
  });
  return Object.values(map).sort((a, b) => a.courseName.localeCompare(b.courseName, 'th'));
}
function sumByType(data, type) {
  return data.filter((item) => {
    const n = String(item.courseName).toLowerCase();
    if (type === 'onsite') return n.includes('on-site') || n.includes('onsite');
    if (type === 'zoom') return n.includes('zoom');
    return false;
  }).reduce((s, it) => { s.sci += num(it.sci); s.math += num(it.math); s.thai += num(it.thai); s.soc += num(it.soc); s.eng += num(it.eng); return s; }, { sci: 0, math: 0, thai: 0, soc: 0, eng: 0 });
}

export default function Home() {
  const [panel, setPanel] = useState('dashboard');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [dGrade, setDGrade] = useState('');
  const [dCourse, setDCourse] = useState('');

  useEffect(() => {
    fetch('/api/data').then((r) => r.json()).then((d) => {
      if (d.error) setErr(d.error); else setData(d);
    }).catch((e) => setErr(String(e)));
  }, []);

  const students = (data && data.students) ? data.students : [];
  const dash = computeDashboard(students);
  const dashFiltered = dash.filter((it) => (!dGrade || it.grade === dGrade) && (!dCourse || it.courseNo === dCourse));
  const onsite = sumByType(dashFiltered, 'onsite');
  const zoom = sumByType(dashFiltered, 'zoom');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src={LOGO} alt="Big Brain" /><b>Big Brain</b></div>
        <div className="nav-grid">
          {NAV.map((n) => (
            <button key={n.id} className={'nav-btn' + (panel === n.id ? ' active' : '')} onClick={() => setPanel(n.id)}>{n.label}</button>
          ))}
        </div>
      </aside>

      <main className="main">
        {panel === 'dashboard' && (
          <>
            <div className="top-title"><div><h1>Bigbrain</h1><div className="subtext">เราไม่ได้ให้เฉพาะความรู้ แต่เราให้อนาคต</div></div></div>
            <div className="card">
              <div className="filter-grid">
                <div>
                  <label>ระดับชั้น</label>
                  <select value={dGrade} onChange={(e) => setDGrade(e.target.value)}>
                    <option value="">ทุกระดับ</option><option value="ป.4">ป.4</option><option value="ป.5">ป.5</option><option value="ป.6">ป.6</option>
                  </select>
                </div>
                <div>
                  <label>คอร์ส</label>
                  <select value={dCourse} onChange={(e) => setDCourse(e.target.value)}>
                    <option value="">ทุกคอร์ส</option><option>คอร์ส 1</option><option>คอร์ส 2</option><option>คอร์ส 3</option><option>คอร์ส 4</option><option>อื่นๆ</option>
                  </select>
                </div>
                <div style={{ alignSelf: 'end' }}>
                  <button className="primary-btn" onClick={() => { setDGrade(''); setDCourse(''); }}>ล้าง Filter</button>
                </div>
              </div>
              <div className="count">{err ? '⚠️ ' + err : (data ? 'พบข้อมูล ' + dashFiltered.length + ' คอร์สเรียน' : 'Loading...')}</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th className="left">คอร์สเรียน</th><th>วิทย์</th><th>คณิต</th><th>ไทย</th><th>สังคม</th><th>อังกฤษ</th></tr></thead>
                  <tbody>
                    {dashFiltered.map((it, i) => (
                      <tr key={i}><td className="left">{it.courseName}</td><td>{it.sci}</td><td>{it.math}</td><td>{it.thai}</td><td>{it.soc}</td><td>{it.eng}</td></tr>
                    ))}
                    <tr className="summary-row"><td className="left">รวม On-site</td><td>{onsite.sci}</td><td>{onsite.math}</td><td>{onsite.thai}</td><td>{onsite.soc}</td><td>{onsite.eng}</td></tr>
                    <tr className="summary-row"><td className="left">รวม Zoom</td><td>{zoom.sci}</td><td>{zoom.math}</td><td>{zoom.thai}</td><td>{zoom.soc}</td><td>{zoom.eng}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {panel !== 'dashboard' && (
          <>
            <div className="top-title"><div><h1>{NAV.find((n) => n.id === panel).label.replace(/^[^\s]+\s/, '')}</h1></div></div>
            <div className="card empty">🚧 กำลังย้ายระบบส่วนนี้ — เร็วๆ นี้</div>
          </>
        )}
      </main>
    </div>
  );
}
