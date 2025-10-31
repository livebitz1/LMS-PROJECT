import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const students = await prisma.user.findMany({
      where: {
        teacherProfile: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = students.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));

    return NextResponse.json({ students: mapped });
  } catch (err) {
    console.error('/api/admin/students GET error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
