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
import { AlertCircle, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react';

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

type ParsedMessage = {
  text: string;
  timeRequested: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
};

// Helper: Parse message safely
const parseMessage = (msg?: string | null): ParsedMessage => {
  if (!msg) return { text: '', timeRequested: null, status: 'PENDING' };
  try {
    const parsed = JSON.parse(msg);
    return {
      text: parsed.text || '',
      timeRequested: parsed.timeRequested || null,
      status: (parsed.status || 'PENDING').toUpperCase() as ParsedMessage['status'],
    };
  } catch {
    return { text: msg, timeRequested: null, status: 'PENDING' };
  }
};

// Helper: Format date
const formatDate = (date: string | Date | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default async function TeacherBookingsPage() {
  const rawHeaders = await headers();
  const headerObj = Object.fromEntries(Array.from(rawHeaders)) as Record<string, string>;
  const req = new NextRequest('https://placeholder.local', { headers: headerObj });
  const { userId } = getAuth(req);

  if (!userId) {
    return <AuthRequired />;
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role?.toLowerCase() !== 'teacher') {
    return <AccessDenied />;
  }

  const bookings: BookingWithStudent[] = await prisma.teacherBooking.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { student: true },
  });

  return (
    <>
      <Navbar />
      <div className="h-20" aria-hidden="true" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-700 flex flex-wrap items-center gap-3">
            Your Bookings
            <Badge variant="secondary" className="text-lg px-3 py-1 bg-emerald-100 text-emerald-800">
              {bookings.length}
            </Badge>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Review and respond to student session requests. Only pending bookings can be accepted or rejected.
          </p>
        </div>

        <Separator className="mb-8" />

        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const msg = parseMessage(booking.message);
              const isPending = msg.status === 'PENDING';

              return (
                <Card
                  key={booking.id}
                  className="group relative overflow-hidden border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-white 
                           shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 
                           hover:border-emerald-300"
                >
                  {/* Status Ribbon */}
                  <div className={`absolute top-0 right-0 w-24 h-8 transform translate-x-6 -translate-y-3 rotate-45 
                    ${msg.status === 'ACCEPTED' ? 'bg-emerald-600' : 
                      msg.status === 'REJECTED' ? 'bg-red-600' : 
                      'bg-amber-500'} 
                    text-white text-xs font-bold flex items-center justify-center shadow-md`}>
                    {msg.status}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-emerald-100">
                        <AvatarImage src={booking.student.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                          {booking.studentName?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-emerald-900 truncate">
                          {booking.studentName || 'Unknown Student'}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {msg.text ? (
                      <div className="flex gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-700 line-clamp-3">
                          <span className="font-medium text-emerald-700">Message:</span>{' '}
                          {msg.text}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No message provided.</p>
                    )}

                    {msg.timeRequested && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Requested: {formatDate(msg.timeRequested)}</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-4 flex flex-wrap gap-2 justify-end">
                    {isPending ? (
                      <>
                        <form action="/api/teacher/book/respond" method="post" className="inline">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="action" value="accept" />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Accept
                          </Button>
                        </form>
                        <form action="/api/teacher/book/respond" method="post" className="inline">
                          <input type="hidden" name="bookingId" value={booking.id} />
                          <input type="hidden" name="action" value="reject" />
                          <Button type="submit" size="sm" variant="destructive">
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </form>
                      </>
                    ) : (
                      <Badge
                        variant={msg.status === 'ACCEPTED' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {msg.status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/teacher/bookings/${booking.id}`}>
                        View Details
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

// Reusable Components
function AuthRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-6">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground">Please sign in to view your bookings.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-6">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only teachers can access this page.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-emerald-100 rounded-full p-4 mb-4">
          <MessageSquare className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No Bookings Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Students will appear here once they request a session with you.
        </p>
      </CardContent>
    </Card>
  );
}