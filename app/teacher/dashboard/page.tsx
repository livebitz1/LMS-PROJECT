import React from 'react'
import { getAuth } from '@clerk/nextjs/server'
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import TeacherProfileEditor from './TeacherProfileEditor'
import Navbar from '../../components/Navbar'
import { redirect } from 'next/navigation'
import type { TeacherProfile } from '@prisma/client';
import Image from 'next/image';

export const metadata = {
  title: 'Teacher Dashboard',
}

export default async function TeacherDashboardPage() {
  // Build a server-side NextRequest using current headers so Clerk can read auth
  const rawHeaders = await headers();
  const headerObj = Object.fromEntries(Array.from(rawHeaders)) as Record<string, string>;
  const req = new NextRequest('https://placeholder.local', { headers: headerObj });
  const { userId } = getAuth(req);
  if (!userId) {
    // not signed in
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  if (!user || String(user.role || '').toLowerCase() !== 'teacher') {
    // not a teacher — redirect to home or show unauthorized
    redirect('/')
  }

  // fetch teacher profile if exists (use delegate if available, otherwise raw SQL fallback)
  let teacherProfile: TeacherProfile | null = null;
  const tp = (prisma as unknown as { teacherProfile?: { findUnique?: (args: { where: { userId: string } }) => Promise<TeacherProfile | null> } }).teacherProfile;
  if (tp && typeof tp.findUnique === 'function') {
    teacherProfile = await tp.findUnique({ where: { userId: user.id } });
  } else {
    const rows: TeacherProfile[] = await prisma.$queryRaw`SELECT id, "userId", "displayName", bio, degree, "experienceYears", "hourlyRate", subjects, skills, linkedin, "createdAt", "updatedAt" FROM "TeacherProfile" WHERE "userId" = ${user.id} LIMIT 1`;
    teacherProfile = rows?.[0] ?? null;
  }

  // fetch teacher bookings for this teacher (limit to 3 most recent)
  const bookings: Array<{
    id: string;
    studentName: string;
    message?: string | null;
    createdAt: Date;
    student?: { profileImageUrl?: string | null; name?: string | null };
  }> = await prisma.teacherBooking.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { student: { select: { profileImageUrl: true, name: true } } },
  });

  const userSerialized = {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    role: user.role ?? null,
    createdAt: user.createdAt.toISOString(),
  }

  const profileSerialized = teacherProfile
    ? {
        ...teacherProfile,
        subjects: Array.isArray(teacherProfile.subjects)
          ? teacherProfile.subjects.filter((s): s is string => typeof s === 'string')
          : typeof teacherProfile.subjects === 'string'
            ? teacherProfile.subjects.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        skills: Array.isArray(teacherProfile.skills)
          ? teacherProfile.skills.filter((s): s is string => typeof s === 'string')
          : typeof teacherProfile.skills === 'string'
            ? teacherProfile.skills.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        createdAt: teacherProfile.createdAt ? teacherProfile.createdAt.toISOString() : '',
        updatedAt: teacherProfile.updatedAt ? teacherProfile.updatedAt.toISOString() : '',
      }
    : null

  // derive public display name safely (avoid mixing ?? and || without parentheses)
  const fallbackName = (userSerialized.name ?? `${userSerialized.firstName ?? ''} ${userSerialized.lastName ?? ''}`.trim()) || userSerialized.email;
  const publicDisplayName = profileSerialized?.displayName ?? fallbackName;
  const accountName = fallbackName; // registered account name (read-only)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your professional profile — this section is only for teachers.</p>

        {/* Show recent bookings */}
        {bookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Recent Bookings</h2>
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="border border-emerald-100 rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    {/* Use next/image for optimized images */}
                    <Image
                      src={b.student?.profileImageUrl || '/default-avatar.png'}
                      alt={b.student?.name || 'Student'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border border-emerald-200 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{b.studentName}</div>
                    {/* Removed student email from card display */}
                    {b.message && <div className="text-sm text-slate-700 mb-1">Message: {b.message}</div>}
                    <div className="text-xs text-slate-400">Booked on {new Date(b.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Helpful account/display name info so teachers know their current public display name */}
        <div className="mb-6">
          <div className="text-sm text-slate-600 mb-2">
            <span className="font-medium">Account name:</span>{' '}
            <span className="text-slate-800">{accountName}</span>
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-medium">Public display name:</span>{' '}
            <span className="text-slate-800">{publicDisplayName}</span>
            <div className="text-xs text-slate-400">(shown on Mentors and public profile)</div>
          </div>
        </div>

        {/* Pass serialized user and profile to the client editor component */}
        <TeacherProfileEditor user={userSerialized} profile={profileSerialized ?? undefined} />
      </main>
    </>
  )
}
