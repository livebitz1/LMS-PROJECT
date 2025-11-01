import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Extract profileId from the request URL path (last segment)
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const profileId = pathSegments[pathSegments.length - 1];

    if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });

    const profile = await prisma.teacherProfile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.resumeUrl) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    const resumeUrl = profile.resumeUrl;

    // Proxy the remote file so browser can load PDFs without CORS/401 issues
    async function tryFetch(url: string) {
      try {
        // Provide a common browser User-Agent and Accept header to avoid remote hosts blocking server requests
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
          'Accept': 'application/pdf, */*;q=0.9',
        };
        return await fetch(url, { redirect: 'follow', headers });
      } catch {
        return null;
      }
    }

    let res = await tryFetch(resumeUrl);
    // If initial fetch failed or returned non-ok, try swapping Cloudinary resource_type path segments
    if (!res || !res.ok) {
      // attempt to swap /image/upload/ <-> /raw/upload/ for Cloudinary URLs
      try {
        const alt = resumeUrl.includes('/image/upload/') ? resumeUrl.replace('/image/upload/', '/raw/upload/') : resumeUrl.includes('/raw/upload/') ? resumeUrl.replace('/raw/upload/', '/image/upload/') : null;
        if (alt) {
          const altRes = await tryFetch(alt);
          if (altRes && altRes.ok) {
            res = altRes;
          } else {
            // If we got a 401 from Cloudinary, try to construct a signed URL using the SDK and public_id
            try {
              const status1 = res ? res.status : null;
              const status2 = altRes ? altRes.status : null;
              if (status1 === 401 || status2 === 401) {
                // derive public_id from the URL: strip until /upload/ and remove version and extension
                const parts = resumeUrl.split('/upload/');
                if (parts.length > 1) {
                  let publicPath = parts[1];
                  // remove version segment like v123456789/
                  publicPath = publicPath.replace(/^v\d+\//, '');
                  // remove file extension
                  publicPath = publicPath.replace(/\.[^/.]+$/, '');
                  const publicId = publicPath; // e.g. teachers/user_xxx/resume/abcd1234
                  try {
                    // Generate a signed URL using cloudinary SDK helper (sign_url), resource_type raw
                    const cloudinaryUrlFn = (cloudinary as unknown as { url?: (publicId: string, opts?: Record<string, unknown>) => string }).url;
                    if (typeof cloudinaryUrlFn === 'function') {
                      const signedUrl = cloudinaryUrlFn(publicId, { resource_type: 'raw', sign_url: true, secure: true });
                      if (signedUrl) {
                        const signedRes = await tryFetch(signedUrl);
                        if (signedRes && signedRes.ok) {
                          res = signedRes;
                        } else {
                          console.warn('/api/admin/approvals/resume signed URL fetch failed', { signedUrl, signedStatus: signedRes?.status });
                          // fall through to original error handling
                        }
                      }
                    }
                  } catch (err) {
                    console.warn('Failed to generate signed Cloudinary URL', err);
                  }
                }
              }
            } catch (err) {
              console.warn('Error while attempting signed URL fallback', err);
            }
            // log both statuses for debugging
            const s1 = res ? res.status : 'network-error';
            const s2 = altRes ? altRes.status : 'network-error';
            const body1 = res ? await res.text().catch(() => '') : '';
            const body2 = altRes ? await altRes.text().catch(() => '') : '';
            console.warn(`/api/admin/approvals/resume proxy fetch failed for ${resumeUrl} (status=${s1}) and alt ${alt} (status=${s2}). snippets:`, body1.slice(0, 400), body2.slice(0, 400));
            return NextResponse.json({ error: 'Failed to fetch remote resume', status1: s1, status2: s2 }, { status: 502 });
          }
        } else {
          const s = res ? res.status : 'network-error';
          const body = res ? await res.text().catch(() => '') : '';
          console.warn(`/api/admin/approvals/resume proxy fetch failed for ${resumeUrl} (status=${s}). snippet:`, body.slice(0, 400));
          return NextResponse.json({ error: 'Failed to fetch remote resume', status: s }, { status: 502 });
        }
      } catch (err) {
        console.error('/api/admin/approvals/resume fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch remote resume', details: String(err) }, { status: 502 });
      }
    }

    const headers: Record<string, string> = {};
    const ct = res.headers.get('content-type');
    if (ct) headers['Content-Type'] = ct;
    // allow inline display
    headers['Content-Disposition'] = 'inline; filename="resume.pdf"';

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    console.error('/api/admin/approvals/resume GET error:', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
