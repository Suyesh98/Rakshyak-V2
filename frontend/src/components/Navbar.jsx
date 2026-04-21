import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../logo/Rakshyak-removebg-preview.png'

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
    <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
  </svg>
)

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RadarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6" opacity="0.6"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <line x1="12" y1="12" x2="12" y2="2" strokeLinecap="round"/>
  </svg>
)

const BombIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M12 9v2m0 4h.01M5 13l4-8a1 1 0 011.84 0l6 12a1 1 0 01-.92 1.42H6.08a1 1 0 01-.92-1.42z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { to: '/home', label: 'Home', icon: <HomeIcon /> },
    { to: '/realtime', label: 'Real-Time Surveillance', icon: <RadarIcon /> },
    { to: '/bomb-detection', label: 'Bomb Detection', icon: <BombIcon /> },
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/profile', label: 'Profile', icon: <UserIcon /> },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={user ? '/home' : '/login'} className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Rakshyak" className="h-9 w-auto" />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              RAKSHYAK
            </span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-gray-900">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'O'}
                </div>
                <span className="text-sm text-gray-300 font-medium max-w-[120px] truncate">
                  {user.full_name}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Logout"
              >
                <LogoutIcon />
                <span className="text-xs font-medium">Logout</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          {user && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-800">
              <button
                onClick={() => { setMobileOpen(false); logout() }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogoutIcon />
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
