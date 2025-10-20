import React from 'react'
import { prisma } from '../../../lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TeacherProfileClient from './TeacherProfileClient'

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

  // serialize profile for client component
  const profileSerialized = {
    id: profile.id,
    userId: profile.userId,
    bio: profile.bio ?? null,
    degree: profile.degree ?? null,
    experienceYears: profile.experienceYears ?? null,
    subjects: profile.subjects ?? null,
    skills: profile.skills ?? null,
    linkedin: profile.linkedin ?? null,
    profileImageUrl: profile.profileImageUrl ?? null,
    createdAt: profile.createdAt ? (typeof profile.createdAt === 'string' ? profile.createdAt : profile.createdAt.toISOString()) : null,
    updatedAt: profile.updatedAt ? (typeof profile.updatedAt === 'string' ? profile.updatedAt : profile.updatedAt.toISOString()) : null,
    user: {
      id: profile.user?.id,
      clerkId: profile.user?.clerkId,
      email: profile.user?.email,
      name: profile.user?.name ?? null,
      firstName: profile.user?.firstName ?? null,
      lastName: profile.user?.lastName ?? null,
      profileImageUrl: profile.user?.profileImageUrl ?? null,
    },
  };

  return (
    <TeacherProfileClient profile={profileSerialized} />
  )
}
