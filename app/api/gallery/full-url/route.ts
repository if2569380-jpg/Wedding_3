import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';

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

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const bucketName = process.env.SUPABASE_GALLERY_BUCKET || 'gallery';

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: image, error } = await supabase
      .from('gallery_images')
      .select('id, full_src')
      .eq('id', id)
      .single();

    if (error || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const fullPath = extractStoragePath(image.full_src, bucketName);
    if (!fullPath) {
      return NextResponse.json({ error: 'Invalid full image path' }, { status: 400 });
    }

    const expiresIn = 3600;
    const { data: signed, error: signError } = await adminClient.storage
      .from(bucketName)
      .createSignedUrl(fullPath, expiresIn);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Failed to sign image url' }, { status: 500 });
    }

    return NextResponse.json({
      id: image.id,
      full_src: signed.signedUrl,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Gallery full url error:', error);
    return NextResponse.json({ error: 'Failed to generate full image url' }, { status: 500 });
  }
}
