import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

type GalleryRow = {
  id: string;
  src: string;
  full_src?: string;
  alt: string;
  category: string;
  created_at: string;
};

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function extractStoragePath(value: string, bucketName: string) {
  if (!value) return '';

  if (!isHttpUrl(value)) {
    return value.replace(/^\/+/, '');
  }

  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/${url.pathname.includes('/sign/') ? 'sign' : 'public'}/${bucketName}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return '';

    const start = markerIndex + marker.length;
    return decodeURIComponent(url.pathname.slice(start));
  } catch {
    return '';
  }
}

async function resolveThumbnailUrl(
  src: string,
  bucketName: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const thumbnailPath = extractStoragePath(src, bucketName);
  if (!thumbnailPath) return src;

  // Bucket is private; thumbnails also need signed URLs.
  if (!thumbnailPath.startsWith('thumbnails/')) {
    return src;
  }

  const { data, error } = await adminClient.storage
    .from(bucketName)
    .createSignedUrl(thumbnailPath, 3600);

  if (error || !data?.signedUrl) {
    return src;
  }

  return data.signedUrl;
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, '\\$&');
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, 100);
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const category = searchParams.get('category');
    const queryText = searchParams.get('q')?.trim() ?? '';
    const includeFull = searchParams.get('include_full') === 'true';
    const explicitLimit = searchParams.get('limit');
    const defaultLimit = includeFull ? 1000 : 20;
    const limit = parsePositiveInt(explicitLimit, defaultLimit);

    let query = supabase
      .from('gallery_images')
      .select(
        includeFull
          ? 'id,src,full_src,alt,category,created_at'
          : 'id,src,alt,category,created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (queryText) {
      const safeSearch = escapeLike(queryText);
      query = query.or(`alt.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const bucketName = process.env.SUPABASE_GALLERY_BUCKET || 'gallery';
    const rows = ((data || []) as unknown) as GalleryRow[];
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const images = await Promise.all(
      pageRows.map(async (image) => {
        const thumbnailUrl = await resolveThumbnailUrl(image.src, bucketName, adminClient);

        if (!includeFull) {
          return {
            id: image.id,
            src: thumbnailUrl,
            alt: image.alt,
            category: image.category,
            created_at: image.created_at,
          };
        }

        const fullPath = extractStoragePath(image.full_src || '', bucketName);
        const { data: signed } = fullPath
          ? await adminClient.storage.from(bucketName).createSignedUrl(fullPath, 3600)
          : { data: null };

        return {
          id: image.id,
          src: thumbnailUrl,
          full_src: signed?.signedUrl || image.full_src || '',
          alt: image.alt,
          category: image.category,
          created_at: image.created_at,
        };
      })
    );

    const nextCursor = hasMore && images.length > 0 ? images[images.length - 1].created_at : null;

    return Response.json({
      images,
      nextCursor,
      hasMore,
      total: count ?? images.length,
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}
