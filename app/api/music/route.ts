import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching songs:', error);
      return NextResponse.json({ files: [] });
    }

    const files = songs?.map(song => ({
      name: song.title,
      src: song.src,
      source_type: song.source_type,
    })) || [];

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error in music API:', error);
    return NextResponse.json({ files: [] });
  }
}
