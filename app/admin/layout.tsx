'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ImagePlus,
  Images,
  LayoutTemplate,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  ChevronRight,
  Music,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'
import SessionRedirectGuard from '@/components/SessionRedirectGuard'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Upload Photos', href: '/admin/upload', icon: ImagePlus },
  { name: 'Manage Photos', href: '/admin/photos', icon: Images },
  { name: 'Landing Content', href: '/admin/landing', icon: LayoutTemplate },
  { name: 'Music', href: '/admin/music', icon: Music },
  { name: 'Family Members', href: '/admin/family-members', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <SessionRedirectGuard />
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[88vw] max-w-72 bg-white border-r border-stone-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-stone-800">
              Wedding Admin
            </h1>
            <p className="text-xs text-stone-500 font-sans">Photo Management</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-2.5 rounded-lg hover:bg-stone-100 min-h-11 min-w-11"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-stone-800 text-white shadow-md'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'
                  }`}
                />
                <span className="font-sans text-sm font-medium">{item.name}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-stone-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-sans text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-stone-100 min-h-11 min-w-11"
            >
              <Menu className="w-5 h-5 text-stone-600" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-stone-500 min-w-0">
              <span className="font-sans">Admin</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-sans text-stone-800 font-medium truncate">
                {navigation.find((n) => n.href === pathname)?.name || 'Dashboard'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
