'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  Users,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Mail,
  User,
  Heart,
  Loader2,
  Sparkles
} from 'lucide-react'

interface FamilyMember {
  id: string
  email: string
  name: string
  relationship: string | null
  welcome_message: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export default function FamilyMembersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    relationship: '',
    welcome_message: '',
    avatar_url: '',
    is_active: true,
  })

  // Fetch family members
  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/family-members')
      const data = await response.json()
      if (data.members) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingId
        ? `/api/family-members?id=${editingId}`
        : '/api/family-members'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchMembers()
        resetForm()
        setIsAdding(false)
        setEditingId(null)
      }
    } catch (error) {
      console.error('Error saving member:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family member?')) return

    try {
      const response = await fetch(`/api/family-members?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchMembers()
      }
    } catch (error) {
      console.error('Error deleting member:', error)
    }
  }

  const handleEdit = (member: FamilyMember) => {
    setFormData({
      email: member.email,
      name: member.name,
      relationship: member.relationship || '',
      welcome_message: member.welcome_message || '',
      avatar_url: member.avatar_url || '',
      is_active: member.is_active,
    })
    setEditingId(member.id)
    setIsAdding(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      relationship: '',
      welcome_message: '',
      avatar_url: '',
      is_active: true,
    })
    setEditingId(null)
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.relationship?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-stone-800">
            Family Members
          </h1>
          <p className="text-stone-600 mt-1">
            Manage family members and their personalized welcome messages
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setIsAdding(true)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors min-h-11"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Search by name, email, or relationship..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
        />
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-stone-200 overflow-hidden"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-semibold text-stone-800">
                  {editingId ? 'Edit Family Member' : 'Add New Family Member'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full min-h-11 px-3 py-2 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                    placeholder="family@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    <User className="w-4 h-4 inline mr-1" />
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full min-h-11 px-3 py-2 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                    placeholder="Uncle Ahmed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full min-h-11 px-3 py-2 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                    placeholder="Bride's Uncle, Groom's Sister, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Avatar URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full min-h-11 px-3 py-2 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    <Heart className="w-4 h-4 inline mr-1 text-rose-400" />
                    Welcome Message (shown when they log in)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.welcome_message}
                    onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all resize-none"
                    placeholder="Welcome Uncle! We're so glad you could join us to celebrate this special moment."
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-stone-700">
                    Active (can access gallery)
                  </label>
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto min-h-11 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingId ? 'Update Member' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false)
                      setEditingId(null)
                      resetForm()
                    }}
                    className="w-full sm:w-auto min-h-11 flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              No family members yet
            </h3>
            <p className="text-stone-600 max-w-md mx-auto">
              Add family members to give them personalized welcome messages when they access the gallery.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 sm:p-6 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center flex-shrink-0">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-rose-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-800">{member.name}</h3>
                      {member.relationship && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs rounded-full">
                          {member.relationship}
                        </span>
                      )}
                      {!member.is_active && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">{member.email}</p>
                    {member.welcome_message && (
                      <p className="text-sm text-stone-600 mt-2 italic">
                        "{member.welcome_message}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-sm text-stone-500">Total Members</p>
            <p className="text-2xl font-semibold text-stone-800">{members.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-sm text-stone-500">Active</p>
            <p className="text-2xl font-semibold text-green-600">
              {members.filter((m) => m.is_active).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <p className="text-sm text-stone-500">With Welcome Message</p>
            <p className="text-2xl font-semibold text-rose-500">
              {members.filter((m) => m.welcome_message).length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
