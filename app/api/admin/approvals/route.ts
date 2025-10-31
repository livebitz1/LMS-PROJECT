import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Use raw SQL to fetch pending, verified and removed profiles so cards remain visible to admin
    const rows = (await prisma.$queryRaw`
      SELECT tp.id, tp."userId", tp."profileImageUrl", tp."createdAt", tp."updatedAt", tp."resumeUrl", tp."idCardUrl", tp."degreeProofUrl", tp."docsStatus", tp.bio, tp.degree, tp."experienceYears", tp.subjects, tp."displayName", tp."hourlyRate",
             u.id as "user_id", u.email, u.name, u."firstName", u."lastName", u."profileImageUrl" as "userProfileImageUrl", u."createdAt" as "userCreatedAt"
      FROM "TeacherProfile" tp
      JOIN "User" u ON tp."userId" = u.id
      WHERE tp."docsStatus" IN ('PENDING', 'VERIFIED', 'REMOVED')
      ORDER BY tp."createdAt" DESC
    `) as unknown[];

    const mapped = (rows || []).map((r) => {
      const row = r as {
        id: string;
        userId: string;
        profileImageUrl: string | null;
        createdAt: string | Date;
        updatedAt: string | Date;
        resumeUrl: string | null;
        idCardUrl: string | null;
        degreeProofUrl: string | null;
        docsStatus: string | null;
        bio: string | null;
        degree: string | null;
        experienceYears: number | null;
        subjects: unknown;
        displayName: string | null;
        hourlyRate: number | null;
        user_id: string;
        email: string;
        name: string | null;
        firstName: string | null;
        lastName: string | null;
        userProfileImageUrl: string | null;
        userCreatedAt: string | Date;
      };

      return {
        id: row.id,
        userId: row.userId,
        profileImageUrl: row.profileImageUrl ?? null,
        resumeUrl: row.resumeUrl ?? null,
        idCardUrl: row.idCardUrl ?? null,
        degreeProofUrl: row.degreeProofUrl ?? null,
        docsStatus: row.docsStatus ?? null,
        bio: row.bio ?? null,
        degree: row.degree ?? null,
        experienceYears: row.experienceYears ?? null,
        subjects: row.subjects ?? null,
        displayName: row.displayName ?? null,
        hourlyRate: row.hourlyRate ?? null,
        createdAt: row.createdAt ?? '',
        updatedAt: row.updatedAt ?? '',
        user: {
          id: row.userId,
          email: row.email ?? '',
          name: row.name ?? '',
          firstName: row.firstName ?? '',
          lastName: row.lastName ?? '',
          profileImageUrl: row.userProfileImageUrl ?? null,
          createdAt: row.userCreatedAt ?? '',
        },
      };
    });

    return NextResponse.json({ pending: mapped });
  } catch (err) {
    console.error('/api/admin/approvals GET error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
