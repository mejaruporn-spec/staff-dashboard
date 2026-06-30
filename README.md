# Staff Dashboard (Big Brain Internal)

ระบบภายในแอดมิน — ย้ายจาก Apps Script ขึ้น Vercel
อ่านข้อมูลจาก Google Sheet (ผ่าน roster.gs endpoint) → Phase 2 จะย้าย Neon

## เข้าใช้งาน
เปิดผ่านลิงก์ที่มี key: `https://staff.bigbrainschool.net/?key=<STAFF_KEY>`
(เปิดครั้งแรกเซ็ต cookie → ครั้งต่อไปไม่ต้องใส่ key)

## Environment Variables (ตั้งใน Vercel)
| ตัวแปร | ค่า |
|---|---|
| `SHEET_ENDPOINT` | URL /exec ของ roster.gs |
| `SHEET_TOKEN` | TOKEN ใน roster.gs |
| `STAFF_KEY` | รหัสลิงก์เข้าใช้งาน |
| `ADMIN_PASSWORD` | รหัสการเงิน/ค่าครู (mmmm2026) |

## Panels
- ✅ Dashboard — นับนักเรียนต่อคอร์ส×วิชา + สรุป On-site/Zoom
- 🚧 นักเรียนทั้งหมด / ส่ง text / ตารางเรียน / คอร์สออนไลน์ (กำลังย้าย)
