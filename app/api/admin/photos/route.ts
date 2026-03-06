import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

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
    if (alt !== undefined) updates.alt = alt
    if (category !== undefined) updates.category = category

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
    const thumbnailPath = image.src.split(`${bucketName}/`).pop()
    const fullPath = image.full_src.split(`${bucketName}/`).pop()
    
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
