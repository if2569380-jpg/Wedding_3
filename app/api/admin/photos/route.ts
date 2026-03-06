import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

function extractStoragePath(value: string, bucketName: string) {
  if (!value) return null
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, '')

  try {
    const url = new URL(value)
    const marker = `/storage/v1/object/${url.pathname.includes('/sign/') ? 'sign' : 'public'}/${bucketName}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null
    const start = markerIndex + marker.length
    return decodeURIComponent(url.pathname.slice(start))
  } catch {
    return null
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, alt, category } = body

    if (!id) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    // Build update object
    const updates: { alt?: string; category?: string } = {}
    if (alt !== undefined) {
      const normalizedAlt = typeof alt === 'string' ? alt.trim() : ''
      if (!normalizedAlt) {
        return NextResponse.json({ error: 'Photo title cannot be empty' }, { status: 400 })
      }
      updates.alt = normalizedAlt
    }
    if (category !== undefined) {
      const normalizedCategory = typeof category === 'string' ? category.trim() : ''
      if (!normalizedCategory) {
        return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 })
      }
      updates.category = normalizedCategory
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update in database using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('gallery_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      if (error.code === '23514' && error.message.includes('gallery_images_category_check')) {
        return NextResponse.json(
          {
            error: 'Category validation failed in database. Apply migration 005_allow_custom_gallery_categories.sql and try again.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Photo updated successfully',
      image: data 
    })
  } catch (error) {
    console.error('Update photo error:', error)
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get image ID from URL
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID required' },
        { status: 400 }
      )
    }

    // Get image data to find file paths
    const { data: image, error: fetchError } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Extract file paths from URLs
    const bucketName = process.env.SUPABASE_GALLERY_BUCKET || 'gallery'
    
    // Delete from storage (extract path from URL)
    const thumbnailPath = extractStoragePath(image.src, bucketName)
    const fullPath = extractStoragePath(image.full_src, bucketName)
    
    if (thumbnailPath) {
      await supabase.storage.from(bucketName).remove([thumbnailPath])
    }
    if (fullPath) {
      await supabase.storage.from(bucketName).remove([fullPath])
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
