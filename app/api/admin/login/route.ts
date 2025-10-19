import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body || {};

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 });

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // set httpOnly cookie for admin session
    const cookie = `lms_admin_auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`; // 7 days
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
