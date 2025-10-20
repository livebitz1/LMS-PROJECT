import React from 'react'
import { getAuth } from '@clerk/nextjs/server'
import { headers, cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from '../../../lib/prisma'
import TeacherProfileEditor from './TeacherProfileEditor'
import Navbar from '../../components/Navbar'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Teacher Dashboard',
}

export default async function TeacherDashboardPage() {
  // Build a server-side NextRequest using current headers so Clerk can read auth
  // headers() is a special Next.js API that must be awaited before iterating
  const rawHeaders = await headers();
  const headerObj = Object.fromEntries(Array.from(rawHeaders as any)) as Record<string, string>;
  const req = new NextRequest('https://placeholder.local', { headers: headerObj });
  const { userId } = getAuth(req as any);
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
  let teacherProfile: any = null;
  const tp = (prisma as any).teacherProfile;
  if (tp && typeof tp.findUnique === 'function') {
    teacherProfile = await tp.findUnique({ where: { userId: user.id } });
  } else {
    const rows: any = await prisma.$queryRaw`SELECT * FROM "TeacherProfile" WHERE "userId" = ${user.id} LIMIT 1`;
    teacherProfile = rows?.[0] ?? null;
  }

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
        subjects: teacherProfile.subjects ?? null,
        skills: teacherProfile.skills ?? null,
        linkedin: teacherProfile.linkedin ?? null,
        profileImageUrl: teacherProfile.profileImageUrl ?? null,
        createdAt: teacherProfile.createdAt ? (typeof teacherProfile.createdAt === 'string' ? new Date(teacherProfile.createdAt).toISOString() : teacherProfile.createdAt.toISOString()) : null,
        updatedAt: teacherProfile.updatedAt ? (typeof teacherProfile.updatedAt === 'string' ? new Date(teacherProfile.updatedAt).toISOString() : teacherProfile.updatedAt.toISOString()) : null,
      }
    : null

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your professional profile — this section is only for teachers.</p>

        {/* Pass serialized user and profile to the client editor component */}
        {/* Server -> Client prop passing of serializable data */}
        <TeacherProfileEditor user={userSerialized} profile={profileSerialized} />
      </main>
    </>
  )
}
