import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../logo/Rakshyak-removebg-preview.png'

export default function LoadingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home', { replace: true })
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(245,158,11,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
      }} />

      {/* Radial glow behind logo */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
        {/* Logo */}
        <img src={logo} alt="Rakshyak" className="h-28 w-auto mb-6 animate-pulse" />

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
            RAKSHYAK
          </span>
        </h1>

        <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-10">
          Defense Surveillance System
        </p>

        {/* Animated loading bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full animate-loading-bar" />
        </div>

        <p className="text-gray-400 text-sm">Initializing command center...</p>

        {/* Status indicators */}
        <div className="flex items-center gap-6 mt-8">
          {['Systems', 'Detection Engine', 'Secure Link'].map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div
                className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
          <span>Encrypted Connection Established</span>
        </div>
      </div>
    </div>
  )
}
