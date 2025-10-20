import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { clerkId?: string } }) {
  try {
    const clerkId = params?.clerkId;
    if (!clerkId) return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user || !user.profileImageUrl) {
      // redirect to placeholder in public folder
      const url = new URL('/placeholder.svg', req.url);
      return NextResponse.redirect(url);
    }

    // Fetch the remote image and proxy it
    const imageRes = await fetch(user.profileImageUrl, { method: 'GET' });
    if (!imageRes.ok) {
      const url = new URL('/placeholder.svg', req.url);
      return NextResponse.redirect(url);
    }

    const contentType = imageRes.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await imageRes.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('/api/teacher/avatar error', err);
    const url = new URL('/placeholder.svg', req.url);
    return NextResponse.redirect(url);
  }
}
