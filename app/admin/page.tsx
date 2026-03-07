'use client'

import { useEffect, useState } from 'react'
import {
  ImageIcon,
  Eye,
  TrendingUp,
  Heart,
  Camera,
  Calendar
} from 'lucide-react'

interface Stats {
  totalPhotos: number
  categories: number
  favorites: number
  recentUploads: number
}

const CATEGORIES = ['Ceremony', 'Reception', 'Portraits', 'Details']

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPhotos: 0,
    categories: CATEGORIES.length,
    favorites: 0,
    recentUploads: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/gallery-stats')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats')
        }

        setStats({
          totalPhotos: data.totalPhotos ?? 0,
          categories: data.categories ?? CATEGORIES.length,
          favorites: 0, // Would need to fetch from user data
          recentUploads: data.recentUploads ?? 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      name: 'Total Photos',
      value: stats.totalPhotos,
      icon: ImageIcon,
      color: 'from-blue-400 to-blue-500',
      shadow: 'shadow-blue-200',
    },
    {
      name: 'Categories',
      value: stats.categories,
      icon: Camera,
      color: 'from-emerald-400 to-emerald-500',
      shadow: 'shadow-emerald-200',
    },
    {
      name: 'This Week',
      value: stats.recentUploads,
      icon: Calendar,
      color: 'from-amber-400 to-amber-500',
      shadow: 'shadow-amber-200',
    },
    {
      name: 'Gallery Views',
      value: '---',
      icon: Eye,
      color: 'from-purple-400 to-purple-500',
      shadow: 'shadow-purple-200',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 rounded-2xl p-5 sm:p-8 text-white shadow-xl shadow-rose-200">
        <h1 className="text-2xl sm:text-3xl font-serif font-light mb-2">Welcome to Wedding Admin</h1>
        <p className="text-white/80 font-sans">
          Manage your wedding photo gallery, upload new memories, and organize your collection.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-stone-500 font-sans">{stat.name}</p>
                <p className="text-2xl font-serif text-stone-800">
                  {loading ? (
                    <span className="inline-block w-8 h-4 bg-stone-200 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/upload"
              className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors group min-h-11"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <ImageIcon className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800 font-sans">Upload Photos</p>
                <p className="text-sm text-stone-500 font-sans">Add new wedding photos to the gallery</p>
              </div>
            </a>
            <a
              href="/admin/photos"
              className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors group min-h-11"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800 font-sans">Manage Photos</p>
                <p className="text-sm text-stone-500 font-sans">Edit, organize, or delete existing photos</p>
              </div>
            </a>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100">
          <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Categories
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="p-4 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200"
              >
                <p className="font-medium text-stone-700 font-sans">{category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6">
        <h3 className="text-lg font-serif text-blue-800 mb-2">💡 Pro Tips</h3>
        <ul className="space-y-2 text-sm text-blue-700 font-sans">
          <li>• Upload high-resolution images for the best viewing experience</li>
          <li>• Organize photos by category to make browsing easier</li>
          <li>• Add descriptive titles to help guests find specific moments</li>
          <li>• Regularly backup your photos to keep them safe</li>
        </ul>
      </div>
    </div>
  )
}
