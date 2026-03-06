import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: images, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Generate signed URLs for each image
    const bucketName = process.env.SUPABASE_GALLERY_BUCKET || 'gallery'
    
    const imagesWithSignedUrls = await Promise.all(
      (images || []).map(async (image) => {
        // Extract paths from the stored URLs
        const srcPath = image.src.split(`${bucketName}/`).pop()
        const fullSrcPath = image.full_src.split(`${bucketName}/`).pop()

        // Create signed URLs (valid for 1 hour)
        const { data: srcSigned } = await adminClient.storage
          .from(bucketName)
          .createSignedUrl(srcPath || '', 3600)

        const { data: fullSrcSigned } = await adminClient.storage
          .from(bucketName)
          .createSignedUrl(fullSrcPath || '', 3600)

        return {
          ...image,
          src: srcSigned?.signedUrl || image.src,
          full_src: fullSrcSigned?.signedUrl || image.full_src,
        }
      })
    )

    return Response.json({ images: imagesWithSignedUrls })
  } catch (error) {
    console.error('Gallery fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    )
  }
}
