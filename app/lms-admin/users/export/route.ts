import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // only admin cookie check (simple shared cookie used elsewhere) — allow when cookie is present on server
    // But getAuth ensures user is authenticated via Clerk; admin uses different cookie; keep for parity.

    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

    // build CSV
    const header = ['clerkId', 'email', 'name', 'firstName', 'lastName', 'role', 'createdAt'];
    const rows = users.map(u => [u.clerkId, u.email, u.name ?? '', u.firstName ?? '', u.lastName ?? '', u.role ?? '', u.createdAt.toISOString()]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="lms-users.csv"',
      },
    });
  } catch (err) {
    console.error('/lms-admin/users/export error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
