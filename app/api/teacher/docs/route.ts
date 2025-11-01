/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import type { Writable } from 'stream';
import serverEvents from '@/lib/events';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const form = await req.formData();
    const resume = form.get('resume') as File | null;
    const idCard = form.get('idCard') as File | null;
    const degree = form.get('degree') as File | null;

    if (!resume || !idCard || !degree) {
      return NextResponse.json({ error: 'All three files (resume, idCard, degree) are required' }, { status: 400 });
    }

    // basic server-side validation
    const allowedResume = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedResume.includes(resume.type)) return NextResponse.json({ error: 'Invalid resume type' }, { status: 400 });
    if (![...allowedImages, 'application/pdf'].includes(degree.type)) return NextResponse.json({ error: 'Invalid degree document type' }, { status: 400 });
    if (!allowedImages.includes(idCard.type)) return NextResponse.json({ error: 'Invalid id card image type' }, { status: 400 });

    // find user -> user.id
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // check existing profile upload attempts
    const existing = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    const currentAttempts = (existing as any)?.docsUploadAttempts ?? 0;
    const MAX_ATTEMPTS = 3;
    if (currentAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Upload limit reached', attempts: currentAttempts, remaining: 0 }, { status: 400 });
    }

    // helper types for cloudinary response
    type CloudinaryResult = { secure_url: string; public_id?: string; resource_type?: string };

    // helper to upload to cloudinary via upload_stream
    async function uploadToCloudinary(file: File, folder: string): Promise<CloudinaryResult> {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<CloudinaryResult>((resolve, reject) => {
        // choose resource_type so PDFs/docs are uploaded as 'raw' (served correctly) and images use 'image' or 'auto'
        const isPdf = file.type === 'application/pdf';
        const isDoc = ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
        const resourceType = isPdf || isDoc ? 'raw' : 'auto';
        const stream = cloudinary.uploader.upload_stream({ folder: `teachers/${userId}/${folder}`, resource_type: resourceType }, (err: Error | undefined | null, result: unknown) => {
           if (err) return reject(err);
           // cast to expected shape
           const res = result as CloudinaryResult;
           if (!res || !res.secure_url) return reject(new Error('Invalid upload response'));
           resolve(res);
         });
         // Node Writable stream expects Buffer
         // Cast to Node Writable stream type to call end without using `any`
         (stream as unknown as Writable).end(buffer);
       });
    }

    // Upload files (uploadToCloudinary determines resource_type based on file MIME)
    const [resumeResp, idCardResp, degreeResp] = await Promise.all([
      uploadToCloudinary(resume, 'resume'),
      uploadToCloudinary(idCard, 'idcard'),
      uploadToCloudinary(degree, 'degree'),
    ]);

    // If profile exists increment attempts, otherwise create with 1 attempt
    let updatedProfile;
    try {
      if (existing) {
        // Use explicit numeric update instead of FieldUpdateOperations to avoid runtime client mismatch
        const nextAttempts = ((existing as any)?.docsUploadAttempts ?? 0) + 1;
        updatedProfile = await prisma.teacherProfile.update({
          where: { userId: user.id },
          data: {
            resumeUrl: resumeResp.secure_url,
            idCardUrl: idCardResp.secure_url,
            degreeProofUrl: degreeResp.secure_url,
            docsStatus: 'PENDING',
            docsUploadAttempts: nextAttempts,
          } as any,
        });
      } else {
        updatedProfile = await prisma.teacherProfile.create({
          data: {
            userId: user.id,
            resumeUrl: resumeResp.secure_url,
            idCardUrl: idCardResp.secure_url,
            degreeProofUrl: degreeResp.secure_url,
            docsStatus: 'PENDING',
            docsUploadAttempts: 1,
          } as any,
        });
      }
    } catch (err) {
      console.error('DB error saving uploaded docs', err);
      return NextResponse.json({ error: 'Failed to save uploaded files' }, { status: 500 });
    }

    const newAttempts = (updatedProfile as any).docsUploadAttempts ?? (existing ? currentAttempts + 1 : 1);

    // emit realtime event so admin dashboard updates
    try {
      serverEvents.emit('docs_reuploaded', { profileId: updatedProfile.id, userId: user.id, attempts: newAttempts });
    } catch (e) {
      // non-fatal
      console.warn('Failed to emit docs_reuploaded event', e);
    }

    return NextResponse.json({ ok: true, profile: updatedProfile, attempts: newAttempts, remaining: Math.max(0, MAX_ATTEMPTS - newAttempts) });
  } catch (err) {
    console.error('/api/teacher/docs error', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
