import React from 'react'
import { prisma } from '../../../lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TeacherProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  // Attempt to use the Prisma delegate when available; otherwise use a raw SQL fallback
  let profile: any = null;
  const tp = (prisma as any).teacherProfile;
  if (tp && typeof tp.findUnique === 'function') {
    profile = await tp.findUnique({ where: { userId }, include: { user: true } });
  } else {
    const rows: any = await prisma.$queryRaw`
      SELECT tp.*, u.id AS "userId", u."clerkId", u.email, u.name, u."firstName", u."lastName", u."profileImageUrl" AS "userProfileImageUrl", u.role AS "userRole", u."createdAt" AS "userCreatedAt"
      FROM "TeacherProfile" tp
      JOIN "User" u ON tp."userId" = u.id
      WHERE tp."userId" = ${userId}
      LIMIT 1
    `;
    const row = rows?.[0] ?? null;
    if (row) {
      profile = {
        id: row.id,
        userId: row.userId,
        bio: row.bio,
        degree: row.degree,
        experienceYears: row.experienceYears,
        subjects: row.subjects,
        skills: row.skills,
        linkedin: row.linkedin,
        profileImageUrl: row.profileImageUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.userId,
          clerkId: row.clerkId,
          email: row.email,
          name: row.name,
          firstName: row.firstName,
          lastName: row.lastName,
          profileImageUrl: row.userProfileImageUrl || row.profileImageUrl || null,
          role: row.userRole,
          createdAt: row.userCreatedAt,
        },
      };
    }
  }

  if (!profile) return notFound();

  const name = profile.user.name || `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim() || profile.user.email;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-6">
        <Link href="/mentors" className="text-sm text-emerald-600 underline">&larr; Back to Mentors</Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-6">
          <img src={profile.profileImageUrl || `/api/teacher/avatar/${profile.user.clerkId}`} alt={name} className="w-24 h-24 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-semibold">{name}</h1>
            <p className="text-sm text-slate-600">{profile.degree ?? ''} {profile.experienceYears ? `• ${profile.experienceYears} yrs` : ''}</p>
            {profile.linkedin && <p className="mt-1"><a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-emerald-600 underline">LinkedIn</a></p>}
          </div>
        </div>

        {profile.bio && <p className="mt-6 text-sm text-slate-700">{profile.bio}</p>}

        {Array.isArray(profile.skills) && profile.skills.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: any, i: number) => (
                <span key={`${String(s)}-${i}`} className="inline-block bg-emerald-50 text-emerald-800 px-2 py-1 rounded-full text-xs">{typeof s === 'string' ? s : String(s)}</span>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(profile.subjects) && profile.subjects.length > 0 && (
          <div className="mt-4 text-sm text-slate-600">Subjects: {profile.subjects.map((s:any)=> typeof s === 'string' ? s : String(s)).join(', ')}</div>
        )}

        <div className="mt-6 text-xs text-slate-400">Member since {new Date(profile.createdAt).toLocaleDateString()}</div>
      </div>
    </main>
  )
}
