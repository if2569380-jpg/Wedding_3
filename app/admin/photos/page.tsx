'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Trash2,
  Search,
  Filter,
  Grid3X3,
  LayoutList,
  AlertCircle,
  X,
  Check,
  ExternalLink,
  Pencil,
  Plus,
} from 'lucide-react'

interface GalleryImage {
  id: string
  src: string
  full_src: string
  alt: string
  category: string
  created_at: string
}

const DEFAULT_CATEGORIES = ['All', 'Ceremony', 'Reception', 'Portraits', 'Details']
const CUSTOM_CATEGORIES_SETTINGS_KEY = 'custom_categories'

function normalizeCategory(value: string) {
  return value.trim()
}

function uniqCategories(values: string[]) {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const rawValue of values) {
    const value = normalizeCategory(rawValue)
    if (!value) continue

    const lower = value.toLowerCase()
    if (seen.has(lower)) continue

    seen.add(lower)
    unique.push(value)
  }

  return unique
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkUpdatingCategory, setBulkUpdatingCategory] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('Ceremony')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<GalleryImage | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [persistingCategories, setPersistingCategories] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPhotos()
    fetchCustomCategories()
  }, [])

  async function fetchPhotos() {
    try {
      setLoading(true)
      const response = await fetch('/api/gallery?include_full=true')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch photos')
      }

      setPhotos(data.images || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCustomCategories() {
    try {
      setLoadingCategories(true)

      const response = await fetch('/api/gallery/settings')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load categories')
      }

      const persisted = Array.isArray(data.settings?.[CUSTOM_CATEGORIES_SETTINGS_KEY])
        ? data.settings[CUSTOM_CATEGORIES_SETTINGS_KEY]
        : []

      const validCustomCategories = uniqCategories(
        persisted.filter((category: unknown) => typeof category === 'string')
      ).filter(
        (category) => !DEFAULT_CATEGORIES.some((defaultCategory) => defaultCategory.toLowerCase() === category.toLowerCase())
      )

      setCustomCategories(validCustomCategories)
      if (validCustomCategories.length > 0) {
        setBulkCategory(validCustomCategories[0])
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load custom categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  async function persistCustomCategories(nextCategories: string[]) {
    const response = await fetch('/api/gallery/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [CUSTOM_CATEGORIES_SETTINGS_KEY]: nextCategories,
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Failed to save custom categories')
    }
  }

  // Combine default and custom categories
  const categoriesFromPhotos = uniqCategories(photos.map((photo) => photo.category)).filter(
    (category) => !DEFAULT_CATEGORIES.some((defaultCategory) => defaultCategory.toLowerCase() === category.toLowerCase())
  )
  const allCategories = uniqCategories([...DEFAULT_CATEGORIES, ...customCategories, ...categoriesFromPhotos])
  const selectableCategories = allCategories.filter((category) => category !== 'All')

  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch = photo.alt
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || photo.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    if (!allCategories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [allCategories, selectedCategory])

  useEffect(() => {
    if (selectableCategories.length === 0) return
    if (!selectableCategories.includes(bulkCategory)) {
      setBulkCategory(selectableCategories[0])
    }
  }, [bulkCategory, selectableCategories])

  async function handleUpdatePhoto() {
    if (!editingPhoto) return
    
    setSaving(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const response = await fetch('/api/admin/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPhoto.id,
          alt: editTitle,
          category: editCategory,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update photo')
      }

      // Update local state
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === editingPhoto.id
            ? { ...p, alt: editTitle, category: editCategory }
            : p
        )
      )

      setEditingPhoto(null)
      setEditTitle('')
      setEditCategory('')
      setActionMessage('Photo updated successfully')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update photo')
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(photo: GalleryImage) {
    setEditingPhoto(photo)
    setEditTitle(photo.alt)
    setEditCategory(photo.category)
  }

  async function handleAddCategory() {
    const value = normalizeCategory(newCategory)
    if (!value) return

    const isDuplicate = allCategories.some((category) => category.toLowerCase() === value.toLowerCase())
    if (isDuplicate) {
      setActionError('Category already exists')
      return
    }

    const previous = customCategories
    const nextCustomCategories = uniqCategories([...customCategories, value])

    setPersistingCategories(true)
    setActionError(null)
    setActionMessage(null)
    setCustomCategories(nextCustomCategories)

    try {
      await persistCustomCategories(nextCustomCategories)
      setBulkCategory(value)
      setNewCategory('')
      setShowAddCategory(false)
      setActionMessage(`Category "${value}" added`)
    } catch (err) {
      setCustomCategories(previous)
      setActionError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setPersistingCategories(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const response = await fetch(`/api/admin/photos?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      setPhotos((prev) => prev.filter((p) => p.id !== id))
      setSelectedPhotos((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setDeleteConfirm(null)
      setActionMessage('Photo deleted successfully')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete photo')
    } finally {
      setDeleting(false)
    }
  }

  async function handleBulkCategoryUpdate() {
    if (selectedPhotos.size === 0 || !bulkCategory) return

    const ids = [...selectedPhotos]
    setBulkUpdatingCategory(true)
    setActionError(null)
    setActionMessage(null)

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const response = await fetch('/api/admin/photos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              category: bulkCategory,
            }),
          })

          if (!response.ok) {
            const data = await response.json().catch(() => null)
            return {
              id,
              success: false,
              error: data?.error || 'Failed to update photo category',
            }
          }

          return { id, success: true, error: null }
        })
      )

      const successIds = new Set(results.filter((result) => result.success).map((result) => result.id))
      const failed = results.filter((result) => !result.success)

      if (successIds.size > 0) {
        setPhotos((prev) =>
          prev.map((photo) =>
            successIds.has(photo.id)
              ? { ...photo, category: bulkCategory }
              : photo
          )
        )
      }

      if (failed.length > 0) {
        setActionError(`Updated ${successIds.size} photo(s), failed ${failed.length}`)
      } else {
        setActionMessage(`Category updated for ${successIds.size} photo(s)`)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update categories')
    } finally {
      setBulkUpdatingCategory(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedPhotos.size === 0) return

    const ids = [...selectedPhotos]
    setBulkDeleting(true)
    setActionError(null)
    setActionMessage(null)

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(`/api/admin/photos?id=${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const data = await response.json().catch(() => null)
            return {
              id,
              success: false,
              error: data?.error || 'Failed to delete photo',
            }
          }

          return { id, success: true, error: null }
        })
      )

      const successIds = new Set(results.filter((result) => result.success).map((result) => result.id))
      const failedIds = new Set(results.filter((result) => !result.success).map((result) => result.id))

      if (successIds.size > 0) {
        setPhotos((prev) => prev.filter((photo) => !successIds.has(photo.id)))
      }

      setSelectedPhotos(new Set([...failedIds]))
      setBulkDeleteConfirm(false)

      if (failedIds.size > 0) {
        setActionError(`Deleted ${successIds.size} photo(s), failed ${failedIds.size}`)
      } else {
        setActionMessage(`Deleted ${successIds.size} photo(s)`)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete selected photos')
    } finally {
      setBulkDeleting(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  function selectAll() {
    if (selectedPhotos.size === filteredPhotos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(filteredPhotos.map((p) => p.id)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <p className="text-rose-600 font-sans">{error}</p>
        <button
          onClick={fetchPhotos}
          className="mt-4 px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-stone-800">Manage Photos</h1>
          <p className="text-stone-600 font-sans text-sm">
            {photos.length} photos in gallery
          </p>
        </div>
        {selectedPhotos.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600 font-sans">
              {selectedPhotos.size} selected
            </span>
            <button
              onClick={() => setSelectedPhotos(new Set())}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-sans text-sm">
          {actionError}
        </div>
      )}

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-sans text-sm">
          {actionMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-stone-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans bg-white"
            >
              {allCategories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowAddCategory(true)}
              className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
              title="Add new category"
              disabled={loadingCategories || persistingCategories}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <button
            onClick={selectAll}
            className="text-sm text-stone-600 hover:text-stone-800 font-sans flex items-center gap-2"
          >
            {selectedPhotos.size === filteredPhotos.length &&
            filteredPhotos.length > 0 ? (
              <>
                <Check className="w-4 h-4" /> Deselect All
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-stone-400 rounded" />{' '}
                Select All
              </>
            )}
          </button>

          {selectedPhotos.size > 0 && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-stone-200 text-sm font-sans bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
              >
                {selectableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkCategoryUpdate}
                disabled={bulkUpdatingCategory || selectableCategories.length === 0}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-sans hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {bulkUpdatingCategory ? 'Updating...' : 'Apply Category'}
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkDeleting}
                className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-sans hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedPhotos.size})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-500 font-sans">No photos found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`group relative bg-white rounded-xl overflow-hidden shadow-sm border transition-all ${
                selectedPhotos.has(photo.id)
                  ? 'border-rose-400 ring-2 ring-rose-100'
                  : 'border-stone-200 hover:shadow-md'
              }`}
            >
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleSelection(photo.id)}
                  className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    selectedPhotos.has(photo.id)
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-white/80 border-white hover:bg-white'
                  }`}
                >
                  {selectedPhotos.has(photo.id) && <Check className="w-4 h-4" />}
                </button>

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(photo)}
                    className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-700 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <a
                    href={photo.full_src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-700 transition-colors"
                    title="View full size"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setDeleteConfirm(photo.id)}
                    className="p-2 rounded-lg bg-white/90 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 rounded-md bg-black/50 text-white text-xs font-sans backdrop-blur-sm">
                    {photo.category}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-stone-800 font-sans truncate">
                  {photo.alt}
                </p>
                <p className="text-xs text-stone-500 font-sans">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={selectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedPhotos.size === filteredPhotos.length &&
                      filteredPhotos.length > 0
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    {selectedPhotos.size === filteredPhotos.length &&
                      filteredPhotos.length > 0 && <Check className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700 font-sans">
                  Photo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700 font-sans">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700 font-sans">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700 font-sans">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-700 font-sans">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPhotos.map((photo) => (
                <tr
                  key={photo.id}
                  className={`hover:bg-stone-50 transition-colors ${
                    selectedPhotos.has(photo.id) ? 'bg-rose-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelection(photo.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedPhotos.has(photo.id)
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {selectedPhotos.has(photo.id) && (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800 font-sans">
                      {photo.alt}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-sans">
                      {photo.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-stone-500 font-sans">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(photo)}
                        className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <a
                        href={photo.full_src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                        title="View full size"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setDeleteConfirm(photo.id)}
                        className="p-2 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-serif text-stone-800">
                Delete Photo?
              </h3>
            </div>
            <p className="text-stone-600 font-sans mb-6">
              This action cannot be undone. The photo will be permanently
              removed from the gallery and storage.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-sans transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-sans transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-serif text-stone-800">
                Delete {selectedPhotos.size} Photos?
              </h3>
            </div>
            <p className="text-stone-600 font-sans mb-6">
              This action cannot be undone. Selected photos will be removed from gallery and storage.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-sans transition-colors"
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-sans transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif text-stone-800">Edit Photo</h3>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-100">
                <Image
                  src={editingPhoto.src}
                  alt={editingPhoto.alt}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-stone-700 font-sans mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans"
                  placeholder="Enter photo title"
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-stone-700 font-sans mb-1">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans bg-white"
                  >
                    {allCategories.filter((c: string) => c !== 'All').map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-sans transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePhoto}
                disabled={saving || !editTitle.trim()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-sans transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-serif text-stone-800 mb-4">Add New Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-sans mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory()
              }}
              disabled={persistingCategories}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddCategory(false)
                  setNewCategory('')
                }}
                className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-sans transition-colors"
                disabled={persistingCategories}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={
                  persistingCategories ||
                  !normalizeCategory(newCategory) ||
                  allCategories.some(
                    (category) => category.toLowerCase() === normalizeCategory(newCategory).toLowerCase()
                  )
                }
                className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-sans transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {persistingCategories ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
