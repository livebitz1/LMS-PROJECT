"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type FavoriteItem = {
  id: string;
  teacherId: string;
  createdAt?: string | Date | null;
  teacher?: {
    id?: string;
    name?: string | null;
    profileImageUrl?: string | null;
    displayName?: string | null;
  } | null;
};

type UserShape = { id: string; name?: string | null; firstName?: string | null; email?: string | null } | null;

export default function LearnerFavorites({ user }: { user: UserShape }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookLoading, setBookLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/favorites', { credentials: 'same-origin' });
        if (!res.ok) {
          setFavorites([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setFavorites(data.favorites ?? []);
      } catch (error) {
        console.error('Failed to load favorites', error);
        setFavorites([]);
      }
      setLoading(false);
    })();
  }, []);

  const handleBook = async (teacherId: string) => {
    if (!user) return;
    setBookLoading(teacherId);
    try {
      const res = await fetch('/api/teacher/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          studentId: user.id,
          studentName: user.name || user.firstName || user.email,
          studentEmail: user.email,
          message: '',
        }),
      });
      if (!res.ok) throw new Error('Booking failed');
    } catch (error) {
      console.error('Booking error', error);
      // minimal feedback
      alert('Booking failed. Please try again.');
    }
    setBookLoading(null);
  };

  if (loading) return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Favorites</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-600">Loading favorites…</div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Favorite Teachers</CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-sm text-slate-600">You have no favorite teachers yet. Visit the mentors page to add favorites.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {favorites.map((f) => {
              const t = f.teacher ?? {};
              const displayName = t.displayName || t.name || 'Teacher';
              return (
                <div key={f.id} className="flex items-center justify-between gap-4 bg-white border border-emerald-50 rounded-lg p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-12 h-12">
                      {t.profileImageUrl ? (
                        <AvatarImage src={t.profileImageUrl} alt={displayName} />
                      ) : (
                        <AvatarFallback>{(displayName?.[0] || 'T').toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <Link href={`/teacher/${f.teacherId}`} className="font-medium text-slate-900 truncate">
                        {displayName}
                      </Link>
                      <div className="text-xs text-slate-500 truncate">{t.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/teacher/${f.teacherId}`}>
                      <Button variant="outline" size="sm" className="rounded-full px-3 py-1.5">View</Button>
                    </Link>
                    <Button size="sm" className="rounded-full px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleBook(f.teacherId)} disabled={bookLoading === f.teacherId}>
                      {bookLoading === f.teacherId ? 'Booking...' : 'Book'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-slate-500">Your favorite teachers are saved to your account</div>
      </CardFooter>
    </Card>
  );
}
