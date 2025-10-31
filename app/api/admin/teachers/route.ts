import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const teachers = await prisma.user.findMany({
      where: {
        teacherProfile: { isNot: null },
      },
      include: {
        teacherProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // map createdAt and updatedAt to ISO for client-side
    const mapped = teachers.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), teacherProfile: t.teacherProfile ? { ...t.teacherProfile, createdAt: t.teacherProfile.createdAt.toISOString(), updatedAt: t.teacherProfile.updatedAt.toISOString() } : null }));

    return NextResponse.json({ teachers: mapped });
  } catch (err) {
    console.error('/api/admin/teachers GET error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
