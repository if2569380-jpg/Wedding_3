import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/gallery/settings - Get all gallery settings (public)
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: settings, error } = await supabase
      .from('gallery_settings')
      .select('key, value')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert array to object for easier frontend use
    const settingsObject = (settings || []).reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(
      { settings: settingsObject },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery settings' },
      { status: 500 }
    )
  }
}

// POST /api/gallery/settings - Update settings (authenticated only)
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

    const updates = await request.json()

    const payload = Object.entries(updates).map(([key, value]) => ({ key, value }))

    if (payload.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const { error: upsertError } = await adminClient
      .from('gallery_settings')
      .upsert(payload, { onConflict: 'key' })

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to update settings', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, updated: payload.length })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
