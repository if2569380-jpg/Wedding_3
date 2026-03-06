'use client'

import { useState, useEffect } from 'react'
import {
  Music,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  GripVertical,
  Volume2,
  VolumeX,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Youtube
} from 'lucide-react'

interface Song {
  id: string
  title: string
  artist: string | null
  src: string
  is_active: boolean
  display_order: number
  created_at: string
  source_type: 'local' | 'youtube'
}

export default function AdminMusic() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    src: '',
    is_active: true,
    display_order: 0,
    source_type: 'local' as 'local' | 'youtube',
  })

  useEffect(() => {
    fetchSongs()
  }, [])

  async function fetchSongs() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/music')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch songs')
      }

      setSongs(data.songs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.title || !formData.src) {
      setError('Title and source URL are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          display_order: songs.length + 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add song')
      }

      setSongs([...songs, data.song])
      resetForm()
      setIsAdding(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add song')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formData.title || !formData.src) {
      setError('Title and source URL are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/music/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update song')
      }

      setSongs(songs.map(s => s.id === id ? data.song : s))
      resetForm()
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update song')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return

    try {
      const response = await fetch(`/api/admin/music/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete song')
      }

      setSongs(songs.filter(s => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete song')
    }
  }

  const handleToggleActive = async (song: Song) => {
    try {
      const response = await fetch(`/api/admin/music/${song.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !song.is_active }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update song')
      }

      setSongs(songs.map(s => s.id === song.id ? data.song : s))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update song')
    }
  }

  const startEditing = (song: Song) => {
    setFormData({
      title: song.title,
      artist: song.artist || '',
      src: song.src,
      is_active: song.is_active,
      display_order: song.display_order,
      source_type: song.source_type,
    })
    setEditingId(song.id)
    setIsAdding(false)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      artist: '',
      src: '',
      is_active: true,
      display_order: 0,
      source_type: 'local',
    })
    setError(null)
  }

  const cancelEditing = () => {
    resetForm()
    setIsAdding(false)
    setEditingId(null)
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Music Management</h1>
          <p className="text-stone-600 font-sans">
            Manage background music for the wedding gallery
          </p>
        </div>
        <button
          onClick={() => fetchSongs()}
          className="p-3 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-stone-600" />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-sans flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Add Song Button */}
      {!isAdding && !editingId && (
        <button
          onClick={() => {
            resetForm()
            setIsAdding(true)
          }}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-rose-400 hover:bg-rose-50 transition-all font-sans text-stone-600 hover:text-rose-600"
        >
          <Plus className="w-5 h-5" />
          Add New Song
        </button>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-rose-50 to-pink-50">
            <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
              <Music className="w-5 h-5 text-rose-400" />
              {editingId ? 'Edit Song' : 'Add New Song'}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
                Song Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter song title"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
                Artist
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                placeholder="Enter artist name (optional)"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 font-sans mb-2">
                Source URL *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.src}
                  onChange={(e) => {
                    const src = e.target.value;
                    const isYouTube = /(?:youtube\.com|youtu\.be)/.test(src);
                    setFormData({ 
                      ...formData, 
                      src,
                      source_type: isYouTube ? 'youtube' : 'local'
                    });
                  }}
                  placeholder="/music/song.mp3 or https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
                />
                <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              </div>
              <p className="text-xs text-stone-500 mt-1 font-sans">
                {formData.source_type === 'youtube' 
                  ? 'YouTube URL detected - will use YouTube player' 
                  : 'Use /music/filename.mp3 for local files or paste a YouTube URL'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    formData.is_active ? 'bg-rose-500' : 'bg-stone-300'
                  }`}
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      formData.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="font-sans text-stone-700">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-xl font-sans font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {editingId ? 'Update Song' : 'Add Song'}
              </button>
              <button
                onClick={cancelEditing}
                className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-sans font-medium hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Songs List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-rose-400" />
            Playlist ({songs.length} songs)
          </h2>
        </div>
        <div className="divide-y divide-stone-100">
          {songs.length === 0 ? (
            <div className="p-12 text-center text-stone-500 font-sans">
              <Music className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>No songs added yet. Click &quot;Add New Song&quot; to get started.</p>
            </div>
          ) : (
            songs.map((song, index) => (
              <div
                key={song.id}
                className="p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex flex-col items-center gap-1 text-stone-400">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs font-sans">{index + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans font-medium text-stone-800 truncate">
                      {song.title}
                    </h3>
                    {song.source_type === 'youtube' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-sans flex items-center gap-1">
                        <Youtube className="w-3 h-3" />
                        YouTube
                      </span>
                    )}
                    {!song.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-stone-200 text-stone-600 font-sans">
                        Inactive
                      </span>
                    )}
                  </div>
                  {song.artist && (
                    <p className="text-sm text-stone-500 font-sans truncate">
                      {song.artist}
                    </p>
                  )}
                  <p className="text-xs text-stone-400 font-sans truncate mt-0.5">
                    {song.src}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(song)}
                    className={`p-2 rounded-lg transition-colors ${
                      song.is_active
                        ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                        : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                    }`}
                    title={song.is_active ? 'Active' : 'Inactive'}
                  >
                    {song.is_active ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => startEditing(song)}
                    className="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(song.id)}
                    className="p-2 rounded-lg bg-stone-100 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="text-lg font-serif text-blue-800 mb-2 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Music Settings
        </h3>
        <ul className="space-y-2 text-sm text-blue-700 font-sans">
          <li>• Active songs will appear in the gallery music player</li>
          <li>• Upload MP3 files to public/music folder for local playback</li>
          <li>• Use /music/filename.mp3 as the source URL for local files</li>
          <li>• Paste YouTube URLs (youtube.com or youtu.be) for YouTube playback</li>
          <li>• YouTube videos play in the background without showing the video</li>
        </ul>
      </div>
    </div>
  )
}
