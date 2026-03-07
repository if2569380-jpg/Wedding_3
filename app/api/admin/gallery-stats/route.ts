import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';
import type { AnalyticsEventType } from '@/lib/analytics';

type AnalyticsEventRow = {
  event_type: AnalyticsEventType;
  photo_id: string | null;
  user_id: string | null;
  created_at: string;
};

type PhotoTitleRow = {
  id: string;
  alt: string;
};

type TopPhoto = {
  id: string;
  title: string;
  count: number;
};

function incrementPhotoCount(counter: Map<string, number>, photoId: string | null) {
  if (!photoId) return;
  counter.set(photoId, (counter.get(photoId) ?? 0) + 1);
}

function buildTopPhotos(counter: Map<string, number>, titleById: Map<string, string>): TopPhoto[] {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      title: titleById.get(id) ?? 'Untitled photo',
      count,
    }));
}

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
    const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoIso = weekAgoDate.toISOString();
    const weekAgoMs = weekAgoDate.getTime();

    const [
      { count: totalPhotos, error: totalError },
      { count: recentUploads, error: recentError },
      { data: categoryRows, error: categoryError },
      { data: analyticsRows, error: analyticsError },
    ] =
      await Promise.all([
        adminClient.from('gallery_images').select('id', { count: 'exact', head: true }),
        adminClient.from('gallery_images').select('id', { count: 'exact', head: true }).gt('created_at', weekAgoIso),
        adminClient.from('gallery_images').select('category'),
        adminClient.from('gallery_analytics_events').select('event_type,photo_id,user_id,created_at'),
      ]);

    if (totalError || recentError || categoryError || analyticsError) {
      return NextResponse.json({ error: 'Failed to fetch gallery stats' }, { status: 500 });
    }

    const categories = new Set((categoryRows || []).map((row) => row.category).filter(Boolean)).size;
    const events = ((analyticsRows || []) as unknown) as AnalyticsEventRow[];

    const viewedCounts = new Map<string, number>();
    const downloadedCounts = new Map<string, number>();
    const sharedCounts = new Map<string, number>();

    let photoViews = 0;
    let photoDownloads = 0;
    let photoShares = 0;
    let guestLogins = 0;

    const uniqueGuests = new Set<string>();
    const activeGuestsLast7Days = new Set<string>();

    for (const event of events) {
      if (event.event_type === 'view') {
        photoViews += 1;
        incrementPhotoCount(viewedCounts, event.photo_id);
        continue;
      }

      if (event.event_type === 'download') {
        photoDownloads += 1;
        incrementPhotoCount(downloadedCounts, event.photo_id);
        continue;
      }

      if (event.event_type === 'share') {
        photoShares += 1;
        incrementPhotoCount(sharedCounts, event.photo_id);
        continue;
      }

      if (event.event_type === 'login') {
        guestLogins += 1;
        if (event.user_id) {
          uniqueGuests.add(event.user_id);
          const createdAtMs = Date.parse(event.created_at);
          if (Number.isFinite(createdAtMs) && createdAtMs >= weekAgoMs) {
            activeGuestsLast7Days.add(event.user_id);
          }
        }
      }
    }

    const photoIds = new Set<string>([
      ...viewedCounts.keys(),
      ...downloadedCounts.keys(),
      ...sharedCounts.keys(),
    ]);

    const photoIdList = [...photoIds];
    let titleById = new Map<string, string>();

    if (photoIdList.length > 0) {
      const { data: photoRows, error: photoError } = await adminClient
        .from('gallery_images')
        .select('id,alt')
        .in('id', photoIdList);

      if (photoError) {
        return NextResponse.json({ error: 'Failed to fetch top photo titles' }, { status: 500 });
      }

      titleById = new Map(
        (((photoRows || []) as unknown) as PhotoTitleRow[]).map((photo) => [photo.id, photo.alt])
      );
    }

    return NextResponse.json({
      totalPhotos: totalPhotos ?? 0,
      recentUploads: recentUploads ?? 0,
      categories,
      analytics: {
        photoViews,
        photoDownloads,
        photoShares,
        guestLogins,
        uniqueGuests: uniqueGuests.size,
        activeGuestsLast7Days: activeGuestsLast7Days.size,
      },
      topPhotos: {
        viewed: buildTopPhotos(viewedCounts, titleById),
        downloaded: buildTopPhotos(downloadedCounts, titleById),
        shared: buildTopPhotos(sharedCounts, titleById),
      },
    });
  } catch (error) {
    console.error('Gallery stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
