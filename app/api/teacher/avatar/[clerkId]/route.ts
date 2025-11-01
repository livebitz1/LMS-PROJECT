import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Extract clerkId from the request URL path (last segment)
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const clerkId = pathSegments[pathSegments.length - 1];

    if (!clerkId) {
      const placeholderUrl = new URL('/placeholder.svg', request.url);
      return NextResponse.redirect(placeholderUrl);
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user || !user.profileImageUrl) {
      // redirect to placeholder in public folder
      const url2 = new URL('/placeholder.svg', request.url);
      return NextResponse.redirect(url2);
    }

    // Fetch the remote image and proxy it
    const imageRes = await fetch(user.profileImageUrl, { method: 'GET' });
    if (!imageRes.ok) {
      const url3 = new URL('/placeholder.svg', request.url);
      return NextResponse.redirect(url3);
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
    const url = new URL('/placeholder.svg', request.url);
    return NextResponse.redirect(url);
  }
}
