import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 4l-10 8L2 4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IdIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <rect x="2" y="3" width="20" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="10" x2="8" y2="10.01" strokeLinecap="round" strokeWidth="2"/>
    <line x1="12" y1="10" x2="16" y2="10" strokeLinecap="round"/>
    <line x1="12" y1="14" x2="16" y2="14" strokeLinecap="round"/>
    <circle cx="8" cy="14" r="0.5" fill="currentColor"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
  })

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'OP'

  const startEditing = () => {
    setEditForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      username: user?.username || '',
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
  }

  const handleSave = async () => {
    if (!editForm.full_name.trim()) {
      toast.error('Full name is required')
      return
    }
    if (!editForm.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (!editForm.username.trim()) {
      toast.error('Username is required')
      return
    }

    setSaving(true)
    try {
      await updateUser({
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        username: editForm.username.trim().toLowerCase(),
      })
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach(e => toast.error(e.msg || String(e)))
      } else {
        toast.error(detail || 'Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const profileFields = [
    { key: 'full_name', icon: <UserIcon />, label: 'Full Name', value: user?.full_name },
    { key: 'email', icon: <MailIcon />, label: 'Email', value: user?.email },
    { key: 'username', icon: <IdIcon />, label: 'Username', value: user?.username },
    { key: 'status', icon: <ShieldIcon />, label: 'Status', value: user?.is_active ? 'Active' : 'Inactive' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Profile Header */}
        <div className="relative rounded-xl border border-gray-800 bg-gray-800/40 overflow-hidden">
          {/* Banner gradient */}
          <div className="h-32 bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-gray-900" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-14 mb-4 flex items-end gap-5">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-2xl font-bold text-gray-900 ring-4 ring-gray-900 shadow-lg">
                {initials}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-gray-100">{user?.full_name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">Defense System Operator</p>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Active Duty
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <ShieldIcon />
                <span className="-ml-1">Authorized</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-gray-800">
          {['overview', 'security'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Info Card */}
              <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Operator Details</h3>
                  {!editing ? (
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                    >
                      <EditIcon />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-900 bg-amber-500 hover:bg-amber-400 transition-all disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  {profileFields.map((field) => (
                    <div key={field.key} className="flex items-center gap-4">
                      <div className="text-amber-500/70 shrink-0">{field.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-gray-500 tracking-wider uppercase">{field.label}</div>
                        {editing && field.key !== 'status' ? (
                          <input
                            type={field.key === 'email' ? 'email' : 'text'}
                            value={editForm[field.key] || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 focus:outline-none transition-colors"
                          />
                        ) : (
                          <div className="text-sm text-gray-200 mt-0.5">{field.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Card */}
              <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-6">
                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-5">Session Activity</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Session Status', value: 'Active', color: 'text-green-400' },
                    { label: 'Authentication', value: 'JWT Token', color: 'text-gray-200' },
                    { label: 'Token Type', value: 'Bearer', color: 'text-gray-200' },
                    { label: 'Clearance', value: 'Level 1 -- Operator', color: 'text-amber-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                      <span className="text-xs text-gray-500 tracking-wider uppercase">{item.label}</span>
                      <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-6">
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase mb-5">Security Settings</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-900/50 border border-gray-700/50">
                  <div className="text-amber-500 mt-0.5">
                    <ActivityIcon />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">Active Session</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your session is secured with JWT authentication. Access token refreshes automatically.
                      Token blacklisting is enforced on logout.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-900/50 border border-gray-700/50">
                  <div className="text-amber-500 mt-0.5">
                    <ShieldIcon />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">Password Policy</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 8 characters, at least one uppercase letter and one number.
                      Passwords are hashed with bcrypt before storage.
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full mt-2 py-3 px-4 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
