'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, X, ImageIcon, Check, AlertCircle, ChevronDown } from 'lucide-react'
import Image from 'next/image'

interface UploadingFile {
  id: string
  file: File
  preview: string
  title: string
  category: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

const CATEGORIES = ['Ceremony', 'Reception', 'Portraits', 'Details']

export default function UploadPage() {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [openCategoryFor, setOpenCategoryFor] = useState<string | null>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-category-picker]')) return
      setOpenCategoryFor(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenCategoryFor(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!openCategoryFor) return
    const fileStillExists = files.some((file) => file.id === openCategoryFor)
    if (!fileStillExists) {
      setOpenCategoryFor(null)
    }
  }, [files, openCategoryFor])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    )

    const newFiles: UploadingFile[] = droppedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      category: 'Ceremony',
      progress: 0,
      status: 'pending',
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      )

      const newFiles: UploadingFile[] = selectedFiles.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Ceremony',
        progress: 0,
        status: 'pending',
      }))

      setFiles((prev) => [...prev, ...newFiles])
    },
    []
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const updateFile = useCallback(
    (id: string, updates: Partial<UploadingFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      )
    },
    []
  )

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)

    for (const file of files) {
      if (file.status === 'completed') continue

      updateFile(file.id, { status: 'uploading', progress: 10 })

      try {
        // Create form data
        const formData = new FormData()
        formData.append('file', file.file)
        formData.append('title', file.title)
        formData.append('category', file.category)

        updateFile(file.id, { progress: 40 })

        // Upload to API
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Upload failed')
        }

        updateFile(file.id, { status: 'completed', progress: 100 })
      } catch (error) {
        updateFile(file.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
          progress: 0,
        })
      }
    }

    setUploading(false)
  }

  const completedCount = files.filter((f) => f.status === 'completed').length
  const errorCount = files.filter((f) => f.status === 'error').length

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif text-stone-800 mb-2">Upload Photos</h1>
        <p className="text-stone-600 font-sans">
          Drag and drop your wedding photos or click to browse
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-3 border-dashed rounded-3xl p-6 sm:p-12 text-center transition-all duration-300 ${
          isDragging
            ? 'border-rose-400 bg-rose-50 scale-[1.02]'
            : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-4">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-rose-100' : 'bg-stone-100'
            }`}
          >
            <Upload
              className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                isDragging ? 'text-rose-500' : 'text-stone-400'
              }`}
            />
          </div>
          <div>
            <p className="text-lg font-medium text-stone-700 font-sans">
              {isDragging ? 'Drop your photos here' : 'Drag photos here or click to browse'}
            </p>
            <p className="text-sm text-stone-500 font-sans mt-2">
              Supports JPG, PNG, WebP (Max 10MB per file)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-visible">
          <div className="p-6 border-b border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-serif text-stone-800">
                {files.length} {files.length === 1 ? 'Photo' : 'Photos'} Ready
              </h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {completedCount > 0 && (
                  <span className="text-sm text-emerald-600 font-sans flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {completedCount} uploaded
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-sm text-rose-600 font-sans flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errorCount} failed
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {files.map((file) => (
              <div key={file.id} className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Preview */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                  <Image
                    src={file.preview}
                    alt={file.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={file.title}
                    onChange={(e) =>
                      updateFile(file.id, { title: e.target.value })
                    }
                    className="w-full min-h-10 px-3 py-2 rounded-lg border border-stone-200 text-sm font-sans focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
                    placeholder="Photo title"
                    disabled={file.status === 'uploading' || file.status === 'completed'}
                  />
                  <div className="relative" data-category-picker={file.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCategoryFor((prev) => (prev === file.id ? null : file.id))
                      }
                      disabled={file.status === 'uploading' || file.status === 'completed'}
                      className={`w-full min-h-10 px-3 py-2 rounded-lg border text-sm font-sans outline-none transition-all flex items-center justify-between gap-2 ${
                        openCategoryFor === file.id
                          ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/40'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <span className="truncate text-left text-stone-800">{file.category}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-500 transition-transform ${
                          openCategoryFor === file.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {openCategoryFor === file.id && (
                      <div className="absolute top-[calc(100%+0.35rem)] left-0 right-0 z-30 rounded-xl border border-stone-200 bg-white shadow-xl overflow-hidden">
                        <div className="max-h-52 overflow-y-auto py-1.5">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                updateFile(file.id, { category: cat })
                                setOpenCategoryFor(null)
                              }}
                              className={`w-full px-3 py-2 text-left text-sm font-sans transition-colors ${
                                file.category === cat
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {file.status === 'uploading' && (
                    <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-rose-500 animate-spin" />
                  )}
                  {file.status === 'completed' && (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div
                      className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center cursor-help"
                      title={file.error}
                    >
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-6 bg-stone-50 border-t border-stone-100">
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview))
                  setFiles([])
                }}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-sans text-sm transition-colors"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || files.every((f) => f.status === 'completed')}
                className="w-full sm:w-auto px-6 py-3 bg-stone-800 text-white rounded-xl font-sans font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Upload {files.filter((f) => f.status !== 'completed').length} Photos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-400 font-sans text-sm">
            No photos selected. Start by dragging files above or clicking to browse.
          </p>
        </div>
      )}
    </div>
  )
}
