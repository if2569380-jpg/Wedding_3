import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { FALLBACK_STORY_CARDS } from '@/lib/landingContent';
import { getGalleryBucketName, getLandingBucketName } from '@/lib/storageUrl';

function getExtension(path: string) {
  const clean = path.split('?')[0];
  const ext = clean.split('.').pop()?.toLowerCase().trim();
  return ext || 'jpg';
}

function extractStoragePath(value: string, bucketName: string) {
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, '');
  }

  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/${url.pathname.includes('/sign/') ? 'sign' : 'public'}/${bucketName}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return '';
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return '';
  }
}

async function copyImageObject(
  admin: ReturnType<typeof createAdminClient>,
  sourceBucket: string,
  sourcePath: string,
  targetBucket: string,
  targetPrefix: 'story' | 'collage',
  index: number
) {
  const { data: sourceBlob, error: downloadError } = await admin.storage.from(sourceBucket).download(sourcePath);

  if (downloadError || !sourceBlob) {
    return {
      ok: false as const,
      error: downloadError?.message || `Source image not found: ${sourcePath}`,
    };
  }

  const ext = getExtension(sourcePath);
  const targetPath = `${targetPrefix}/bootstrap-${index + 1}-${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage.from(targetBucket).upload(targetPath, sourceBlob, {
    cacheControl: '3600',
    upsert: false,
    contentType: sourceBlob.type || 'image/jpeg',
  });

  if (uploadError) {
    return {
      ok: false as const,
      error: uploadError.message,
    };
  }

  return {
    ok: true as const,
    targetPath,
  };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const landingBucket = getLandingBucketName();
    const galleryBucket = getGalleryBucketName();

    const [{ count: existingStoryCount }, { count: existingCollageCount }] = await Promise.all([
      admin.from('landing_story_cards').select('id', { head: true, count: 'exact' }),
      admin.from('landing_collage_items').select('id', { head: true, count: 'exact' }),
    ]);

    if ((existingStoryCount || 0) > 0 || (existingCollageCount || 0) > 0) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Landing content already exists. Bootstrap not applied.',
      });
    }

    const failedCopies: string[] = [];
    const storyRows: Array<Record<string, unknown>> = [];
    const collageRows: Array<Record<string, unknown>> = [];

    for (let index = 0; index < FALLBACK_STORY_CARDS.length; index += 1) {
      const fallbackStory = FALLBACK_STORY_CARDS[index];
      const copied = await copyImageObject(
        admin,
        galleryBucket,
        fallbackStory.image_path,
        landingBucket,
        'story',
        index
      );

      if (!copied.ok) {
        failedCopies.push(`story[${index}] ${copied.error}`);
        continue;
      }

      storyRows.push({
        title: fallbackStory.title,
        subtitle: fallbackStory.subtitle,
        description: fallbackStory.description,
        image_path: copied.targetPath,
        image_alt: fallbackStory.image_alt || fallbackStory.title,
        section_type: fallbackStory.section_type,
        countdown_target: fallbackStory.countdown_target,
        icon_token: fallbackStory.icon_token,
        background_token: fallbackStory.background_token,
        text_token: fallbackStory.text_token,
        accent_token: fallbackStory.accent_token,
        order_index: storyRows.length,
        is_active: true,
      });
    }

    const { data: galleryRows, error: galleryError } = await admin
      .from('gallery_images')
      .select('alt, full_src')
      .order('created_at', { ascending: false })
      .limit(6);

    if (galleryError) {
      failedCopies.push(`collage source query failed: ${galleryError.message}`);
    } else {
      for (let index = 0; index < (galleryRows || []).length; index += 1) {
        const source = galleryRows![index];
        const sourcePath = extractStoragePath(source.full_src || '', galleryBucket);
        if (!sourcePath) {
          failedCopies.push(`collage[${index}] invalid source path`);
          continue;
        }

        const copied = await copyImageObject(admin, galleryBucket, sourcePath, landingBucket, 'collage', index);
        if (!copied.ok) {
          failedCopies.push(`collage[${index}] ${copied.error}`);
          continue;
        }

        const caption = (source.alt || '').trim() || `Memory ${index + 1}`;
        collageRows.push({
          caption,
          image_path: copied.targetPath,
          image_alt: caption,
          order_index: collageRows.length,
          is_active: true,
        });
      }
    }

    if (storyRows.length > 0) {
      const { error: insertStoryError } = await admin.from('landing_story_cards').insert(storyRows);
      if (insertStoryError) {
        return NextResponse.json({ error: insertStoryError.message }, { status: 500 });
      }
    }

    if (collageRows.length > 0) {
      const { error: insertCollageError } = await admin.from('landing_collage_items').insert(collageRows);
      if (insertCollageError) {
        return NextResponse.json({ error: insertCollageError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      skipped: false,
      seeded: {
        storyCards: storyRows.length,
        collageItems: collageRows.length,
      },
      failedCopies,
    });
  } catch (error) {
    console.error('Landing bootstrap error:', error);
    return NextResponse.json({ error: 'Failed to bootstrap landing content' }, { status: 500 });
  }
}
