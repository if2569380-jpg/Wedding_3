'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface GallerySettings {
  gallery_title: string
  allow_downloads: boolean
  allow_favorites: boolean
  allow_slideshow: boolean
  allow_fullscreen: boolean
  allow_zoom: boolean
  allow_share: boolean
  slideshow_interval: number
  default_view_mode: 'masonry' | 'grid'
  items_per_page: number
  show_category_filter: boolean
  show_photo_count: boolean
  enable_keyboard_shortcuts: boolean
  watermark_enabled: boolean
  watermark_text: string
}

const defaultSettings: GallerySettings = {
  gallery_title: 'Our Wedding Gallery',
  allow_downloads: true,
  allow_favorites: true,
  allow_slideshow: true,
  allow_fullscreen: true,
  allow_zoom: true,
  allow_share: true,
  slideshow_interval: 3,
  default_view_mode: 'masonry',
  items_per_page: 20,
  show_category_filter: true,
  show_photo_count: true,
  enable_keyboard_shortcuts: true,
  watermark_enabled: false,
  watermark_text: '',
}

interface GallerySettingsContextType {
  settings: GallerySettings
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
}

const GallerySettingsContext = createContext<GallerySettingsContextType | undefined>(undefined)

export function GallerySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GallerySettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchSettings() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/gallery/settings')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings')
      }
      
      // Merge with defaults to ensure all keys exist
      setSettings({ ...defaultSettings, ...data.settings })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      // Keep using defaults on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <GallerySettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </GallerySettingsContext.Provider>
  )
}

export function useGallerySettings() {
  const context = useContext(GallerySettingsContext)
  if (context === undefined) {
    throw new Error('useGallerySettings must be used within a GallerySettingsProvider')
  }
  return context
}
