/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import serverEvents from '@/lib/events';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await req.json();
    const { profileId, action, reason } = body || {};
    if (!profileId || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    if (!['approve', 'reject', 'remove'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    let updated;

    try {
      if (action === 'remove') {
        // Mark profile as removed so it will not appear on mentors page
        updated = await prisma.teacherProfile.update({ where: { id: profileId }, data: { docsStatus: 'REMOVED' } as any });
      } else {
        const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
        updated = await prisma.teacherProfile.update({ where: { id: profileId }, data: { docsStatus: newStatus } as any });
      }
    } catch (prismaErr) {
      // If the record wasn't found, return 404 instead of 500 so the client can handle it gracefully
      if ((prismaErr as Prisma.PrismaClientKnownRequestError)?.code === 'P2025') {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
      }
      throw prismaErr;
    }

    // Emit a realtime event for other server-side listeners (and potential websocket handlers)
    serverEvents.emit('approval_changed', { profileId, action, by: userId, reason });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (err) {
    console.error('/api/admin/approvals/action POST error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
