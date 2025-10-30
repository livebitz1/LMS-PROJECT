"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type ProfileSerialized = {
  id: string;
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  degree?: string | null;
  experienceYears?: number | null;
  subjects?: string[];
  linkedin?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  hourlyRate?: number | null;
  user?: {
    id: string;
    clerkId: string;
    email: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export default function TeacherProfileClient({ profile }: { profile: ProfileSerialized }) {
  const name = profile.displayName || profile.user?.name || `${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`.trim() || profile.user?.email;

  return (
    <main className="max-w-4xl mx-auto px-6 pt-28 md:pt-24 pb-12">
      <div className="mb-6">
        <Link href="/mentors" className="text-sm text-emerald-600 underline">&larr; Back to Mentors</Link>
      </div>

      <Card className="overflow-visible shadow-lg">
        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-6 rounded-t-lg">
          <div className="flex items-center gap-6">
            <Avatar>
              <AvatarImage src={profile.profileImageUrl || `/api/teacher/avatar/${profile.user?.clerkId}`} alt={name} />
              <AvatarFallback>{(name?.[0] || 'U').toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{name}</h1>
              {typeof profile.hourlyRate === 'number' && profile.hourlyRate >= 0 && (
                <div className="text-base font-semibold text-emerald-700 mt-1">
                  Hourly Rate: ${profile.hourlyRate}/hr
                </div>
              )}
              <p className="text-sm text-slate-600 mt-1">{profile.degree ?? ''} {profile.experienceYears ? `• ${profile.experienceYears} yrs` : ''}</p>
              <div className="mt-3 flex items-center gap-3">
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M16 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" stroke="#065f46" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}

                <a href={`mailto:${profile.user?.email}`} className="text-sm text-slate-500">Contact</a>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <Button variant="default" size="sm" className="rounded-full">Message</Button>
              <span className="text-xs text-slate-400">Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {profile.bio && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Subjects</h4>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(profile.subjects) && profile.subjects.length > 0 ? (
                  profile.subjects.map((s: string, i: number) => (
                    <span key={`sub-${i}`} className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">{s}</span>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No subjects listed</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Credentials</h4>
              <div className="text-sm text-slate-700">{profile.degree ?? '—'}</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6">
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-slate-600">Last updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : '—'}</div>
            <div className="flex items-center gap-3">
              <Link href="/mentors" className="text-sm text-slate-500 hover:underline">Back</Link>
            </div>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
