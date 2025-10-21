"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export type Profile = {
  id: string;
  userId: string;
  displayName?: string | null;
  hourlyRate?: number | null;
  bio?: string | null;
  degree?: string | null;
  experienceYears?: number | null;
  subjects?: string[] | null;
  skills?: string[] | null;
  linkedin?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  user?: {
    id: string;
    clerkId: string;
    email: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    role?: string | null;
    createdAt?: string | Date;
  };
};

export default function MentorsClient({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  // collect unique skills and subjects for suggestions
  const { skillsList, subjectsList } = useMemo(() => {
    const skillSet = new Set<string>();
    const subjectSet = new Set<string>();
    for (const p of profiles) {
      if (Array.isArray(p.skills)) p.skills.forEach((s: string) => { if (s) skillSet.add(String(s)); });
      if (Array.isArray(p.subjects)) p.subjects.forEach((s: string) => { if (s) subjectSet.add(String(s)); });
    }
    return { skillsList: Array.from(skillSet).sort(), subjectsList: Array.from(subjectSet).sort() };
  }, [profiles]);

  // filtered results
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const name = (p.displayName || p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}` || '').toLowerCase();
      const degree = String(p.degree ?? '').toLowerCase();
      const bio = String(p.bio ?? '').toLowerCase();
      const subjects = Array.isArray(p.subjects) ? p.subjects.map((s: string)=>String(s).toLowerCase()) : [];
      const skills = Array.isArray(p.skills) ? p.skills.map((s: string)=>String(s).toLowerCase()) : [];

      if (skillFilter && !skills.includes(skillFilter.toLowerCase())) return false;
      if (subjectFilter && !subjects.includes(subjectFilter.toLowerCase())) return false;

      if (!q) return true;

      // match name, degree, bio, subjects or skills
      if (name.includes(q) || degree.includes(q) || bio.includes(q)) return true;
      if (subjects.some((s) => s.includes(q))) return true;
      if (skills.some((s) => s.includes(q))) return true;
      return false;
    });
  }, [profiles, query, skillFilter, subjectFilter]);

  useEffect(() => {
    // reset page scroll to top on filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, skillFilter, subjectFilter]);

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="sm:col-span-2">
          <Input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Search by name, skill or niche — e.g. 'calculus', 'leadership'" className="rounded-full px-5 py-2 border-emerald-200 shadow-sm focus:ring-emerald-200" />
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <div className="flex gap-2 items-center overflow-auto">
            {skillsList.slice(0,8).map((s) => (
              <button
                key={s}
                className={`text-xs px-3 py-1 rounded-full border transition-all duration-150 ${skillFilter === s ? 'bg-emerald-700 text-white border-emerald-700 shadow' : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'}`}
                onClick={() => setSkillFilter(s)}
              >{s}</button>
            ))}
            {skillFilter && (
              <button className="text-xs bg-white border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full" onClick={() => setSkillFilter(null)}>Clear</button>
            )}
          </div>
        </div>
      </div>
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="text-sm text-slate-600">Filter by subject:</div>
        {subjectFilter ? (
          <Button variant="outline" size="sm" onClick={() => setSubjectFilter(null)} className="rounded-full border-emerald-200">Clear subject: {subjectFilter}</Button>
        ) : (
          subjectsList.slice(0,10).map((s) => (
            <button key={s} className="text-xs bg-white border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full hover:bg-emerald-50 transition" onClick={() => setSubjectFilter(s)}>{s}</button>
          ))
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((p) => {
          const skills = Array.isArray(p.skills) ? p.skills.map((s: string)=> typeof s === 'string' ? s : String(s)) : [];
          const subjects = Array.isArray(p.subjects) ? p.subjects.map((s: string)=> typeof s === 'string' ? s : String(s)) : [];
          const displayName = p.displayName || p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.user?.email;

          return (
            <Card key={p.id} className="border border-emerald-100 shadow-lg bg-white/90 rounded-3xl transition-transform sm:hover:-translate-y-2 sm:hover:shadow-2xl overflow-hidden">
              <CardHeader className="flex items-start gap-4 pb-2">
                <Avatar>
                  <AvatarImage src={p.profileImageUrl || (p.user?.clerkId ? `/api/teacher/avatar/${p.user.clerkId}` : undefined)} alt={displayName} />
                  <AvatarFallback>{(displayName?.[0] || 'U').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-slate-900 text-lg font-bold">{displayName}</CardTitle>
                      <CardDescription className="truncate text-xs text-slate-500">{p.degree ? `${p.degree}${p.experienceYears ? ` • ${p.experienceYears} yrs` : ''}` : (subjects.slice(0,2).join(', ') || '')}</CardDescription>
                    </div>
                    {subjects[0] && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 font-medium shadow-sm">{subjects[0]}</div>
                    )}
                  </div>
                  {typeof p.hourlyRate === 'number' && (
                    <div className="mt-1 text-xs text-emerald-700 font-semibold">Hourly: ${p.hourlyRate.toFixed(2)}</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {p.bio && <p className="text-xs text-slate-700 line-clamp-3 mb-2">{p.bio}</p>}
                {skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.slice(0,6).map((s: string,i:number) => (
                      <button
                        key={`${s}-${i}`}
                        className="inline-block bg-white border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs hover:bg-emerald-50 transition"
                        onClick={() => setSkillFilter(s)}
                      >{s}</button>
                    ))}
                    {skills.length > 6 && <span className="text-xs text-slate-400 px-2">+{skills.length - 6}</span>}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline">LinkedIn</a>}
                    <span className="text-xs text-slate-400">Joined {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <Link href={`/teacher/${p.userId}`} aria-label={`Open ${displayName} profile`} title={`View ${displayName} profile`}>
                    <Button variant="outline" size="sm" className="rounded-full px-3 py-1.5 flex items-center gap-2 bg-white hover:bg-emerald-50 transition border-emerald-200">
                      <span className="text-sm">View</span>
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
