import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { validateLandingPayload } from '@/lib/landingContent';

async function ensureAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const user = await ensureAuthenticated();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const [{ data: storyCards, error: storyError }, { data: collageItems, error: collageError }] =
      await Promise.all([
        admin
          .from('landing_story_cards')
          .select(
            'id,title,subtitle,description,image_path,image_alt,section_type,countdown_target,icon_token,background_token,text_token,accent_token,order_index,is_active,created_at,updated_at'
          )
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
        admin
          .from('landing_collage_items')
          .select('id,caption,image_path,image_alt,order_index,is_active,created_at,updated_at')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 });
    }
    if (collageError) {
      return NextResponse.json({ error: collageError.message }, { status: 500 });
    }

    return NextResponse.json({
      storyCards: storyCards || [],
      collageItems: collageItems || [],
    });
  } catch (error) {
    console.error('Admin landing content GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch landing content' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await ensureAuthenticated();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const validated = validateLandingPayload(payload);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const admin = createAdminClient();

    const [{ data: existingStory, error: storyFetchError }, { data: existingCollage, error: collageFetchError }] =
      await Promise.all([
        admin.from('landing_story_cards').select('id'),
        admin.from('landing_collage_items').select('id'),
      ]);

    if (storyFetchError || collageFetchError) {
      return NextResponse.json({ error: 'Failed to load existing content' }, { status: 500 });
    }

    const storyRows = validated.storyCards.map((item, index) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image_path: item.image_path,
      image_alt: item.image_alt,
      section_type: item.section_type,
      countdown_target: item.countdown_target,
      icon_token: item.icon_token,
      background_token: item.background_token,
      text_token: item.text_token,
      accent_token: item.accent_token,
      order_index: index,
      is_active: item.is_active,
    }));

    const collageRows = validated.collageItems.map((item, index) => ({
      id: item.id || crypto.randomUUID(),
      caption: item.caption,
      image_path: item.image_path,
      image_alt: item.image_alt,
      order_index: index,
      is_active: item.is_active,
    }));

    if (storyRows.length > 0) {
      const { error } = await admin
        .from('landing_story_cards')
        .upsert(storyRows, { onConflict: 'id', defaultToNull: false });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (collageRows.length > 0) {
      const { error } = await admin
        .from('landing_collage_items')
        .upsert(collageRows, { onConflict: 'id', defaultToNull: false });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const storyKeepIds = new Set(validated.storyCards.map((item) => item.id).filter((id): id is string => !!id));
    const collageKeepIds = new Set(
      validated.collageItems.map((item) => item.id).filter((id): id is string => !!id)
    );

    const storyDeleteIds =
      (existingStory || [])
        .map((row) => row.id)
        .filter((id) => !storyKeepIds.has(id)) || [];
    const collageDeleteIds =
      (existingCollage || [])
        .map((row) => row.id)
        .filter((id) => !collageKeepIds.has(id)) || [];

    if (storyDeleteIds.length > 0) {
      const { error } = await admin.from('landing_story_cards').delete().in('id', storyDeleteIds);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (collageDeleteIds.length > 0) {
      const { error } = await admin.from('landing_collage_items').delete().in('id', collageDeleteIds);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      updated: {
        storyCards: storyRows.length,
        collageItems: collageRows.length,
      },
    });
  } catch (error) {
    console.error('Admin landing content PUT error:', error);
    return NextResponse.json({ error: 'Failed to save landing content' }, { status: 500 });
  }
}
