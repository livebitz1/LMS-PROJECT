import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import serverEvents from '@/lib/events';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const bookingId = body.get('bookingId') as string | null;
    const action = body.get('action') as string | null;
    if (!bookingId || !action) return NextResponse.json({ error: 'Missing' }, { status: 400 });

    const booking = await prisma.teacherBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let messageObj: Record<string, unknown> = {};
    try { messageObj = booking.message ? JSON.parse(booking.message) as Record<string, unknown> : {}; } catch { messageObj = {}; }

    if (action === 'accept') {
      messageObj['status'] = 'ACCEPTED';
      messageObj['teacherResponse'] = { acceptedAt: new Date().toISOString() };
    } else if (action === 'reject') {
      messageObj['status'] = 'REJECTED';
      messageObj['teacherResponse'] = { rejectedAt: new Date().toISOString() };
    }

    await prisma.teacherBooking.update({ where: { id: bookingId }, data: { message: JSON.stringify(messageObj) } });

    serverEvents.emit('booking_updated', { bookingId, teacherId: booking.teacherId, status: messageObj['status'], payload: messageObj });

    // Build an absolute URL for redirect using request headers
    const host = req.headers.get('host') ?? 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') ?? req.headers.get('x-forwarded-protocol') ?? 'http';
    const origin = `${proto}://${host}`;

    return NextResponse.redirect(new URL('/teacher/bookings', origin));
  } catch (err) {
    console.error('/api/teacher/book/respond POST error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
