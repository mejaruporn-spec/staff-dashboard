import { NextResponse } from 'next/server';

// ป้องกันทั้งแอปด้วย token ในลิงก์ (?key=...) → เซ็ต cookie ครั้งแรก ครั้งต่อไปไม่ต้องใส่
export function middleware(req) {
  const KEY = process.env.STAFF_KEY || '';
  const url = new URL(req.url);
  const qKey = url.searchParams.get('key');
  const cookieKey = req.cookies.get('staff_key')?.value;

  if (KEY && (qKey === KEY || cookieKey === KEY)) {
    const res = NextResponse.next();
    if (qKey === KEY) {
      res.cookies.set('staff_key', KEY, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60 });
    }
    return res;
  }

  return new NextResponse(
    '<html><head><meta charset="utf-8"><title>Access denied</title></head>' +
    '<body style="font-family:sans-serif;text-align:center;padding:60px;color:#991b1b">' +
    '<h2>🔒 ต้องเปิดผ่านลิงก์ที่มี key</h2><p>กรุณาใช้ลิงก์ที่ได้รับจากแอดมิน</p></body></html>',
    { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
