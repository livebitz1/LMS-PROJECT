import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET() {
  const rawHeaders = await headers();
  const headerObj = Object.fromEntries(Array.from(rawHeaders)) as Record<string, string>;
  const req = new NextRequest("https://placeholder.local", { headers: headerObj });
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    return NextResponse.json({ bookings: [] });
  }
  // Find the student's database ID using Clerk ID
  const student = await prisma.user.findUnique({ where: { clerkId } });
  if (!student) {
    return NextResponse.json({ bookings: [] });
  }
  // Fetch bookings using the student's database ID
  const bookings = await prisma.teacherBooking.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      teacher: {
        select: { name: true, profileImageUrl: true, teacherProfile: { select: { displayName: true } } }
      }
    },
  });
  // Map to UI-friendly format
  const formatted = bookings.map(b => ({
    id: b.id,
    teacherId: b.teacher?.id || b.teacherId || '', // fallback to teacherId from booking if join fails
    teacherName: b.teacher?.teacherProfile?.displayName || b.teacher?.name || "Unknown Teacher",
    teacherProfileImageUrl: b.teacher?.profileImageUrl ?? null,
    createdAt: b.createdAt,
    message: b.message ?? null,
  }));
  return NextResponse.json({ bookings: formatted });
}
