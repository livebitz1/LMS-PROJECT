import { getAuth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import Navbar from '@/app/components/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export const metadata = {
  title: 'Teacher Bookings',
};

type BookingWithStudent = {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  message?: string | null;
  createdAt: Date;
  student: {
    profileImageUrl?: string | null;
    name?: string | null;
  };
};

export default async function TeacherBookingsPage() {
  const rawHeaders = await headers();
  const headerObj = Object.fromEntries(Array.from(rawHeaders)) as Record<string, string>;
  const req = new NextRequest('https://placeholder.local', { headers: headerObj });
  const { userId } = getAuth(req);
  if (!userId) {
    return <div className="py-20 text-center text-lg">Please sign in to view your bookings.</div>;
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || String(user.role || '').toLowerCase() !== 'teacher') {
    return <div className="py-20 text-center text-lg">Only teachers can view bookings.</div>;
  }

  // Use the correct Prisma client property: teacherBooking
  const bookings: BookingWithStudent[] = await prisma.teacherBooking.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { student: true },
  });

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Your Bookings</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage and review all student bookings here.</p>
        {bookings.length === 0 ? (
          <div className="text-center text-slate-500 py-12">No bookings yet.</div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b: BookingWithStudent) => (
              <div key={b.id} className="border border-emerald-100 rounded-xl p-5 bg-white shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <Avatar className="size-14 mr-4">
                  <AvatarImage src={b.student.profileImageUrl || undefined} alt={b.studentName || 'Student'} />
                  <AvatarFallback>{b.studentName ? b.studentName[0] : '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-lg">{b.studentName}</div>
                  <div className="text-xs text-slate-500 mb-1">{b.studentEmail}</div>
                  {b.message && <div className="text-sm text-slate-700 mb-1">Message: {b.message}</div>}
                  <div className="text-xs text-slate-400">Booked on {new Date(b.createdAt).toLocaleString()}</div>
                </div>
                {/* Add management actions here if needed */}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
