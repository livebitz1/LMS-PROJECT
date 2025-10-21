import { getAuth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import Navbar from '@/app/components/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Empty } from '@/components/ui/empty';

export const metadata = {
  title: 'Teacher Bookings',
};

type BookingWithStudent = {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string;
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
        <h1 className="text-3xl font-extrabold mb-6 text-emerald-700 flex items-center gap-2">
          <span className="inline-block">Your Bookings</span>
          <Badge variant="outline" className="text-xs px-2 py-1">{bookings.length}</Badge>
        </h1>
        <Separator className="mb-8" />
        <p className="text-base text-muted-foreground mb-8">Manage and review all student bookings here. Click a card for more details.</p>
        {bookings.length === 0 ? (
          <Empty className="py-16 text-center text-lg text-slate-400">No bookings yet.</Empty>
        ) : (
          <div className="grid gap-8">
            {bookings.map((b: BookingWithStudent) => (
              <Card key={b.id} className="transition-shadow hover:shadow-lg border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-white">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="size-16">
                    <AvatarImage src={b.student.profileImageUrl || undefined} alt={b.studentName || 'Student'} />
                    <AvatarFallback>{b.studentName ? b.studentName[0] : '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg text-emerald-900">{b.studentName}</div>
                    <Badge variant="outline" className="text-xs">Student</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  {b.message && <div className="text-base text-slate-700 mb-2">Message: <span className="font-medium text-emerald-700">{b.message}</span></div>}
                  <div className="text-xs text-slate-400">Booked on {new Date(b.createdAt).toLocaleString()}</div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  {/* Future: Accept/Reject/Message actions */}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
