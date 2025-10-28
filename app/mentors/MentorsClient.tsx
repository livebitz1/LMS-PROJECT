"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Heart } from 'lucide-react';

export type Profile = {
  id: string;
  userId: string;
  displayName?: string | null;
  hourlyRate?: number | null;
  bio?: string | null;
  degree?: string | null;
  experienceYears?: number | null;
  subjects?: string[] | null;
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
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null); // teacherId being booked
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userInfo, setUserInfo] = useState<any>(null);
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [favLoadingId, setFavLoadingId] = useState<string | null>(null);
  const bookingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users', { method: 'GET', credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        setUserRole(data?.user?.role ?? null);
        setUserInfo(data?.user ?? null);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const favRes = await fetch('/api/favorites', { credentials: 'same-origin' });
        if (!favRes.ok) return;
        const favData = await favRes.json();
        const map: Record<string, boolean> = {};
        (favData.favorites || []).forEach((f: { teacherId: string }) => { map[f.teacherId] = true; });
        setFavoritesMap(map);
      } catch {}
    })();
  }, []);

  // collect unique subjects for suggestions
  const { subjectsList } = useMemo(() => {
    const subjectSet = new Set<string>();
    for (const p of profiles) {
      if (Array.isArray(p.subjects)) p.subjects.forEach((s: string) => { if (s) subjectSet.add(String(s)); });
    }
    return { subjectsList: Array.from(subjectSet).sort() };
  }, [profiles]);

  // filtered results
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const name = (p.displayName || p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}` || '').toLowerCase();
      const degree = String(p.degree ?? '').toLowerCase();
      const bio = String(p.bio ?? '').toLowerCase();
      const subjects = Array.isArray(p.subjects) ? p.subjects.map((s: string)=>String(s).toLowerCase()) : [];

      if (subjectFilter && !subjects.includes(subjectFilter.toLowerCase())) return false;

      if (!q) return true;

      // match name, degree, bio, or subjects
      if (name.includes(q) || degree.includes(q) || bio.includes(q)) return true;
      if (subjects.some((s) => s.includes(q))) return true;
      return false;
    });
  }, [profiles, query, subjectFilter]);

  useEffect(() => {
    // reset page scroll to top on filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, subjectFilter]);

  // Helper for showing selected filters in the button
  const filterSummary = useMemo(() => {
    if (subjectFilter) return subjectFilter;
    return null;
  }, [subjectFilter]);

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="sm:col-span-2">
          <Input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Search by name or niche — e.g. 'calculus', 'leadership'" className="rounded-full px-5 py-2 border-emerald-200 shadow-sm focus:ring-emerald-200" />
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant={filterSummary ? 'default' : 'outline'} className={`rounded-full px-6 py-2 border-emerald-200 bg-white text-emerald-800 font-semibold shadow-sm flex items-center gap-2 ${filterSummary ? 'bg-emerald-700 text-white' : ''}`}>
                <span>Filter</span>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {filterSummary && <span className="ml-2 text-xs bg-white/20 rounded px-2 py-0.5">{filterSummary}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel>Filter by Subject</DropdownMenuLabel>
              {subjectsList.length === 0 && <DropdownMenuItem disabled>No subjects found</DropdownMenuItem>}
              {subjectsList.slice(0, 10).map((s) => (
                <DropdownMenuItem key={s} onSelect={() => { setSubjectFilter(s === subjectFilter ? null : s); }} className={subjectFilter === s ? 'bg-emerald-700 text-white' : ''}>
                  {s}
                  {subjectFilter === s && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { setSubjectFilter(null); }}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((p) => {
          const subjects = Array.isArray(p.subjects) ? p.subjects.map((s: string)=> typeof s === 'string' ? s : String(s)) : [];
          const displayName = p.displayName || p.user?.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.user?.email;

          return (
            <Card key={p.id} className="relative border border-emerald-100 shadow-lg bg-white/90 rounded-3xl transition-transform sm:hover:-translate-y-2 sm:hover:shadow-2xl overflow-hidden flex flex-col h-72 sm:h-80 md:h-96">
              <CardHeader className="relative flex items-start gap-4 pb-2">
                <Avatar>
                  <AvatarImage src={p.profileImageUrl || (p.user?.clerkId ? `/api/teacher/avatar/${p.user.clerkId}` : undefined)} alt={displayName} />
                  <AvatarFallback>{(displayName?.[0] || 'U').toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-slate-900 text-lg font-bold">{displayName}</CardTitle>
                      <CardDescription className="truncate text-xs text-slate-500">{p.degree ? `${p.degree}${p.experienceYears ? ` • ${p.experienceYears} yrs` : ''}` : (p.experienceYears ? `${p.experienceYears} yrs` : '')}</CardDescription>
                    </div>
                    {/* subject badge intentionally removed to keep header compact */}
                  </div>
                  {typeof p.hourlyRate === 'number' && (
                    <div className="mt-1 text-xs text-emerald-700 font-semibold">Hourly: ${p.hourlyRate.toFixed(2)}</div>
                  )}
                </div>

                {/* Favorite overlay button (top-right inside CardHeader) - visible to students only */}
                {userRole === 'student' && (
                  <button
                    aria-label={favoritesMap[p.userId] ? 'Remove favorite' : 'Add to favorites'}
                    title={favoritesMap[p.userId] ? 'Remove favorite' : 'Add to favorites'}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!userInfo) return;
                      setFavLoadingId(p.userId);
                      try {
                        if (favoritesMap[p.userId]) {
                          const res = await fetch(`/api/favorites?teacherId=${encodeURIComponent(p.userId)}`, { method: 'DELETE', credentials: 'same-origin' });
                          if (res.ok) {
                            setFavoritesMap((m) => { const nm = { ...m }; delete nm[p.userId]; return nm; });
                          }
                        } else {
                          const res = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ teacherId: p.userId }) });
                          if (res.ok) {
                            setFavoritesMap((m) => ({ ...m, [p.userId]: true }));
                          }
                        }
                      } catch (err) {
                        console.error('Favorite toggle error', err);
                      } finally {
                        setFavLoadingId(null);
                      }
                    }}
                    className={`absolute -top-3 right-3 inline-flex items-center justify-center w-10 h-10 rounded-full transition-transform focus:outline-none ${favoritesMap[p.userId] ? 'bg-white border border-emerald-100 shadow-sm' : 'bg-white text-emerald-700 border-emerald-100 hover:shadow-sm'} ${favLoadingId === p.userId ? 'pointer-events-none opacity-80' : ''}`}
                    style={{ zIndex: 20 }}
                    disabled={favLoadingId === p.userId}
                    aria-busy={favLoadingId === p.userId}
                  >
                    {/* Show sleek spinner while saving, otherwise heart icon (filled green when favorited) */}
                    {favLoadingId === p.userId ? (
                      <svg className="animate-spin w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    ) : (
                      favoritesMap[p.userId] ? (
                        <Heart className="w-5 h-5 text-emerald-600" fill="currentColor" />
                      ) : (
                        <Heart className="w-5 h-5 text-slate-700" fill="none" />
                      )
                    )}
                  </button>
                )}
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden">
                <div className="min-h-0 flex flex-col">
                  {p.bio && <p className="text-sm sm:text-xs text-slate-700 mb-3 line-clamp-3">{p.bio}</p>}

                  {/* Specializations / subjects responsive behavior:
                      - Small screens: horizontal scroll row so tags don't force tall cards
                      - Medium+ screens: vertical scroll inside the card content area
                  */}
                  {subjects.length > 0 && (
                    <>
                      {/* Mobile / small screens: horizontal scroll */}
                      <div className="md:hidden overflow-x-auto pb-2 -mx-2 px-2" aria-label="Specializations">
                        <div className="flex gap-2 w-max">
                          {subjects.slice(0, 12).map((s) => (
                            <span key={s} className="flex-shrink-0 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 font-medium shadow-sm">{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Desktop / larger screens: vertical scroll inside a constrained area */}
                      <div className="hidden md:block overflow-y-auto max-h-[7.5rem] pr-2 scrollbar-thin scrollbar-thumb-emerald-200" aria-label="Specializations">
                        <div className="flex flex-wrap gap-2">
                          {subjects.slice(0, 12).map((s) => (
                            <span key={s} className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 font-medium shadow-sm">{s}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 underline">LinkedIn</a>}
                    {/* Joined date removed as requested */}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/teacher/${p.userId}`} aria-label={`Open ${displayName} profile`} title={`View ${displayName} profile`}>
                      <Button variant="outline" size="sm" className="rounded-full px-3 py-1.5 flex items-center gap-2 bg-white hover:bg-emerald-50 transition border-emerald-200">
                        <span className="text-sm">View</span>
                        <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    </Link>

                    {/* Book button only for students */}
                    {userRole === 'student' && (
                      <Button
                        variant={bookingLoading === p.userId ? "secondary" : "default"}
                        size="sm"
                        className={`rounded-full px-3 py-1.5 flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition relative overflow-hidden ${bookingLoading === p.userId ? 'pointer-events-none' : ''}`}
                        onClick={async () => {
                          if (!userInfo) return;
                          setBookingLoading(p.userId);
                          try {
                            const res = await fetch('/api/teacher/book', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                teacherId: p.userId,
                                studentId: userInfo.id,
                                studentName: userInfo.name || userInfo.firstName || userInfo.email,
                                studentEmail: userInfo.email,
                                message: '', // can add a modal for message later
                              }),
                            });
                            if (!res.ok) throw new Error('Booking failed');
                          } catch {
                            alert('Booking failed. Please try again.');
                          }
                          setBookingLoading(null);
                          // Show minimal animation
                          if (bookingTimeoutRef.current) clearTimeout(bookingTimeoutRef.current);
                          const btn = document.getElementById(`book-btn-${p.userId}`);
                          if (btn) {
                            btn.classList.add('booked-success');
                            bookingTimeoutRef.current = setTimeout(() => {
                              btn.classList.remove('booked-success');
                            }, 1200);
                          }
                        }}
                        id={`book-btn-${p.userId}`}
                      >
                        {bookingLoading === p.userId ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Booking...
                          </>
                        ) : (
                          <>
                            <span className="text-sm">Book Now</span>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                              <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
