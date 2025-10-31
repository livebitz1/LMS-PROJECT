import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Find user and teacher profile
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const profileRaw = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    const profile = profileRaw as unknown as { id: string; userId: string; displayName?: string | null; subjects?: unknown; contact?: string | null; resumeUrl?: string | null; idCardUrl?: string | null; degreeProofUrl?: string | null } | null;
    if (!profile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    // Check required profile fields and uploaded docs
    const missing: string[] = [];
    if (!profile.displayName && !user.name) missing.push('displayName');
    if (!profile.subjects || (Array.isArray(profile.subjects) && profile.subjects.length === 0)) missing.push('subjects');
    if (!profile.contact) missing.push('contact');

    if (!profile.resumeUrl) missing.push('resume');
    if (!profile.idCardUrl) missing.push('idCard');
    if (!profile.degreeProofUrl) missing.push('degreeProof');

    if (missing.length > 0) return NextResponse.json({ error: 'Missing required fields or documents', missing }, { status: 400 });

    // update doc status to PENDING using Prisma type to satisfy linting
    const updated = await prisma.teacherProfile.update({ where: { id: profile.id }, data: { docsStatus: 'PENDING' } as Prisma.TeacherProfileUpdateInput });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (err) {
    console.error('/api/teacher/submit error', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
