import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { isAnalyticsEventType, isPhotoAnalyticsEventType } from '@/lib/analytics'

type AnalyticsPayload = {
  eventType?: unknown
  photoId?: unknown
  metadata?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as AnalyticsPayload
    const eventType = body.eventType

    if (!isAnalyticsEventType(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const rawPhotoId = typeof body.photoId === 'string' ? body.photoId.trim() : ''
    const photoId = rawPhotoId.length > 0 ? rawPhotoId : null

    if (isPhotoAnalyticsEventType(eventType) && !photoId) {
      return NextResponse.json({ error: 'photoId is required for this event type' }, { status: 400 })
    }

    if (eventType === 'login' && photoId) {
      return NextResponse.json({ error: 'photoId is not allowed for login events' }, { status: 400 })
    }

    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    const { error: insertError } = await adminClient
      .from('gallery_analytics_events')
      .insert({
        event_type: eventType,
        photo_id: photoId,
        user_id: user.id,
        user_email: user.email ?? null,
        metadata,
      })

    if (insertError) {
      if (insertError.code === '23503') {
        return NextResponse.json({ error: 'Invalid photoId' }, { status: 400 })
      }

      return NextResponse.json({ error: 'Failed to save analytics event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics event error:', error)
    return NextResponse.json({ error: 'Failed to save analytics event' }, { status: 500 })
  }
}
