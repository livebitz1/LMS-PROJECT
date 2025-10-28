import React from 'react'
import { prisma } from '../../../lib/prisma'
import { notFound } from 'next/navigation'
import TeacherProfileClient from './TeacherProfileClient'
import type { TeacherProfile, User } from '@prisma/client';

// Flexible server-side profile type to accommodate the new `contact` field and raw-SQL rows
type ServerProfile = Partial<TeacherProfile> & {
  id: string;
  userId: string;
  user: User;
  contact?: string | null;
};

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  // Attempt to use the Prisma delegate when available; otherwise use a raw SQL fallback
  let profile: ServerProfile | null = null;
  const tp = (prisma as { teacherProfile?: { findUnique?: (args: unknown) => Promise<TeacherProfile & { user: User } | null> } }).teacherProfile;
  if (tp && typeof tp.findUnique === 'function') {
    // cast to ServerProfile to allow optional contact
    profile = (await tp.findUnique({ where: { userId }, include: { user: true } })) as unknown as ServerProfile;
  } else {
    const rows: Array<TeacherProfile & { user: User } & {
      hourlyRate: number | null;
      displayName: string | null;
      subjects: unknown;
      user: User;
      userId: string;
      userProfileImageUrl: string | null;
      clerkId: string;
      email: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      contact: string | null;
    }> = await prisma.$queryRaw`
      SELECT tp.*, u.id AS "userId", u."clerkId", u.email, u.name, u."firstName", u."lastName", u."profileImageUrl" AS "userProfileImageUrl"
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
        displayName: row.displayName ?? null,
        bio: row.bio,
        degree: row.degree,
        contact: row.contact ?? null,
        experienceYears: row.experienceYears,
        subjects: row.subjects,
        linkedin: row.linkedin,
        profileImageUrl: row.profileImageUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        hourlyRate: row.hourlyRate ?? null,
        user: {
          id: row.userId,
          clerkId: row.clerkId,
          email: row.email,
          name: row.name,
          firstName: row.firstName,
          lastName: row.lastName,
          profileImageUrl: row.userProfileImageUrl,
          createdAt: row.createdAt,
          role: null,
        },
      };
    }
  }

  if (!profile) return notFound();

  // serialize profile for client component
  const profileSerialized = {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName ?? null,
    bio: profile.bio ?? null,
    degree: profile.degree ?? null,
    experienceYears: profile.experienceYears ?? null,
    subjects: Array.isArray(profile.subjects)
      ? profile.subjects.filter((s: unknown): s is string => typeof s === 'string')
      : typeof profile.subjects === 'string'
        ? (profile.subjects as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    linkedin: profile.linkedin ?? null,
    profileImageUrl: profile.profileImageUrl ?? null,
    createdAt: profile.createdAt ? (typeof profile.createdAt === 'string' ? profile.createdAt : profile.createdAt.toISOString()) : null,
    updatedAt: profile.updatedAt ? (typeof profile.updatedAt === 'string' ? profile.updatedAt : profile.updatedAt.toISOString()) : null,
    hourlyRate: profile.hourlyRate ?? null,
    contact: profile.contact ?? null,
    user: profile.user
      ? {
          id: profile.user.id,
          clerkId: profile.user.clerkId,
          email: profile.user.email,
          name: profile.user.name ?? null,
          firstName: profile.user.firstName ?? null,
          lastName: profile.user.lastName ?? null,
          profileImageUrl: profile.user.profileImageUrl ?? null,
        }
      : undefined,
  };

  return (
    <TeacherProfileClient profile={profileSerialized} />
  )
}
