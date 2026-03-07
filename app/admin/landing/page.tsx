'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  ACCENT_TOKENS,
  BACKGROUND_TOKENS,
  ICON_TOKENS,
  MAX_COLLAGE_ITEMS,
  MAX_STORY_CARDS,
  SECTION_TYPES,
  TEXT_TOKENS,
  type AccentToken,
  type BackgroundToken,
  type IconToken,
  type LandingCollageItem,
  type LandingStoryCard,
  type SectionType,
  type TextToken,
} from '@/lib/landingContent';

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LANDING_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LANDING_BUCKET || 'landing-public';

interface StoryCardForm extends LandingStoryCard {
  id?: string;
}

interface CollageItemForm extends LandingCollageItem {
  id?: string;
}

function makePublicUrl(path: string) {
  const normalized = path.trim().replace(/^\/+/, '');
  if (!PUBLIC_SUPABASE_URL || !normalized) return '';
  const encoded = normalized
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LANDING_BUCKET}/${encoded}`;
}

function createStoryCard(orderIndex: number): StoryCardForm {
  return {
    title: '',
    subtitle: '',
    description: '',
    image_path: '',
    image_alt: '',
    section_type: 'story',
    countdown_target: null,
    icon_token: 'heart',
    background_token: 'ivory',
    text_token: 'stone_dark',
    accent_token: 'rose',
    order_index: orderIndex,
    is_active: true,
  };
}

function createCollageItem(orderIndex: number): CollageItemForm {
  return {
    caption: '',
    image_path: '',
    image_alt: '',
    order_index: orderIndex,
    is_active: true,
  };
}

function normalizeStoryOrder(items: StoryCardForm[]) {
  return items.map((item, index) => ({ ...item, order_index: index }));
}

function normalizeCollageOrder(items: CollageItemForm[]) {
  return items.map((item, index) => ({ ...item, order_index: index }));
}

export default function AdminLandingContentPage() {
  const [storyCards, setStoryCards] = useState<StoryCardForm[]>([]);
  const [collageItems, setCollageItems] = useState<CollageItemForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const canAddStory = storyCards.length < MAX_STORY_CARDS;
  const canAddCollage = collageItems.length < MAX_COLLAGE_ITEMS;

  const hasInvalidEntries = useMemo(() => {
    const invalidStory = storyCards.some(
      (item) =>
        !item.title.trim() ||
        !item.subtitle.trim() ||
        !item.description.trim() ||
        !item.image_path.trim() ||
        !item.image_alt.trim()
    );
    const invalidCollage = collageItems.some(
      (item) => !item.caption.trim() || !item.image_path.trim() || !item.image_alt.trim()
    );
    return invalidStory || invalidCollage;
  }, [collageItems, storyCards]);

  async function fetchLandingContent() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/admin/landing-content');
      const payload = (await response.json()) as {
        error?: string;
        storyCards?: StoryCardForm[];
        collageItems?: CollageItemForm[];
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load landing content');
      }

      setStoryCards(normalizeStoryOrder(payload.storyCards || []));
      setCollageItems(normalizeCollageOrder(payload.collageItems || []));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load landing content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLandingContent();
  }, []);

  function moveStoryItem(index: number, direction: -1 | 1) {
    setStoryCards((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const current = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = current;
      return normalizeStoryOrder(next);
    });
  }

  function moveCollageItem(index: number, direction: -1 | 1) {
    setCollageItems((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const current = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = current;
      return normalizeCollageOrder(next);
    });
  }

  async function uploadImage(file: File, kind: 'story' | 'collage') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);

    const response = await fetch('/api/admin/landing-content/upload', {
      method: 'POST',
      body: formData,
    });

    const payload = (await response.json()) as { error?: string; image_path?: string };
    if (!response.ok || !payload.image_path) {
      throw new Error(payload.error || 'Image upload failed');
    }

    return payload.image_path;
  }

  async function handleStoryImageUpload(index: number, file: File) {
    const key = `story-${index}`;
    setUploadingKey(key);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const imagePath = await uploadImage(file, 'story');
      setStoryCards((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                image_path: imagePath,
                image_alt: item.image_alt.trim() ? item.image_alt : item.title || file.name,
              }
            : item
        )
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Image upload failed');
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleCollageImageUpload(index: number, file: File) {
    const key = `collage-${index}`;
    setUploadingKey(key);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const imagePath = await uploadImage(file, 'collage');
      setCollageItems((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                image_path: imagePath,
                image_alt: item.image_alt.trim() ? item.image_alt : item.caption || file.name,
              }
            : item
        )
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Image upload failed');
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleBootstrap() {
    setBootstrapping(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/admin/landing-content/bootstrap', {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        skipped?: boolean;
        seeded?: { storyCards?: number; collageItems?: number };
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Bootstrap failed');
      }

      if (payload.skipped) {
        setStatusMessage(payload.message || 'Bootstrap skipped because data already exists.');
      } else {
        const storySeeded = payload.seeded?.storyCards || 0;
        const collageSeeded = payload.seeded?.collageItems || 0;
        setStatusMessage(`Bootstrap complete. Seeded ${storySeeded} story card(s), ${collageSeeded} collage item(s).`);
      }

      await fetchLandingContent();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Bootstrap failed');
    } finally {
      setBootstrapping(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin/landing-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyCards: normalizeStoryOrder(storyCards),
          collageItems: normalizeCollageOrder(collageItems),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save landing content');
      }

      setStatusMessage('Landing content saved successfully.');
      await fetchLandingContent();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save landing content');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-800">Landing Content</h1>
          <p className="text-stone-600 text-sm font-sans">Manage story sections and scattered polaroid collage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBootstrap}
            disabled={bootstrapping || saving}
            className="min-h-11 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-sans hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${bootstrapping ? 'animate-spin' : ''}`} />
            Bootstrap Existing Content
          </button>
          <button
            onClick={handleSave}
            disabled={saving || hasInvalidEntries}
            className="min-h-11 px-5 py-2 rounded-lg bg-stone-800 text-white text-sm font-sans hover:bg-stone-700 disabled:opacity-60 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Landing Content'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-sans flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          {errorMessage}
        </div>
      )}

      {statusMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-sans flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5" />
          {statusMessage}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-stone-800">Landing Story Cards</h2>
          <button
            onClick={() => setStoryCards((prev) => [...prev, createStoryCard(prev.length)])}
            disabled={!canAddStory}
            className="min-h-10 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 text-sm font-sans hover:bg-rose-200 disabled:opacity-60 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Story Card
          </button>
        </div>

        <p className="text-xs text-stone-500 font-sans">
          {storyCards.length}/{MAX_STORY_CARDS} cards
        </p>

        <div className="space-y-4">
          {storyCards.map((card, index) => {
            const previewUrl = makePublicUrl(card.image_path);
            const isUploading = uploadingKey === `story-${index}`;
            return (
              <div key={card.id || `story-${index}`} className="rounded-xl border border-stone-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-sans text-stone-600">Story #{index + 1}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveStoryItem(index, -1)}
                      disabled={index === 0}
                      className="p-2 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-40"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveStoryItem(index, 1)}
                      disabled={index === storyCards.length - 1}
                      className="p-2 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-40"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStoryCards((prev) => normalizeStoryOrder(prev.filter((_, i) => i !== index)))}
                      className="p-2 rounded-lg bg-rose-100 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={card.title}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Title"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                  <input
                    value={card.subtitle}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, subtitle: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Subtitle"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                </div>

                <textarea
                  value={card.description}
                  onChange={(event) =>
                    setStoryCards((prev) =>
                      prev.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, description: event.target.value } : item
                      )
                    )
                  }
                  placeholder="Description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                />

                <div className="grid md:grid-cols-3 gap-3">
                  <select
                    value={card.section_type}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, section_type: event.target.value as SectionType } : item
                        )
                      )
                    }
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm bg-white"
                  >
                    {SECTION_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select
                    value={card.icon_token}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, icon_token: event.target.value as IconToken } : item
                        )
                      )
                    }
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm bg-white"
                  >
                    {ICON_TOKENS.map((value) => (
                      <option key={value} value={value}>
                        icon: {value}
                      </option>
                    ))}
                  </select>
                  <select
                    value={card.background_token}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, background_token: event.target.value as BackgroundToken }
                            : item
                        )
                      )
                    }
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm bg-white"
                  >
                    {BACKGROUND_TOKENS.map((value) => (
                      <option key={value} value={value}>
                        bg: {value}
                      </option>
                    ))}
                  </select>
                  <select
                    value={card.text_token}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, text_token: event.target.value as TextToken } : item
                        )
                      )
                    }
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm bg-white"
                  >
                    {TEXT_TOKENS.map((value) => (
                      <option key={value} value={value}>
                        text: {value}
                      </option>
                    ))}
                  </select>
                  <select
                    value={card.accent_token}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, accent_token: event.target.value as AccentToken } : item
                        )
                      )
                    }
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm bg-white"
                  >
                    {ACCENT_TOKENS.map((value) => (
                      <option key={value} value={value}>
                        accent: {value}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-sans text-stone-700">
                    <input
                      type="checkbox"
                      checked={card.is_active}
                      onChange={(event) =>
                        setStoryCards((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, is_active: event.target.checked } : item
                          )
                        )
                      }
                    />
                    Active
                  </label>
                </div>

                {card.section_type === 'countdown' && (
                  <input
                    type="datetime-local"
                    value={card.countdown_target ? card.countdown_target.slice(0, 16) : ''}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, countdown_target: event.target.value ? new Date(event.target.value).toISOString() : null }
                            : item
                        )
                      )
                    }
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                )}

                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={card.image_path}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, image_path: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Image path (auto-filled on upload)"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                  <input
                    value={card.image_alt}
                    onChange={(event) =>
                      setStoryCards((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, image_alt: event.target.value } : item
                        )
                      )
                    }
                    placeholder="Image alt text"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex min-h-10 items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 text-stone-700 text-sm font-sans cursor-pointer w-fit">
                    <UploadCloud className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleStoryImageUpload(index, file);
                        }
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={card.image_alt || card.title || `Story image ${index + 1}`}
                      className="w-28 h-20 rounded-lg border border-stone-200 object-cover"
                    />
                  ) : (
                    <div className="w-28 h-20 rounded-lg border border-dashed border-stone-300 bg-stone-50" />
                  )}
                </div>
              </div>
            );
          })}

          {storyCards.length === 0 && (
            <p className="text-sm text-stone-500 font-sans">No story cards yet. Add one to begin.</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-stone-800">Polaroid Collage Items</h2>
          <button
            onClick={() => setCollageItems((prev) => [...prev, createCollageItem(prev.length)])}
            disabled={!canAddCollage}
            className="min-h-10 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 text-sm font-sans hover:bg-rose-200 disabled:opacity-60 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Collage Item
          </button>
        </div>

        <p className="text-xs text-stone-500 font-sans">
          {collageItems.length}/{MAX_COLLAGE_ITEMS} items
        </p>

        <div className="space-y-4">
          {collageItems.map((item, index) => {
            const previewUrl = makePublicUrl(item.image_path);
            const isUploading = uploadingKey === `collage-${index}`;
            return (
              <div key={item.id || `collage-${index}`} className="rounded-xl border border-stone-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-sans text-stone-600">Item #{index + 1}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveCollageItem(index, -1)}
                      disabled={index === 0}
                      className="p-2 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-40"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveCollageItem(index, 1)}
                      disabled={index === collageItems.length - 1}
                      className="p-2 rounded-lg bg-stone-100 text-stone-600 disabled:opacity-40"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setCollageItems((prev) => normalizeCollageOrder(prev.filter((_, itemIndex) => itemIndex !== index)))
                      }
                      className="p-2 rounded-lg bg-rose-100 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={item.caption}
                    onChange={(event) =>
                      setCollageItems((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, caption: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Caption"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                  <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-sans text-stone-700">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) =>
                        setCollageItems((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, is_active: event.target.checked } : row
                          )
                        )
                      }
                    />
                    Active
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={item.image_path}
                    onChange={(event) =>
                      setCollageItems((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, image_path: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Image path (auto-filled on upload)"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                  <input
                    value={item.image_alt}
                    onChange={(event) =>
                      setCollageItems((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, image_alt: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Image alt text"
                    className="min-h-10 px-3 py-2 rounded-lg border border-stone-200 font-sans text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="inline-flex min-h-10 items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 text-stone-700 text-sm font-sans cursor-pointer w-fit">
                    <UploadCloud className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleCollageImageUpload(index, file);
                        }
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={item.image_alt || item.caption || `Collage image ${index + 1}`}
                      className="w-28 h-20 rounded-lg border border-stone-200 object-cover"
                    />
                  ) : (
                    <div className="w-28 h-20 rounded-lg border border-dashed border-stone-300 bg-stone-50" />
                  )}
                </div>
              </div>
            );
          })}

          {collageItems.length === 0 && (
            <p className="text-sm text-stone-500 font-sans">No collage items yet. Add one to begin.</p>
          )}
        </div>
      </section>
    </div>
  );
}
