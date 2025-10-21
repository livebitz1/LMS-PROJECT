// This API route will handle booking requests from students to teachers
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { teacherId, studentId, studentName, studentEmail, message } = body;
  if (!teacherId || !studentId || !studentName || !studentEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const booking = await prisma.teacherBooking.create({
      data: {
        teacherId,
        studentId,
        studentName,
        studentEmail,
        message,
      },
    });
    return NextResponse.json({ success: true, booking });
  } catch {
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
