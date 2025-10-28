import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { randomUUID } from 'crypto';

// Helper: simple LinkedIn URL validator
function isValidLinkedIn(url?: string | null) {
  if (!url) return true; // empty is allowed
  try {
    const u = new URL(String(url));
    const host = u.hostname.toLowerCase();
    return host === 'linkedin.com' || host.endsWith('.linkedin.com') || host.includes('linkedin.com');
  } catch {
    return false;
  }
}

// Helper type for TeacherProfile row (for raw SQL)
type TeacherProfileRow = {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  degree: string | null;
  experienceYears: number | null;
  hourlyRate: number | null;
  subjects: string | null; // JSON string
  linkedin: string | null;
  contact: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await req.json();
    const { firstName, lastName, displayName, bio, degree, experienceYears, subjects, linkedin, hourlyRate, contact } = body || {};

    // Trim inputs and normalize
    const tFirstName = typeof firstName === 'string' ? firstName.trim() : undefined;
    const tLastName = typeof lastName === 'string' ? lastName.trim() : undefined;
    const tDisplayName = typeof displayName === 'string' ? displayName.trim() : (displayName == null ? undefined : String(displayName).trim());
    const tBio = typeof bio === 'string' ? bio.trim() : (bio == null ? undefined : String(bio).trim());
    const tDegree = typeof degree === 'string' ? degree.trim() : (degree == null ? undefined : String(degree).trim());
    const tLinkedin = typeof linkedin === 'string' ? linkedin.trim() : (linkedin == null ? undefined : String(linkedin).trim());
    const tContact = typeof contact === 'string' ? contact.trim() : (contact == null ? undefined : String(contact).trim());
    const tHourly = (hourlyRate === undefined || hourlyRate === null) ? null : Number(hourlyRate);

    // Normalize arrays: trim entries and remove empties
    const normalizeList = (val: unknown): string[] | null => {
      if (Array.isArray(val)) return val.map((s: unknown) => String(s).trim()).filter(Boolean);
      if (val == null) return null;
      try {
        if (typeof val === 'string') return val.split(',').map(s=>s.trim()).filter(Boolean);
        return [String(val).trim()].filter(Boolean);
      } catch {
        return null;
      }
    };

    const tSubjects = normalizeList(subjects);

    // Validate lengths
    if (tDisplayName && tDisplayName.length > 100) {
      return NextResponse.json({ error: 'Validation failed', details: 'displayName must be 100 characters or fewer' }, { status: 400 });
    }
    if (tBio && tBio.length > 2000) {
      return NextResponse.json({ error: 'Validation failed', details: 'bio must be 2000 characters or fewer' }, { status: 400 });
    }

    // Validate LinkedIn URL if provided
    if (tLinkedin && !isValidLinkedIn(tLinkedin)) {
      return NextResponse.json({ error: 'Validation failed', details: 'linkedin must be a valid LinkedIn URL' }, { status: 400 });
    }

    // Contact is required (phone number or similar). Basic validation: non-empty and reasonable length
    if (!tContact) {
      return NextResponse.json({ error: 'Validation failed', details: 'contact is required' }, { status: 400 });
    }
    if (typeof tContact === 'string' && (tContact.length < 6 || tContact.length > 60)) {
      return NextResponse.json({ error: 'Validation failed', details: 'contact looks invalid' }, { status: 400 });
    }

    // Resolve internal user id from clerkId
    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId = user.id;

    // Update basic user fields (by internal id) - keep these as optional
    const userUpdateData: Record<string, unknown> = {};
    if (tFirstName !== undefined) userUpdateData.firstName = tFirstName || null;
    if (tLastName !== undefined) userUpdateData.lastName = tLastName || null;
    if (tFirstName || tLastName) {
      userUpdateData.name = `${tFirstName ?? ''} ${tLastName ?? ''}`.trim() || undefined;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: userUpdateData });
    }

    // Prepare profile payload, include displayName (prefer explicit displayName, otherwise derive from first/last)
    const computedDisplayName = (typeof tDisplayName === 'string' && tDisplayName.trim()) ? tDisplayName.trim() : ((tFirstName || tLastName) ? `${tFirstName ?? ''} ${tLastName ?? ''}`.trim() : null);

    const profileData: Record<string, unknown> = {
      displayName: computedDisplayName ?? null,
      bio: tBio ?? null,
      degree: tDegree ?? null,
      contact: tContact ?? null,
      experienceYears: experienceYears ?? null,
      hourlyRate: tHourly,
      subjects: tSubjects,
      linkedin: tLinkedin ?? null,
    };

    // Try using the generated Prisma upsert if available; if it fails (e.g. runtime client mismatch), fall back to raw SQL.
    let profile: TeacherProfileRow | null = null;
    const tp = (prisma as unknown as { teacherProfile?: { upsert?: (args: unknown) => Promise<TeacherProfileRow | null> } }).teacherProfile;
    if (tp && typeof tp.upsert === 'function') {
      try {
        // Attempt generated upsert (may throw if client does not recognize new fields yet)
        profile = await tp.upsert({
          where: { userId },
          update: profileData,
          create: {
            userId,
            ...profileData,
          },
        });
      } catch (upsertErr) {
        console.warn('Prisma upsert failed, falling back to raw SQL upsert:', (upsertErr as Error)?.message ?? upsertErr);
        profile = null; // ensure we use raw SQL fallback below
      }
    }

    if (!profile) {
      // Fallback: raw SQL upsert (select -> update or insert) to support runtime environments
      const subjectsJson = profileData.subjects ? JSON.stringify(profileData.subjects) : null;

      // Check existing
      const existing: TeacherProfileRow[] = await prisma.$queryRaw`SELECT id, "userId", "displayName", bio, degree, "experienceYears", "hourlyRate", subjects, linkedin, contact, "createdAt", "updatedAt" FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`;
      if (existing && existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE "TeacherProfile" SET
            "displayName" = ${profileData.displayName},
            bio = ${profileData.bio},
            degree = ${profileData.degree},
            "experienceYears" = ${profileData.experienceYears},
            "hourlyRate" = ${profileData.hourlyRate},
            subjects = ${subjectsJson}::jsonb,
            linkedin = ${profileData.linkedin},
            contact = ${profileData.contact},
            "updatedAt" = now()
          WHERE "userId" = ${userId}
        `;
        const rows: TeacherProfileRow[] = await prisma.$queryRaw`SELECT id, "userId", "displayName", bio, degree, "experienceYears", "hourlyRate", subjects, linkedin, contact, "createdAt", "updatedAt" FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`;
        profile = rows[0] ?? null;
      } else {
        const newId = randomUUID();
        await prisma.$executeRaw`
          INSERT INTO "TeacherProfile" (id, "userId", "displayName", bio, degree, "experienceYears", "hourlyRate", subjects, linkedin, contact, "createdAt", "updatedAt")
          VALUES (${newId}, ${userId}, ${profileData.displayName}, ${profileData.bio}, ${profileData.degree}, ${profileData.experienceYears}, ${profileData.hourlyRate}, ${subjectsJson}::jsonb, ${profileData.linkedin}, ${profileData.contact}, now(), now())
        `;
        const rows: TeacherProfileRow[] = await prisma.$queryRaw`SELECT id, "userId", "displayName", bio, degree, "experienceYears", "hourlyRate", subjects, linkedin, contact, "createdAt", "updatedAt" FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`;
        profile = rows[0] ?? null;
      }
    }

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error('API /api/teacher/profile error', err);
    return NextResponse.json({ error: 'Server error', details: String((err as Error)?.message ?? err) }, { status: 500 });
  }
}
