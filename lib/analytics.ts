export const ANALYTICS_EVENT_TYPES = ['view', 'download', 'share', 'login'] as const

export const PHOTO_ANALYTICS_EVENT_TYPES = ['view', 'download', 'share'] as const

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number]
export type PhotoAnalyticsEventType = (typeof PHOTO_ANALYTICS_EVENT_TYPES)[number]

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return typeof value === 'string' && (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value)
}

export function isPhotoAnalyticsEventType(value: unknown): value is PhotoAnalyticsEventType {
  return typeof value === 'string' && (PHOTO_ANALYTICS_EVENT_TYPES as readonly string[]).includes(value)
}
