import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { buildPublicStorageUrl, getLandingBucketName } from '@/lib/storageUrl';

export async function GET() {
  try {
    const admin = createAdminClient();
    const landingBucket = getLandingBucketName();

    const [{ data: storyCards, error: storyError }, { data: collageItems, error: collageError }] =
      await Promise.all([
        admin
          .from('landing_story_cards')
          .select(
            'id,title,subtitle,description,image_path,image_alt,section_type,countdown_target,icon_token,background_token,text_token,accent_token,order_index,is_active,created_at'
          )
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
        admin
          .from('landing_collage_items')
          .select('id,caption,image_path,image_alt,order_index,is_active,created_at')
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 });
    }

    if (collageError) {
      return NextResponse.json({ error: collageError.message }, { status: 500 });
    }

    const story = (storyCards || []).map((item) => ({
      ...item,
      image_url: buildPublicStorageUrl(landingBucket, item.image_path),
    }));

    const collage = (collageItems || []).map((item) => ({
      ...item,
      image_url: buildPublicStorageUrl(landingBucket, item.image_path),
    }));

    return NextResponse.json(
      { storyCards: story, collageItems: collage },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Landing content fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch landing content' }, { status: 500 });
  }
}
