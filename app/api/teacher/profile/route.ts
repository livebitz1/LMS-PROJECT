import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await req.json();
    const { firstName, lastName, bio, degree, experienceYears, subjects, linkedin, skills } = body || {};

    // Resolve internal user id from clerkId
    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId = user.id;

    // Update basic user fields (by internal id)
    const userUpdateData: any = {};
    if (firstName !== undefined) userUpdateData.firstName = firstName || null;
    if (lastName !== undefined) userUpdateData.lastName = lastName || null;
    if (firstName || lastName) {
      userUpdateData.name = `${firstName ?? ''} ${lastName ?? ''}`.trim() || undefined;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: userUpdateData });
    }

    // Prepare profile payload
    const profileData: any = {
      bio: bio ?? null,
      degree: degree ?? null,
      experienceYears: experienceYears ?? null,
      subjects: Array.isArray(subjects) ? subjects : subjects ? [subjects].flat() : null,
      skills: Array.isArray(skills) ? skills : skills ? [skills].flat() : null,
      linkedin: linkedin ?? null,
    };

    // Upsert teacher profile using internal user id
    let profile: any = null;
    const tp = (prisma as any).teacherProfile;
    if (tp && typeof tp.upsert === 'function') {
      profile = await tp.upsert({
        where: { userId },
        update: profileData,
        create: {
          userId,
          ...profileData,
        },
      });
    } else {
      // Fallback: raw SQL upsert (select -> update or insert) to support runtime environments
      const subjectsJson = profileData.subjects ? JSON.stringify(profileData.subjects) : null;
      const skillsJson = profileData.skills ? JSON.stringify(profileData.skills) : null;

      // Check existing
      const existing: any = await prisma.$queryRaw`SELECT * FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`;
      if (existing && existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE "TeacherProfile" SET
            bio = ${profileData.bio},
            degree = ${profileData.degree},
            "experienceYears" = ${profileData.experienceYears},
            subjects = ${subjectsJson}::jsonb,
            skills = ${skillsJson}::jsonb,
            linkedin = ${profileData.linkedin},
            "updatedAt" = now()
          WHERE "userId" = ${userId}
        `;
        const rows: any = await prisma.$queryRaw`SELECT * FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`;
        profile = rows[0] ?? null;
      } else {
        const newId = randomUUID();
        await prisma.$executeRaw`
          INSERT INTO "TeacherProfile" (id, "userId", bio, degree, "experienceYears", subjects, skills, linkedin, "createdAt", "updatedAt")
          VALUES (${newId}, ${userId}, ${profileData.bio}, ${profileData.degree}, ${profileData.experienceYears}, ${subjectsJson}::jsonb, ${skillsJson}::jsonb, ${profileData.linkedin}, now(), now())
        `;
        const rows: any = await prisma.$queryRaw`SELECT * FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`;
        profile = rows[0] ?? null;
      }
    }

    return NextResponse.json({ ok: true, profile });
  } catch (err: any) {
    console.error('API /api/teacher/profile error', err);
    return NextResponse.json({ error: 'Server error', details: String(err?.message ?? err) }, { status: 500 });
  }
}
