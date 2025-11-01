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
import BookingItemClient from './BookingItemClient'

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
    const rows: TeacherProfile[] = await prisma.$queryRaw`SELECT id, "userId", "displayName", bio, degree, "experienceYears", "hourlyRate", subjects, linkedin, "createdAt", "updatedAt" FROM "TeacherProfile" WHERE "userId" = ${user.id} LIMIT 1`;
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
        id: teacherProfile.id,
        userId: teacherProfile.userId,
        displayName: teacherProfile.displayName ?? null,
        bio: teacherProfile.bio ?? null,
        degree: teacherProfile.degree ?? null,
        experienceYears: teacherProfile.experienceYears ?? null,
        subjects: Array.isArray(teacherProfile.subjects)
          ? teacherProfile.subjects.filter((s): s is string => typeof s === 'string')
          : typeof teacherProfile.subjects === 'string'
            ? teacherProfile.subjects.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        linkedin: teacherProfile.linkedin ?? null,
        profileImageUrl: teacherProfile.profileImageUrl ?? null,
        // document URLs and status for the client editor
        resumeUrl: (teacherProfile as unknown as { resumeUrl?: string | null }).resumeUrl ?? null,
        idCardUrl: (teacherProfile as unknown as { idCardUrl?: string | null }).idCardUrl ?? null,
        degreeProofUrl: (teacherProfile as unknown as { degreeProofUrl?: string | null }).degreeProofUrl ?? null,
        docsStatus: (teacherProfile as unknown as { docsStatus?: string | null }).docsStatus ?? null,
        hourlyRate: teacherProfile.hourlyRate ?? null,
        contact: (teacherProfile as unknown as { contact?: string | null }).contact ?? null,
        docsUploadAttempts: (teacherProfile as unknown as { docsUploadAttempts?: number | null }).docsUploadAttempts ?? 0,
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
      <main className="max-w-4xl mx-auto px-6 pt-28 md:pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-4">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your professional profile — this section is only for teachers.</p>

        {/* Show recent bookings */}
        {bookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Recent Bookings</h2>
            <div className="space-y-4">
              {bookings.map((b) => (
                <BookingItemClient key={b.id} id={b.id} studentName={b.studentName} message={b.message ?? undefined} createdAt={b.createdAt.toISOString()} student={b.student ?? undefined} />
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
