import React from 'react'
import { prisma } from '../../lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MentorsClient from './MentorsClient'
import Navbar from '../components/Navbar'

export const metadata = { title: 'Mentors' }

export default async function MentorsPage() {
  // fetch all teacher profiles joined with user
  let profiles: any[] = [];
  const tp = (prisma as any).teacherProfile;
  if (tp && typeof tp.findMany === 'function') {
    profiles = await tp.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } });
  } else {
    // fallback to raw SQL join if Prisma delegate isn't available (robust for mismatched client)
    const rows: any = await prisma.$queryRaw`
      SELECT tp.*, u.id as "userId", u."clerkId", u.email, u.name, u."firstName", u."lastName", u."profileImageUrl" as "userProfileImageUrl", u.role as "userRole", u."createdAt" as "userCreatedAt"
      FROM "TeacherProfile" tp
      JOIN "User" u ON tp."userId" = u.id
      ORDER BY tp."createdAt" DESC
    `;

    profiles = (rows || []).map((r: any) => ({
      id: r.id,
      userId: r.userId,
      bio: r.bio,
      degree: r.degree,
      experienceYears: r.experienceYears,
      subjects: r.subjects,
      skills: r.skills,
      linkedin: r.linkedin,
      profileImageUrl: r.profileImageUrl,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.userId,
        clerkId: r.clerkId,
        email: r.email,
        name: r.name,
        firstName: r.firstName,
        lastName: r.lastName,
        profileImageUrl: r.userProfileImageUrl || r.profileImageUrl || null,
        role: r.userRole,
        createdAt: r.userCreatedAt,
      },
    }));
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
