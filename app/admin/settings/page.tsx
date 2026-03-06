'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  Mail, 
  Save, 
  Check, 
  AlertCircle,
  ImageIcon,
  Grid3X3,
  Type,
  Clock,
  Keyboard,
  Eye,
  Download,
  Heart,
  Maximize2,
  Search,
  Share2,
  Zap
} from 'lucide-react'

interface Settings {
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

const defaultSettings: Settings = {
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

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/gallery/settings')
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      setSettings({ ...defaultSettings, ...data.settings })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/gallery/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ 
    label, 
    description, 
    checked, 
    onChange,
    icon: Icon 
  }: { 
    label: string
    description: string
    checked: boolean
    onChange: () => void
    icon: any
  }) => (
    <label className="flex items-center justify-between p-4 rounded-xl bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5 text-stone-600" />
        </div>
        <div>
          <p className="font-medium text-stone-800 font-sans">{label}</p>
          <p className="text-sm text-stone-500 font-sans">{description}</p>
        </div>
      </div>
      <div
        className={`w-14 h-8 rounded-full p-1 transition-colors ${
          checked ? 'bg-rose-500' : 'bg-stone-300'
        }`}
        onClick={onChange}
      >
        <div
          className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-stone-800 mb-2">Gallery Settings</h1>
        <p className="text-stone-600 font-sans">
          Customize your gallery experience and features
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-sans">
          {error}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <Type className="w-5 h-5 text-rose-400" />
            General
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
              Gallery Title
            </label>
            <input
              type="text"
              value={settings.gallery_title}
              onChange={(e) => setSettings({ ...settings, gallery_title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
                Default View Mode
              </label>
              <select
                value={settings.default_view_mode}
                onChange={(e) => setSettings({ ...settings, default_view_mode: e.target.value as 'masonry' | 'grid' })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans bg-white"
              >
                <option value="masonry">Masonry (Pinterest-style)</option>
                <option value="grid">Grid (Uniform)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
                Photos Per Page
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={settings.items_per_page}
                onChange={(e) => setSettings({ ...settings, items_per_page: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Features
          </h2>
        </div>
        <div className="p-6 space-y-3">
          <Toggle
            label="Allow Downloads"
            description="Guests can download photos"
            checked={settings.allow_downloads}
            onChange={() => setSettings({ ...settings, allow_downloads: !settings.allow_downloads })}
            icon={Download}
          />
          <Toggle
            label="Allow Favorites"
            description="Guests can favorite photos"
            checked={settings.allow_favorites}
            onChange={() => setSettings({ ...settings, allow_favorites: !settings.allow_favorites })}
            icon={Heart}
          />
          <Toggle
            label="Allow Slideshow"
            description="Enable auto-play slideshow"
            checked={settings.allow_slideshow}
            onChange={() => setSettings({ ...settings, allow_slideshow: !settings.allow_slideshow })}
            icon={Clock}
          />
          <Toggle
            label="Allow Fullscreen"
            description="Enable fullscreen viewing"
            checked={settings.allow_fullscreen}
            onChange={() => setSettings({ ...settings, allow_fullscreen: !settings.allow_fullscreen })}
            icon={Maximize2}
          />
          <Toggle
            label="Allow Zoom"
            description="Enable zoom in lightbox"
            checked={settings.allow_zoom}
            onChange={() => setSettings({ ...settings, allow_zoom: !settings.allow_zoom })}
            icon={Search}
          />
          <Toggle
            label="Allow Share"
            description="Enable sharing options"
            checked={settings.allow_share}
            onChange={() => setSettings({ ...settings, allow_share: !settings.allow_share })}
            icon={Share2}
          />
        </div>
      </div>

      {/* Slideshow Settings */}
      {settings.allow_slideshow && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Slideshow Settings
            </h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
              Slideshow Interval (seconds)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={10}
                value={settings.slideshow_interval}
                onChange={(e) => setSettings({ ...settings, slideshow_interval: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="w-12 text-center font-sans font-medium text-stone-800">
                {settings.slideshow_interval}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Display Options */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            Display Options
          </h2>
        </div>
        <div className="p-6 space-y-3">
          <Toggle
            label="Show Category Filter"
            description="Display category filter buttons"
            checked={settings.show_category_filter}
            onChange={() => setSettings({ ...settings, show_category_filter: !settings.show_category_filter })}
            icon={Grid3X3}
          />
          <Toggle
            label="Show Photo Count"
            description="Display number of photos"
            checked={settings.show_photo_count}
            onChange={() => setSettings({ ...settings, show_photo_count: !settings.show_photo_count })}
            icon={ImageIcon}
          />
          <Toggle
            label="Keyboard Shortcuts"
            description="Enable keyboard navigation"
            checked={settings.enable_keyboard_shortcuts}
            onChange={() => setSettings({ ...settings, enable_keyboard_shortcuts: !settings.enable_keyboard_shortcuts })}
            icon={Keyboard}
          />
        </div>
      </div>

      {/* Watermark */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Watermark
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <Toggle
            label="Enable Watermark"
            description="Add watermark to photos"
            checked={settings.watermark_enabled}
            onChange={() => setSettings({ ...settings, watermark_enabled: !settings.watermark_enabled })}
            icon={Shield}
          />
          {settings.watermark_enabled && (
            <div>
              <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                value={settings.watermark_text}
                onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })}
                placeholder="Your Names or Wedding Date"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
              />
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="text-lg font-serif text-blue-800 mb-2 flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </h3>
        <p className="text-blue-700 font-sans text-sm mb-4">
          Manage who can access your gallery from the Supabase Dashboard. 
          Go to Authentication → Users to add or remove users.
        </p>
        <a
          href="https://app.supabase.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-sans hover:bg-blue-700 transition-colors"
        >
          Open Supabase Dashboard
          <Mail className="w-4 h-4" />
        </a>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-stone-800 text-white rounded-xl font-sans font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-stone-200"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save All Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}
