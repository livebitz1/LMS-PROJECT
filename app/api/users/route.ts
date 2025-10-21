import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('API /api/users GET error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}

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

    const updateData: Prisma.UserUpdateInput = {
      email: safeEmail,
      name: fullName ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      profileImageUrl: profileImageUrl ?? undefined,
      role: role ?? undefined,
    };

    const createData: Prisma.UserCreateInput = {
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
    } catch (dbErr) {
      console.error('Prisma upsert error:', (dbErr as Error)?.message ?? dbErr);

      // If the error indicates the Prisma client / database schema doesn't accept `role`
      // (e.g. Unknown argument `role`), attempt a fallback retry without the role field.
      const msg = String((dbErr as Error)?.message ?? dbErr).toLowerCase();
      if (msg.includes('unknown argument') && msg.includes('role')) {
        try {
          // remove role from payloads and retry
          delete updateData.role;
          delete createData.role;

          user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: updateData,
            create: createData,
          });

          console.warn('Prisma upsert retried without `role` due to schema mismatch.');
        } catch (retryErr) {
          console.error('Prisma upsert retry (without role) failed:', (retryErr as Error)?.message ?? retryErr);
          return NextResponse.json({ error: 'Database upsert failed', details: String((retryErr as Error)?.message ?? retryErr) }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Database upsert failed', details: (dbErr as Error)?.message ?? String(dbErr) }, { status: 500 });
      }
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('API /api/users error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
