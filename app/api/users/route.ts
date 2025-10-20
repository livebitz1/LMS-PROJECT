import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('API /api/users GET error:', err);
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 });
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
      console.error('Prisma upsert error:', dbErr?.message ?? dbErr);

      // If the error indicates the Prisma client / database schema doesn't accept `role`
      // (e.g. Unknown argument `role`), attempt a fallback retry without the role field.
      const msg = String(dbErr?.message ?? dbErr).toLowerCase();
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
        } catch (retryErr: any) {
          console.error('Prisma upsert retry (without role) failed:', retryErr?.message ?? retryErr);
          return NextResponse.json({ error: 'Database upsert failed', details: String(retryErr?.message ?? retryErr) }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Database upsert failed', details: dbErr?.message ?? String(dbErr) }, { status: 500 });
      }
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('API /api/users error:', err);
    return NextResponse.json({ error: 'Server error', details: err?.message ?? String(err) }, { status: 500 });
  }
}
