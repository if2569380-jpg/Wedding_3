export const DEFAULT_GALLERY_BUCKET = 'gallery';
export const DEFAULT_LANDING_BUCKET = 'landing-public';

function getSupabaseBaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

export function getLandingBucketName() {
  return (
    process.env.SUPABASE_LANDING_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_LANDING_BUCKET ||
    DEFAULT_LANDING_BUCKET
  );
}

export function getGalleryBucketName() {
  return process.env.SUPABASE_GALLERY_BUCKET || DEFAULT_GALLERY_BUCKET;
}

export function buildPublicStorageUrl(bucketName: string, path: string) {
  const baseUrl = getSupabaseBaseUrl();
  const normalizedPath = path.trim().replace(/^\/+/, '');

  if (!baseUrl || !bucketName || !normalizedPath) {
    return '';
  }

  const encodedPath = normalizedPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${baseUrl}/storage/v1/object/public/${bucketName}/${encodedPath}`;
}
