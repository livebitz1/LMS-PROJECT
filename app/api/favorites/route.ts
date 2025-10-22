import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// helper wrapper for access to the generated Favorite model (keeps runtime behavior even if TS types are missing)
const favModel = prisma as unknown as {
  favorite: {
    findMany: (args?: { where?: unknown; include?: unknown; orderBy?: unknown }) => Promise<Array<Record<string, unknown>>>;
    upsert: (args: { where: unknown; update: unknown; create: unknown }) => Promise<Record<string, unknown>>;
    deleteMany: (args: { where: unknown }) => Promise<unknown>;
  };
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ favorites: [] });

    const favs = await favModel.favorite.findMany({
      where: { studentId: user.id },
      include: { teacher: { include: { teacherProfile: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const favorites = (favs || []).map((f: Record<string, unknown>) => ({
      id: String(f['id']),
      teacherId: String(f['teacherId']),
      createdAt: f['createdAt'],
      teacher: {
        id: f['teacher'] ? String((f['teacher'] as Record<string, unknown>)['id'] ?? '') : null,
        name: f['teacher'] ? ((f['teacher'] as Record<string, unknown>)['name'] ?? (f['teacher'] as Record<string, unknown>)['email']) : null,
        profileImageUrl: f['teacher'] ? ((f['teacher'] as Record<string, unknown>)['profileImageUrl'] ?? ((f['teacher'] as Record<string, unknown>)['teacherProfile'] as Record<string, unknown> | undefined)?.['profileImageUrl'] ?? null) : null,
        displayName: f['teacher'] ? (((f['teacher'] as Record<string, unknown>)['teacherProfile'] as Record<string, unknown> | undefined)?.['displayName'] ?? null) : null,
      }
    }));

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error('API /api/favorites GET error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await req.json();
    const { teacherId } = body || {};
    if (!teacherId) return NextResponse.json({ error: 'Missing teacherId' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if ((user.role ?? '').toLowerCase() !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    // Upsert favorite using the helper model access
    const fav = await favModel.favorite.upsert({
      where: { studentId_teacherId: { studentId: user.id, teacherId: teacher.id } },
      update: {},
      create: { studentId: user.id, teacherId: teacher.id },
    });

    return NextResponse.json({ favorite: { id: String(fav['id']), teacherId: String(fav['teacherId']), createdAt: fav['createdAt'] } });
  } catch (err) {
    console.error('API /api/favorites POST error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const url = new URL(req.url);
    const teacherId = url.searchParams.get('teacherId');
    if (!teacherId) return NextResponse.json({ error: 'Missing teacherId' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if ((user.role ?? '').toLowerCase() !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await favModel.favorite.deleteMany({ where: { studentId: user.id, teacherId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API /api/favorites DELETE error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
