/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import type { Writable } from 'stream';

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

    // helper types for cloudinary response
    type CloudinaryResult = { secure_url: string; public_id?: string; resource_type?: string };

    // helper to upload to cloudinary via upload_stream
    async function uploadToCloudinary(file: File, folder: string): Promise<CloudinaryResult> {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<CloudinaryResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: `teachers/${userId}/${folder}` }, (err: Error | undefined | null, result: unknown) => {
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

    const [resumeResp, idCardResp, degreeResp] = await Promise.all([
      uploadToCloudinary(resume, 'resume'),
      uploadToCloudinary(idCard, 'idcard'),
      uploadToCloudinary(degree, 'degree'),
    ]);

    // find user -> user.id
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Cast payloads to any to avoid strict generated Prisma types mismatch during development
    const up = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        resumeUrl: resumeResp.secure_url,
        idCardUrl: idCardResp.secure_url,
        degreeProofUrl: degreeResp.secure_url,
        docsStatus: 'PENDING',
      } as any,
      create: {
        userId: user.id,
        resumeUrl: resumeResp.secure_url,
        idCardUrl: idCardResp.secure_url,
        degreeProofUrl: degreeResp.secure_url,
        docsStatus: 'PENDING',
      } as any,
    });

    return NextResponse.json({ ok: true, profile: up });
  } catch (err) {
    console.error('/api/teacher/docs error', err);
    return NextResponse.json({ error: 'Server error', details: (err as Error)?.message ?? String(err) }, { status: 500 });
  }
}
