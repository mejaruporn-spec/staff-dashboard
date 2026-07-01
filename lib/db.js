import { neon } from '@neondatabase/serverless';

// Neon serverless HTTP client (เหมาะกับ Vercel functions) — ใช้ DB เดิมร่วมกับระบบห้องเรียน
export const sql = neon(process.env.DATABASE_URL);
