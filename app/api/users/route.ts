import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      fullName,
      profileImageUrl,
      role,
    } = body || {};

    const safeEmail = email && String(email).trim() !== '' ? String(email) : `no-email-${userId}@no-email.local`;

    const updateData: any = {
      email: safeEmail,
      name: fullName ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      profileImageUrl: profileImageUrl ?? undefined,
      role: role ?? undefined,
    };

    const createData: any = {
      clerkId: userId,
      email: safeEmail,
      name: fullName ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      profileImageUrl: profileImageUrl ?? undefined,
      role: role ?? undefined,
    };

    let user;
    try {
      user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: updateData,
        create: createData,
      });
    } catch (dbErr: any) {
      console.error('Prisma upsert error:', dbErr);
      return NextResponse.json({ error: 'Database upsert failed', details: dbErr.message ?? String(dbErr) }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('API /api/users error:', err);
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 });
  }
}
