import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

const LANDING_IMAGE_PATHS: string[] = [
  'full/e2f0393f-98af-4204-bbfb-c35466695a02-1772830664406.jfif',
  'full/cfc8fac2-ad0a-4e8d-a9d1-7d934c682fb1-1772828895513.jfif',
  'full/82ebe6d4-d97a-44c1-b1cd-b6713c33b9d0-1772830623681.jfif',
  'full/1da8e16b-3082-4c77-967d-82a0ee36e8b2-1772828877550.jfif',
  'full/59181363-2d7c-427f-959c-509a4dd4d0d1-1772828921774.jfif',
];

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export async function GET() {
  try {
    const bucketName = process.env.SUPABASE_GALLERY_BUCKET || 'gallery';
    const admin = createAdminClient();

    const images: Record<string, string> = {};
    for (const path of LANDING_IMAGE_PATHS) {
      const { data, error } = await admin.storage
        .from(bucketName)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      if (!error && data?.signedUrl) {
        images[path] = data.signedUrl;
      }
    }

    return NextResponse.json(
      { images },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json({ images: {} }, { status: 200 });
  }
}
