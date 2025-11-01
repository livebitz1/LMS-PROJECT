import React from 'react'
import { prisma } from '../../lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button";
import MentorsClient from './MentorsClient'
import Navbar from '../components/Navbar'
import type { Profile } from './MentorsClient';

export const metadata = { title: 'Mentors' }
export const dynamic = 'force-dynamic';

export default async function MentorsPage() {
  // fetch all teacher profiles joined with user
  let profiles: Profile[] = [];

  try {
    const tpUnknown = (prisma as unknown as { teacherProfile?: unknown }).teacherProfile;
    const tp = tpUnknown as { findMany?: (args: { where?: unknown; include: { user: true }, orderBy: { createdAt: 'desc' } }) => Promise<Profile[]> } | undefined;

    // Only fetch profiles that have been approved by admin (docsStatus = 'VERIFIED')
    if (tp && typeof tp.findMany === 'function') {
      profiles = await tp.findMany({ where: { docsStatus: 'VERIFIED' }, include: { user: true }, orderBy: { createdAt: 'desc' } });
      profiles = profiles.map((p) => {
        const subjects = p.subjects;
        const parsedSubjects = Array.isArray(subjects)
          ? subjects.filter((s: unknown): s is string => typeof s === 'string')
          : (typeof subjects === 'string' ? (subjects as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []);
        return { ...p, subjects: parsedSubjects };
      });
    } else {
      // fallback to raw SQL join if Prisma delegate isn't available (robust for mismatched client)
      const rows = (await prisma.$queryRaw`SELECT tp.id, tp."userId", tp."displayName", tp."hourlyRate", tp.bio, tp.degree, tp."experienceYears", tp.subjects, tp.linkedin, tp."profileImageUrl", tp."createdAt", tp."updatedAt",
               u."clerkId", u.email, u.name, u."firstName", u."lastName", u."profileImageUrl" as "userProfileImageUrl", u.role as "userRole", u."createdAt" as "userCreatedAt"
        FROM "TeacherProfile" tp
        JOIN "User" u ON tp."userId" = u.id
        WHERE tp."docsStatus" = 'VERIFIED'
        ORDER BY tp."createdAt" DESC
      `) as unknown[];
      profiles = (rows || []).map((r): Profile => {
        const row = r as {
          id: string;
          userId: string;
          displayName: string | null;
          hourlyRate: number | null;
          bio: string | null;
          degree: string | null;
          experienceYears: number | null;
          subjects: unknown;
          linkedin: string | null;
          profileImageUrl: string | null;
          createdAt: string | Date;
          updatedAt: string | Date;
          clerkId: string;
          email: string;
          name: string | null;
          firstName: string | null;
          lastName: string | null;
          userProfileImageUrl: string | null;
          userRole: string | null;
          userCreatedAt: string | Date;
        };
        return {
          id: row.id,
          userId: row.userId,
          displayName: row.displayName ?? null,
          hourlyRate: row.hourlyRate ?? null,
          bio: row.bio ?? '',
          degree: row.degree ?? '',
          experienceYears: row.experienceYears ?? null,
          subjects: Array.isArray(row.subjects)
            ? row.subjects.filter((s: unknown): s is string => typeof s === 'string')
            : typeof row.subjects === 'string'
              ? (row.subjects as string).split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
          linkedin: row.linkedin ?? null,
          profileImageUrl: row.profileImageUrl ?? null,
          createdAt: row.createdAt ?? '',
          updatedAt: row.updatedAt ?? '',
          user: {
            id: row.userId,
            clerkId: row.clerkId ?? '',
            email: row.email ?? '',
            name: row.name ?? '',
            firstName: row.firstName ?? '',
            lastName: row.lastName ?? '',
            profileImageUrl: row.userProfileImageUrl ?? null,
            role: row.userRole ?? '',
            createdAt: row.userCreatedAt ?? '',
          },
        };
      }) as Profile[];
    }
  } catch (err) {
    // If Prisma cannot connect (build/time or runtime), log the error and continue with an empty list
    // This prevents the entire page from crashing when the DATABASE is unreachable.
    // In production you might surface a friendly message or fallback to client-side fetching.
    console.error('MentorsPage: failed to fetch teacher profiles, falling back to empty list', err);
    profiles = [];
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-100/40 min-h-[100vh] rounded-3xl shadow-xl">
        <section className="mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight leading-snug text-emerald-900 mb-2 drop-shadow-sm">Mentors</h1>
              <p className="text-base text-slate-600 mt-1 max-w-xl">Browse teacher profiles — friendly, playful, and easy to connect with. Use the filters to find your perfect mentor.</p>
            </div>
          </div>
        </section>
        <section>
          <MentorsClient profiles={profiles} />
        </section>
      </main>
    </>
  )
}
