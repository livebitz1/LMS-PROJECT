import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const rawHeaders = await headers();
  const headerObj = Object.fromEntries(Array.from(rawHeaders)) as Record<string, string>;
  const authReq = new NextRequest("https://placeholder.local", { headers: headerObj });
  const { userId: clerkId } = getAuth(authReq);
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  const bookingId = typeof parsed?.bookingId === 'string' ? parsed.bookingId : undefined;
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const student = await prisma.user.findUnique({ where: { clerkId } });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await prisma.teacherBooking.findUnique({ where: { id: bookingId } });
  if (!existing || existing.studentId !== student.id) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  await prisma.teacherBooking.delete({ where: { id: bookingId } });
  return NextResponse.json({ ok: true });
}
