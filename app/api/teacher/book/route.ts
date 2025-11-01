// This API route will handle booking requests from students to teachers
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import serverEvents from '@/lib/events';

export async function POST(req: Request) {
  const body = await req.json();
  const { teacherId, studentId, studentName, message, timeRequested } = body;
  if (!teacherId || !studentId || !studentName || !timeRequested) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const payload = {
      text: message || '',
      timeRequested: new Date(timeRequested).toISOString(),
      status: 'PENDING',
      teacherResponse: null,
    };
    const booking = await prisma.teacherBooking.create({
      data: {
        teacherId,
        studentId,
        studentName,
        message: JSON.stringify(payload),
      },
    });

    // Emit realtime event for teachers/students
    serverEvents.emit('booking_created', { bookingId: booking.id, teacherId, studentId, payload });

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    console.error('/api/teacher/book POST error', err);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
