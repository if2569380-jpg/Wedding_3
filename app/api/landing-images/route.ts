import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { LEGACY_LANDING_IMAGE_PATHS } from '@/lib/landingContent';
import { buildPublicStorageUrl, getGalleryBucketName, getLandingBucketName } from '@/lib/storageUrl';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export async function GET() {
  try {
    const admin = createAdminClient();
    const landingBucket = getLandingBucketName();
    const galleryBucket = getGalleryBucketName();

    const { data: storyCards, error: storyError } = await admin
      .from('landing_story_cards')
      .select('image_path')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (!storyError && storyCards && storyCards.length > 0) {
      const images: Record<string, string> = {};
      for (const story of storyCards) {
        const normalizedPath = (story.image_path || '').trim().replace(/^\/+/, '');
        if (!normalizedPath) continue;
        images[normalizedPath] = buildPublicStorageUrl(landingBucket, normalizedPath);
      }

      return NextResponse.json(
        { images },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    const images: Record<string, string> = {};
    for (const path of LEGACY_LANDING_IMAGE_PATHS) {
      const { data, error } = await admin.storage
        .from(galleryBucket)
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
