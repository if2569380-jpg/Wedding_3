import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { buildPublicStorageUrl, getLandingBucketName } from '@/lib/storageUrl';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeKind(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return 'story';
  return value === 'collage' ? 'collage' : 'story';
}

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase().trim();
  if (fromName) return fromName;

  const fromType = file.type.split('/').pop()?.toLowerCase().trim();
  return fromType || 'jpg';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = normalizeKind(formData.get('kind'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size must be <= 10MB.' }, { status: 400 });
    }

    const landingBucket = getLandingBucketName();
    const extension = getFileExtension(file);
    const folder = kind === 'collage' ? 'collage' : 'story';
    const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from(landingBucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      image_path: filePath,
      public_url: buildPublicStorageUrl(landingBucket, filePath),
      kind: folder,
    });
  } catch (uploadError) {
    console.error('Landing content upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
