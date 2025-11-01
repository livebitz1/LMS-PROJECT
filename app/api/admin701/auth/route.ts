import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provided = String(body?.password ?? '');
    const expected = process.env.ADMIN_PASSWORD ?? '';

    if (!expected || provided !== expected) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
    }

    // Set a secure, HTTP-only cookie scoped to /admin701 for one hour
    const maxAge = 60 * 60; // 1 hour
    const cookie = `admin_auth=1; Path=/admin701; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;

    const res = NextResponse.json({ ok: true });
    res.headers.append('Set-Cookie', cookie);
    return res;
  } catch (err) {
    console.error('/api/admin701/auth error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
