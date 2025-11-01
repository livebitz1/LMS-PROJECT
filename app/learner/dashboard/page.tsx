"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { LearnerProfileCard } from "./LearnerProfileCard";
import { LearnerBookings } from "./LearnerBookings";
import Navbar from "@/app/components/Navbar";
import LearnerFavorites from "./LearnerFavorites";

export default function LearnerDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/users", { credentials: "same-origin" });
      if (!res.ok) return setLoading(false);
      const data = await res.json();
      setUser(data?.user ?? null);
      // Fetch learner bookings
      const bookingsRes = await fetch("/api/learner/bookings", { credentials: "same-origin" });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings ?? []);
      }
      setLoading(false);
      // Redirect if not student
      if (data?.user?.role !== "student") router.replace("/");
    })();
  }, [router]);

  if (loading) return <div className="py-20 text-center text-lg">Loading...</div>;
  if (!user || user.role !== "student") return null;

  return (
    <>
      <Navbar />
      {/* spacer equal to header height so fixed navbar doesn't overlap content */}
      <div className="h-20" aria-hidden />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <LearnerProfileCard user={user} />
        <LearnerBookings bookings={bookings} />
        <LearnerFavorites user={user} />
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome, {user.name || user.email || "Learner"}!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-700 text-base mb-2">This is your learner dashboard.</div>
            <ul className="list-disc pl-6 text-slate-600 text-sm space-y-1">
              <li>View and track your enrolled courses (coming soon)</li>
              <li>See your progress and achievements (coming soon)</li>
              <li>Message mentors and teachers</li>
              <li>Update your profile (coming soon)</li>
            </ul>
          </CardContent>
        </Card>
        {/* Add more learner-specific widgets here */}
      </div>
    </>
  );
}
