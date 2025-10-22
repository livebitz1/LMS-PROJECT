import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Empty } from '@/components/ui/empty';
import { useRouter } from 'next/navigation';
import React, { useRef, useCallback } from 'react';

export type LearnerBooking = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherProfileImageUrl?: string | null;
  createdAt: string;
  message?: string | null;
};

export function LearnerBookings({ bookings }: { bookings: LearnerBooking[] }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = useCallback((amount: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  const handlePrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one 'page' (showing up to 3 cards) — use container width
    scrollByAmount(-el.clientWidth);
  };

  const handleNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    scrollByAmount(el.clientWidth);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-700">Your Booked Teachers</span>
            <Badge variant="outline" className="text-xs">{bookings.length}</Badge>
          </div>
          {bookings.length > 3 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous bookings"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-emerald-100 shadow-sm hover:shadow-md transition"
              >
                <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next bookings"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white border border-emerald-100 shadow-sm hover:shadow-md transition"
              >
                <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <Separator className="mt-2" />
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <Empty className="py-12 text-center text-slate-400">No bookings yet.</Empty>
        ) : (
          <div className="relative">
            {/* Horizontal scroll container showing up to 3 items at once. */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto py-2 px-1"
              style={{
                // hide vertical scrollbar gap on some browsers
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
              }}
            >
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex-shrink-0"
                  style={{
                    // Each card takes up roughly 33.333% of the container so three are visible
                    flex: '0 0 calc(33.333% - 1rem)',
                    minWidth: '260px',
                    maxWidth: '420px',
                  }}
                >
                  <Card className="border border-emerald-100 bg-white/80 shadow-sm hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <Avatar className="size-12">
                        <AvatarImage src={b.teacherProfileImageUrl || undefined} alt={b.teacherName || 'Teacher'} />
                        <AvatarFallback>{b.teacherName ? b.teacherName[0] : '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-base text-emerald-900">{b.teacherName}</div>
                        <Badge variant="secondary" className="text-xs">Teacher</Badge>
                        <button
                          type="button"
                          disabled={!b.teacherId}
                          onClick={() => b.teacherId && router.push(`/teacher/${b.teacherId}`)}
                          className={`inline-block mt-2 px-3 py-1 text-xs rounded bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 transition-colors${!b.teacherId ? ' opacity-50 cursor-not-allowed' : ''}`}
                          title={b.teacherId ? `View ${b.teacherName}'s profile` : 'Profile link unavailable'}
                        >
                          View Profile
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      {b.message && <div className="text-sm text-slate-700 mb-1">Message: <span className="font-medium text-emerald-700">{b.message}</span></div>}
                      <div className="text-xs text-slate-400">Booked on {new Date(b.createdAt).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
