import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: totalPhotos, error: totalError }, { count: recentUploads, error: recentError }, { data: categoryRows, error: categoryError }] =
      await Promise.all([
        adminClient.from('gallery_images').select('id', { count: 'exact', head: true }),
        adminClient.from('gallery_images').select('id', { count: 'exact', head: true }).gt('created_at', weekAgo),
        adminClient.from('gallery_images').select('category'),
      ]);

    if (totalError || recentError || categoryError) {
      return NextResponse.json({ error: 'Failed to fetch gallery stats' }, { status: 500 });
    }

    const categories = new Set((categoryRows || []).map((row) => row.category).filter(Boolean)).size;

    return NextResponse.json({
      totalPhotos: totalPhotos ?? 0,
      recentUploads: recentUploads ?? 0,
      categories,
    });
  } catch (error) {
    console.error('Gallery stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
