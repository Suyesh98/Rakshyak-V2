import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../logo/Rakshyak-removebg-preview.png'

function RoverGraphic() {
  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Hexagonal grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <defs>
          <pattern id="hex" width="28" height="49" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
            <path d="M14 0L28 8.66V25.98L14 34.64 0 25.98V8.66z" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#hex)" />
      </svg>

      {/* Concentric target rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-56 h-56 rounded-full border border-amber-500/10 animate-pulse-ring" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border border-amber-500/15 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-amber-500/20 animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>

      {/* Center rover icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-amber-500">
          <rect x="5" y="7" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" fill="rgba(245,158,11,0.08)" />
          <rect x="8" y="4" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="rgba(245,158,11,0.05)" />
          <circle cx="7.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.2" fill="rgba(245,158,11,0.1)" />
          <circle cx="16.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.2" fill="rgba(245,158,11,0.1)" />
          <line x1="7.5" y1="15" x2="7.5" y2="16" stroke="currentColor" strokeWidth="1" />
          <line x1="16.5" y1="15" x2="16.5" y2="16" stroke="currentColor" strokeWidth="1" />
          <circle cx="12" cy="6" r="1" fill="currentColor" opacity="0.6" />
          <line x1="12" y1="4" x2="12" y2="2.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Corner brackets */}
      <svg className="absolute top-4 left-4 w-6 h-6 text-amber-500/30">
        <path d="M0 6V0H6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute top-4 right-4 w-6 h-6 text-amber-500/30">
        <path d="M6 0H0V6" fill="none" stroke="currentColor" strokeWidth="1.5" transform="translate(6,0) scale(-1,1)" />
      </svg>
      <svg className="absolute bottom-4 left-4 w-6 h-6 text-amber-500/30">
        <path d="M0 0V6H6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-6 h-6 text-amber-500/30">
        <path d="M6 6H0V0" fill="none" stroke="currentColor" strokeWidth="1.5" transform="translate(6,6) scale(-1,-1)" />
      </svg>
    </div>
  )
}

function UserPlusIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-amber-500">
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" fill="rgba(245,158,11,0.1)" />
      <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const formFields = [
  {
    name: 'full_name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'operator@command.mil',
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Choose a callsign',
    autoComplete: 'username',
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Min 8 chars, 1 uppercase, 1 number',
    autoComplete: 'new-password',
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { full_name, email, username, password } = formData
    if (!full_name || !email || !username || !password) {
      toast.error('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      await register(formData)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach((e) => toast.error(e.msg || e.message || JSON.stringify(e)))
      } else {
        toast.error(detail || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-primary-900 items-center justify-center">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-gray-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-950/50" />

        <div className="relative z-10 px-12 max-w-lg">
          <div className="mb-10">
            <RoverGraphic />
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
              <span className="text-amber-500/70 text-xs tracking-[0.3em] uppercase font-medium">Bomb Disposal Unit</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>

            <img src={logo} alt="Rakshyak" className="h-20 w-auto mx-auto mb-2" />
            <h1 className="text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                RAKSHYAK
              </span>
            </h1>

            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              Join the operator network. Get authorized access to rover controls, live camera feeds, and AI-powered threat detection.
            </p>

            <div className="flex items-center justify-center gap-6 pt-4">
              {['Secure Auth', 'Role-Based', 'Encrypted'].map((label) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-amber-500/60" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-10">
            <img src={logo} alt="Rakshyak" className="h-16 w-auto mx-auto mb-2" />
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                RAKSHYAK
              </span>
            </h1>
            <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mt-1">Bomb Disposal Rover</p>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <img src={logo} alt="Rakshyak" className="h-12 w-auto" />
              <div>
                <h2 className="text-xl font-bold text-gray-100">Create Account</h2>
                <p className="text-gray-500 text-sm">Register as a new operator</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    {field.icon}
                  </div>
                  <input
                    type={field.type}
                    name={field.name}
                    className="auth-input"
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    autoComplete={field.autoComplete}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2">
              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Request Access'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500">
            Already have clearance?{' '}
            <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
              Login Here
            </Link>
          </p>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
              <span>System Operational</span>
              <span className="mx-2">|</span>
              <span>Encrypted Connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
