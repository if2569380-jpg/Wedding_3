import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { createClient as createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// PUT - Update song
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, artist, src, is_active, display_order, source_type } = body;

    const adminClient = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (artist !== undefined) updateData.artist = artist;
    if (src !== undefined) updateData.src = src;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (source_type !== undefined) {
      updateData.source_type = source_type;
    } else if (src !== undefined) {
      // Auto-detect if src changed
      const isYouTubeUrl = /(?:youtube\.com|youtu\.be)/.test(src);
      updateData.source_type = isYouTubeUrl ? 'youtube' : 'local';
    }

    const { data: song, error } = await adminClient
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating song:', error);
      return NextResponse.json({ error: 'Failed to update song' }, { status: 500 });
    }

    return NextResponse.json({ song });
  } catch (error) {
    console.error('Error in PUT song:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete song
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting song:', error);
      return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE song:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
