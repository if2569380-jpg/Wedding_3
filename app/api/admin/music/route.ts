import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET all songs (including inactive - for admin)
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching songs:', error);
      return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
    }

    return NextResponse.json({ songs });
  } catch (error) {
    console.error('Error in admin music API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST new song
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, artist, src, is_active, display_order, source_type } = body;

    if (!title || !src) {
      return NextResponse.json(
        { error: 'Title and src are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Auto-detect if it's a YouTube URL
    const isYouTubeUrl = /(?:youtube\.com|youtu\.be)/.test(src);
    const finalSourceType = source_type || (isYouTubeUrl ? 'youtube' : 'local');

    const { data: song, error } = await supabase
      .from('songs')
      .insert({
        title,
        artist: artist || null,
        src,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
        source_type: finalSourceType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating song:', error);
      return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
    }

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error('Error in POST song:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
