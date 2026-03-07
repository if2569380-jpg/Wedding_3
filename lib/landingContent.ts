export const MAX_STORY_CARDS = 12;
export const MAX_COLLAGE_ITEMS = 24;

export const SECTION_TYPES = ['story', 'countdown'] as const;
export const ICON_TOKENS = ['heart', 'sparkles', 'calendar', 'music', 'timer', 'camera', 'map_pin'] as const;
export const BACKGROUND_TOKENS = ['ivory', 'sand', 'taupe', 'olive', 'charcoal'] as const;
export const TEXT_TOKENS = ['stone_dark', 'stone_light'] as const;
export const ACCENT_TOKENS = ['rose', 'amber', 'stone', 'blue', 'emerald'] as const;

export type SectionType = (typeof SECTION_TYPES)[number];
export type IconToken = (typeof ICON_TOKENS)[number];
export type BackgroundToken = (typeof BACKGROUND_TOKENS)[number];
export type TextToken = (typeof TEXT_TOKENS)[number];
export type AccentToken = (typeof ACCENT_TOKENS)[number];

export interface LandingStoryCard {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  image_path: string;
  image_alt: string;
  section_type: SectionType;
  countdown_target: string | null;
  icon_token: IconToken;
  background_token: BackgroundToken;
  text_token: TextToken;
  accent_token: AccentToken;
  order_index: number;
  is_active: boolean;
}

export interface LandingCollageItem {
  id?: string;
  caption: string;
  image_path: string;
  image_alt: string;
  order_index: number;
  is_active: boolean;
}

export const LEGACY_LANDING_IMAGE_PATHS = [
  'full/e2f0393f-98af-4204-bbfb-c35466695a02-1772830664406.jfif',
  'full/cfc8fac2-ad0a-4e8d-a9d1-7d934c682fb1-1772828895513.jfif',
  'full/82ebe6d4-d97a-44c1-b1cd-b6713c33b9d0-1772830623681.jfif',
  'full/1da8e16b-3082-4c77-967d-82a0ee36e8b2-1772828877550.jfif',
  'full/59181363-2d7c-427f-959c-509a4dd4d0d1-1772828921774.jfif',
] as const;

export const FALLBACK_STORY_CARDS: LandingStoryCard[] = [
  {
    title: 'The Beginning',
    subtitle: 'How we met',
    description:
      'It all started with a simple hello. From that moment, we knew our lives would never be the same.',
    image_path: LEGACY_LANDING_IMAGE_PATHS[0],
    image_alt: 'The Beginning',
    section_type: 'story',
    countdown_target: null,
    icon_token: 'heart',
    background_token: 'ivory',
    text_token: 'stone_dark',
    accent_token: 'rose',
    order_index: 0,
    is_active: true,
  },
  {
    title: 'The Proposal',
    subtitle: 'A moment in time',
    description:
      'Under the starlit sky, with the sound of waves crashing against the shore, he asked the question.',
    image_path: LEGACY_LANDING_IMAGE_PATHS[1],
    image_alt: 'The Proposal',
    section_type: 'story',
    countdown_target: null,
    icon_token: 'sparkles',
    background_token: 'sand',
    text_token: 'stone_dark',
    accent_token: 'amber',
    order_index: 1,
    is_active: true,
  },
  {
    title: 'The Big Day',
    subtitle: 'June 15, 2025',
    description:
      'Surrounded by our dearest family and friends, we promised to love and cherish each other for all our lives.',
    image_path: LEGACY_LANDING_IMAGE_PATHS[2],
    image_alt: 'The Big Day',
    section_type: 'story',
    countdown_target: null,
    icon_token: 'calendar',
    background_token: 'taupe',
    text_token: 'stone_dark',
    accent_token: 'stone',
    order_index: 2,
    is_active: true,
  },
  {
    title: 'The Celebration',
    subtitle: 'Dancing through the night',
    description:
      'The music played, the wine flowed, and we danced our first dance as husband and wife.',
    image_path: LEGACY_LANDING_IMAGE_PATHS[3],
    image_alt: 'The Celebration',
    section_type: 'story',
    countdown_target: null,
    icon_token: 'music',
    background_token: 'olive',
    text_token: 'stone_light',
    accent_token: 'stone',
    order_index: 3,
    is_active: true,
  },
  {
    title: 'Our Anniversary',
    subtitle: 'Married on November 1, 2024',
    description: 'Counting down to the next November 1 celebration of our marriage and memories together.',
    image_path: LEGACY_LANDING_IMAGE_PATHS[4],
    image_alt: 'Our Anniversary',
    section_type: 'countdown',
    countdown_target: null,
    icon_token: 'timer',
    background_token: 'charcoal',
    text_token: 'stone_light',
    accent_token: 'rose',
    order_index: 4,
    is_active: true,
  },
];

export const FALLBACK_COLLAGE_ITEMS: LandingCollageItem[] = [
  { caption: 'The first look', image_path: '', image_alt: 'The first look', order_index: 0, is_active: true },
  { caption: 'Details, weathered & wild', image_path: '', image_alt: 'Details', order_index: 1, is_active: true },
  { caption: 'The whole crew', image_path: '', image_alt: 'The whole crew', order_index: 2, is_active: true },
  { caption: 'The trembling lip', image_path: '', image_alt: 'The trembling lip', order_index: 3, is_active: true },
  { caption: 'Lights & laughter', image_path: '', image_alt: 'Lights & laughter', order_index: 4, is_active: true },
  { caption: 'Lavender & candlelight', image_path: '', image_alt: 'Lavender & candlelight', order_index: 5, is_active: true },
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isAllowedToken<T extends string>(value: string, tokens: readonly T[]): value is T {
  return tokens.includes(value as T);
}

function normalizeText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizePath(value: unknown) {
  return normalizeText(value).replace(/^\/+/, '');
}

function normalizeBool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeOrder(value: unknown, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function normalizeUuid(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : undefined;
}

function normalizeCountdownTarget(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

interface ValidationSuccess {
  ok: true;
  storyCards: LandingStoryCard[];
  collageItems: LandingCollageItem[];
}

interface ValidationError {
  ok: false;
  error: string;
}

export type LandingPayloadValidationResult = ValidationSuccess | ValidationError;

export function validateLandingPayload(payload: unknown): LandingPayloadValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, error: 'Request body must be an object.' };
  }

  const storyRaw = Array.isArray(payload.storyCards) ? payload.storyCards : null;
  const collageRaw = Array.isArray(payload.collageItems) ? payload.collageItems : null;

  if (!storyRaw || !collageRaw) {
    return { ok: false, error: 'storyCards and collageItems arrays are required.' };
  }

  if (storyRaw.length > MAX_STORY_CARDS) {
    return { ok: false, error: `storyCards cannot exceed ${MAX_STORY_CARDS}.` };
  }

  if (collageRaw.length > MAX_COLLAGE_ITEMS) {
    return { ok: false, error: `collageItems cannot exceed ${MAX_COLLAGE_ITEMS}.` };
  }

  const storyCards: LandingStoryCard[] = [];
  const collageItems: LandingCollageItem[] = [];

  for (let index = 0; index < storyRaw.length; index += 1) {
    const item = storyRaw[index];
    if (!isRecord(item)) {
      return { ok: false, error: `storyCards[${index}] must be an object.` };
    }

    const sectionType = normalizeText(item.section_type || 'story');
    const iconToken = normalizeText(item.icon_token || 'heart');
    const backgroundToken = normalizeText(item.background_token || 'ivory');
    const textToken = normalizeText(item.text_token || 'stone_dark');
    const accentToken = normalizeText(item.accent_token || 'rose');

    if (!isAllowedToken(sectionType, SECTION_TYPES)) {
      return { ok: false, error: `storyCards[${index}].section_type is invalid.` };
    }
    if (!isAllowedToken(iconToken, ICON_TOKENS)) {
      return { ok: false, error: `storyCards[${index}].icon_token is invalid.` };
    }
    if (!isAllowedToken(backgroundToken, BACKGROUND_TOKENS)) {
      return { ok: false, error: `storyCards[${index}].background_token is invalid.` };
    }
    if (!isAllowedToken(textToken, TEXT_TOKENS)) {
      return { ok: false, error: `storyCards[${index}].text_token is invalid.` };
    }
    if (!isAllowedToken(accentToken, ACCENT_TOKENS)) {
      return { ok: false, error: `storyCards[${index}].accent_token is invalid.` };
    }

    const title = normalizeText(item.title);
    const subtitle = normalizeText(item.subtitle);
    const description = normalizeText(item.description);
    const imagePath = normalizePath(item.image_path);
    const imageAlt = normalizeText(item.image_alt) || title;

    if (!title || !subtitle || !description || !imagePath) {
      return { ok: false, error: `storyCards[${index}] is missing required fields.` };
    }

    storyCards.push({
      id: normalizeUuid(item.id),
      title,
      subtitle,
      description,
      image_path: imagePath,
      image_alt: imageAlt,
      section_type: sectionType,
      countdown_target: normalizeCountdownTarget(item.countdown_target),
      icon_token: iconToken,
      background_token: backgroundToken,
      text_token: textToken,
      accent_token: accentToken,
      order_index: normalizeOrder(item.order_index, index),
      is_active: normalizeBool(item.is_active, true),
    });
  }

  for (let index = 0; index < collageRaw.length; index += 1) {
    const item = collageRaw[index];
    if (!isRecord(item)) {
      return { ok: false, error: `collageItems[${index}] must be an object.` };
    }

    const caption = normalizeText(item.caption);
    const imagePath = normalizePath(item.image_path);
    const imageAlt = normalizeText(item.image_alt) || caption;

    if (!caption || !imagePath) {
      return { ok: false, error: `collageItems[${index}] is missing required fields.` };
    }

    collageItems.push({
      id: normalizeUuid(item.id),
      caption,
      image_path: imagePath,
      image_alt: imageAlt,
      order_index: normalizeOrder(item.order_index, index),
      is_active: normalizeBool(item.is_active, true),
    });
  }

  return { ok: true, storyCards, collageItems };
}
