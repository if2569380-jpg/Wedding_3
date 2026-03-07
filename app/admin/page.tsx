'use client'

import { useEffect, useState } from 'react'
import {
  ImageIcon,
  Eye,
  TrendingUp,
  Heart,
  Camera,
  Calendar,
  Download,
  Share2,
  Users,
  Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface TopPhoto {
  id: string
  title: string
  count: number
}

interface Stats {
  totalPhotos: number
  categories: number
  recentUploads: number
  analytics: {
    photoViews: number
    photoDownloads: number
    photoShares: number
    guestLogins: number
    uniqueGuests: number
    activeGuestsLast7Days: number
  }
  topPhotos: {
    viewed: TopPhoto[]
    downloaded: TopPhoto[]
    shared: TopPhoto[]
  }
}

const CATEGORIES = ['Ceremony', 'Reception', 'Portraits', 'Details']

const defaultStats: Stats = {
  totalPhotos: 0,
  categories: CATEGORIES.length,
  recentUploads: 0,
  analytics: {
    photoViews: 0,
    photoDownloads: 0,
    photoShares: 0,
    guestLogins: 0,
    uniqueGuests: 0,
    activeGuestsLast7Days: 0,
  },
  topPhotos: {
    viewed: [],
    downloaded: [],
    shared: [],
  },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(defaultStats)
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
          recentUploads: data.recentUploads ?? 0,
          analytics: {
            photoViews: data.analytics?.photoViews ?? 0,
            photoDownloads: data.analytics?.photoDownloads ?? 0,
            photoShares: data.analytics?.photoShares ?? 0,
            guestLogins: data.analytics?.guestLogins ?? 0,
            uniqueGuests: data.analytics?.uniqueGuests ?? 0,
            activeGuestsLast7Days: data.analytics?.activeGuestsLast7Days ?? 0,
          },
          topPhotos: {
            viewed: data.topPhotos?.viewed ?? [],
            downloaded: data.topPhotos?.downloaded ?? [],
            shared: data.topPhotos?.shared ?? [],
          },
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
      name: 'This Week Uploads',
      value: stats.recentUploads,
      icon: Calendar,
      color: 'from-amber-400 to-amber-500',
      shadow: 'shadow-amber-200',
    },
    {
      name: 'Guest Logins',
      value: stats.analytics.guestLogins,
      icon: Users,
      color: 'from-pink-400 to-pink-500',
      shadow: 'shadow-pink-200',
    },
    {
      name: 'Unique Guests',
      value: stats.analytics.uniqueGuests,
      icon: Activity,
      color: 'from-teal-400 to-teal-500',
      shadow: 'shadow-teal-200',
    },
    {
      name: 'Photo Views',
      value: stats.analytics.photoViews,
      icon: Eye,
      color: 'from-violet-400 to-violet-500',
      shadow: 'shadow-violet-200',
    },
    {
      name: 'Downloads',
      value: stats.analytics.photoDownloads,
      icon: Download,
      color: 'from-sky-400 to-sky-500',
      shadow: 'shadow-sky-200',
    },
    {
      name: 'Shares',
      value: stats.analytics.photoShares,
      icon: Share2,
      color: 'from-fuchsia-400 to-fuchsia-500',
      shadow: 'shadow-fuchsia-200',
    },
  ]

  const TopPhotoList = ({
    title,
    icon: Icon,
    photos,
    emptyLabel,
  }: {
    title: string
    icon: LucideIcon
    photos: TopPhoto[]
    emptyLabel: string
  }) => (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100">
      <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-rose-400" />
        {title}
      </h2>
      {photos.length === 0 ? (
        <p className="text-sm text-stone-500 font-sans">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {photos.map((photo, index) => (
            <li
              key={`${title}-${photo.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-stone-400 font-sans mb-1">
                  #{index + 1}
                </p>
                <p className="font-medium text-stone-800 font-sans truncate">{photo.title}</p>
              </div>
              <p className="text-lg font-serif text-stone-900">{photo.count}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 rounded-2xl p-5 sm:p-8 text-white shadow-xl shadow-rose-200">
        <h1 className="text-2xl sm:text-3xl font-serif font-light mb-2">Welcome to Wedding Admin</h1>
        <p className="text-white/80 font-sans">
          Manage your wedding photo gallery, upload new memories, and review guest engagement.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
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

      {/* Top Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <TopPhotoList
          title="Most Viewed Photos"
          icon={Eye}
          photos={stats.topPhotos.viewed}
          emptyLabel="No view data yet."
        />
        <TopPhotoList
          title="Most Downloaded Photos"
          icon={Download}
          photos={stats.topPhotos.downloaded}
          emptyLabel="No download data yet."
        />
        <TopPhotoList
          title="Most Shared Photos"
          icon={Share2}
          photos={stats.topPhotos.shared}
          emptyLabel="No share data yet."
        />
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-100">
        <h2 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-rose-400" />
          Guest Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
            <p className="text-sm text-stone-500 font-sans">Active Guests (Last 7 Days)</p>
            <p className="text-2xl font-serif text-stone-800">
              {loading ? (
                <span className="inline-block w-8 h-4 bg-stone-200 rounded animate-pulse" />
              ) : (
                stats.analytics.activeGuestsLast7Days
              )}
            </p>
          </div>
          <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
            <p className="text-sm text-stone-500 font-sans">Total Engagement Actions</p>
            <p className="text-2xl font-serif text-stone-800">
              {loading ? (
                <span className="inline-block w-8 h-4 bg-stone-200 rounded animate-pulse" />
              ) : (
                stats.analytics.photoViews + stats.analytics.photoDownloads + stats.analytics.photoShares
              )}
            </p>
          </div>
        </div>
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
    </div>
  )
}
