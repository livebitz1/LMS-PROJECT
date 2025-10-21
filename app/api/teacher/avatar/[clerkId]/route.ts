import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// @ts-expect-error Next.js dynamic API route context must be untyped
export async function GET(req: NextRequest, context) {
  try {
    const { params } = context as { params: { clerkId: string } };
    const clerkId = params.clerkId;

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
  } catch (err) {
    console.error('/api/teacher/avatar error', err);
    const url = new URL('/placeholder.svg', req.url);
    return NextResponse.redirect(url);
  }
}
