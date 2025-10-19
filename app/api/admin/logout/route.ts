import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // clear the admin cookie
  const cookie = `lms_admin_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  res.headers.set('Set-Cookie', cookie);
  return res;
}
