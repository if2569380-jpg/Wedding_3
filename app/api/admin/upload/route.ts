import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const category = formData.get('category') as string

    if (!file || !title || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${safeTitle}-${timestamp}.${extension}`
    const bucketName = process.env.SUPABASE_GALLERY_BUCKET || 'gallery'

    // Upload thumbnail/preview version
    const thumbnailPath = `thumbnails/${filename}`
    const { error: thumbnailError } = await adminClient.storage
      .from(bucketName)
      .upload(thumbnailPath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (thumbnailError) {
      console.error('Thumbnail upload error:', thumbnailError)
      return NextResponse.json(
        { error: 'Failed to upload thumbnail' },
        { status: 500 }
      )
    }

    // Upload full resolution version
    const fullPath = `full/${filename}`
    const { error: fullError } = await adminClient.storage
      .from(bucketName)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (fullError) {
      console.error('Full image upload error:', fullError)
      // Clean up thumbnail if full upload fails
      await adminClient.storage.from(bucketName).remove([thumbnailPath])
      return NextResponse.json(
        { error: 'Failed to upload full image' },
        { status: 500 }
      )
    }

    // Keep thumbnails public for fast delivery and keep full files private (signed on demand).
    const { data: { publicUrl: thumbnailUrl } } = adminClient.storage
      .from(bucketName)
      .getPublicUrl(thumbnailPath)

    // Save metadata to database
    const { data: imageData, error: dbError } = await supabase
      .from('gallery_images')
      .insert([
        {
          src: thumbnailUrl,
          full_src: fullPath,
          alt: title,
          category: category,
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded files
      await adminClient.storage.from(bucketName).remove([thumbnailPath, fullPath])
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      image: imageData,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
