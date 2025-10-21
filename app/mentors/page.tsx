import React from 'react'
import { prisma } from '../../lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MentorsClient from './MentorsClient'
import Navbar from '../components/Navbar'
import type { Profile } from './MentorsClient';

export const metadata = { title: 'Mentors' }

export default async function MentorsPage() {
  // fetch all teacher profiles joined with user
  let profiles: Profile[] = [];
  const tpUnknown = (prisma as unknown as { teacherProfile?: unknown }).teacherProfile;
  const tp = tpUnknown as { findMany?: (args: { include: { user: true }, orderBy: { createdAt: 'desc' } }) => Promise<Profile[]> } | undefined;
  if (tp && typeof tp.findMany === 'function') {
    profiles = await tp.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
    profiles = profiles.map((p) => ({
      ...p,
      subjects: Array.isArray(p.subjects)
        ? p.subjects.filter((s: unknown): s is string => typeof s === 'string')
        : typeof p.subjects === 'string'
          ? (p.subjects as string).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
      skills: Array.isArray(p.skills)
        ? p.skills.filter((s: unknown): s is string => typeof s === 'string')
        : typeof p.skills === 'string'
          ? (p.skills as string).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
    }));
  } else {
    // fallback to raw SQL join if Prisma delegate isn't available (robust for mismatched client)
    const rows = (await prisma.$queryRaw`SELECT tp.id, tp."userId", tp."displayName", tp."hourlyRate", tp.bio, tp.degree, tp."experienceYears", tp.subjects, tp.skills, tp.linkedin, tp."profileImageUrl", tp."createdAt", tp."updatedAt",
             u."clerkId", u.email, u.name, u."firstName", u."lastName", u."profileImageUrl" as "userProfileImageUrl", u.role as "userRole", u."createdAt" as "userCreatedAt"
      FROM "TeacherProfile" tp
      JOIN "User" u ON tp."userId" = u.id
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
        skills: unknown;
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
        skills: Array.isArray(row.skills)
          ? row.skills.filter((s: unknown): s is string => typeof s === 'string')
          : typeof row.skills === 'string'
            ? (row.skills as string).split(',').map((s: string) => s.trim()).filter(Boolean)
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

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-snug">Mentors</h1>
              <p className="text-sm text-slate-600 mt-1 max-w-md">Browse teacher profiles — friendly, doodly, and easy to connect with.</p>
            </div>
          </div>

          <div>
            <Link href="/teacher/dashboard">
              <Button variant="default" size="sm" className="rounded-xl shadow-[0_6px_0_rgba(6,95,70,0.12)]">✨ Claim your mentor profile</Button>
            </Link>
          </div>
        </div>

        <MentorsClient profiles={profiles} />
      </main>
    </>
  )
}
