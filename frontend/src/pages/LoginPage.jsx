import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../logo/Rakshyak-removebg-preview.png'

function RoverGraphic() {
  return (
    <div className="relative w-80 h-72 mx-auto">
      {/* Ground dust particles */}
      <div className="absolute bottom-[52px] left-[15%] w-1 h-1 rounded-full bg-amber-500/30 animate-dust-1" />
      <div className="absolute bottom-[56px] left-[20%] w-0.5 h-0.5 rounded-full bg-amber-500/20 animate-dust-2" />
      <div className="absolute bottom-[50px] right-[18%] w-1 h-1 rounded-full bg-amber-500/25 animate-dust-3" />

      <svg viewBox="0 0 320 240" className="w-full h-full" fill="none">
        <defs>
          {/* Glow filter for lights */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === GROUND LINE === */}
        <line x1="30" y1="195" x2="290" y2="195" stroke="rgba(245,158,11,0.15)" strokeWidth="1" strokeDasharray="4 4" />

        {/* === ROVER BODY — gentle hover animation === */}
        <g className="animate-rover-hover">

          {/* --- Suspension arms (connect body to wheels) --- */}
          <line x1="88" y1="158" x2="78" y2="178" stroke="rgba(245,158,11,0.5)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="162" x2="160" y2="178" stroke="rgba(245,158,11,0.5)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="232" y1="158" x2="242" y2="178" stroke="rgba(245,158,11,0.5)" strokeWidth="2.5" strokeLinecap="round" />

          {/* --- Main chassis --- */}
          <rect x="75" y="130" rx="6" ry="6" width="170" height="35"
            stroke="rgba(245,158,11,0.6)" strokeWidth="1.5"
            fill="rgba(245,158,11,0.06)" />
          {/* Chassis detail lines */}
          <line x1="85" y1="140" x2="235" y2="140" stroke="rgba(245,158,11,0.12)" strokeWidth="0.5" />
          <line x1="85" y1="150" x2="235" y2="150" stroke="rgba(245,158,11,0.12)" strokeWidth="0.5" />
          {/* Vent slits on body */}
          {[100, 112, 124].map((x) => (
            <rect key={x} x={x} y="143" width="8" height="2" rx="1" fill="rgba(245,158,11,0.2)" />
          ))}

          {/* --- Top equipment platform --- */}
          <rect x="95" y="115" rx="4" ry="4" width="130" height="20"
            stroke="rgba(245,158,11,0.5)" strokeWidth="1.2"
            fill="rgba(245,158,11,0.04)" />
          {/* Antenna base */}
          <rect x="205" y="108" width="8" height="10" rx="2" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
          {/* Antenna mast */}
          <line x1="209" y1="108" x2="209" y2="82" stroke="rgba(245,158,11,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Antenna tip — blinking */}
          <circle cx="209" cy="80" r="2.5" fill="rgba(245,158,11,0.8)" filter="url(#glow-sm)" className="animate-blink" />

          {/* --- Robotic arm (left side) — swaying animation --- */}
          <g className="animate-arm-sway" style={{ transformOrigin: '105px 118px' }}>
            {/* Arm segment 1 — shoulder to elbow */}
            <line x1="105" y1="118" x2="80" y2="90" stroke="rgba(245,158,11,0.6)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Joint circle */}
            <circle cx="80" cy="90" r="3" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.5)" strokeWidth="1.2" />
            {/* Arm segment 2 — elbow to gripper */}
            <line x1="80" y1="90" x2="58" y2="68" stroke="rgba(245,158,11,0.6)" strokeWidth="2" strokeLinecap="round" />
            {/* Gripper claw */}
            <line x1="58" y1="68" x2="50" y2="62" stroke="rgba(245,158,11,0.5)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="58" y1="68" x2="52" y2="74" stroke="rgba(245,158,11,0.5)" strokeWidth="1.8" strokeLinecap="round" />
            {/* Gripper joint */}
            <circle cx="58" cy="68" r="2" fill="rgba(245,158,11,0.3)" stroke="rgba(245,158,11,0.5)" strokeWidth="1" />
          </g>

          {/* --- Camera head (right side of top platform) — scanning animation --- */}
          <g className="animate-camera-scan" style={{ transformOrigin: '170px 115px' }}>
            {/* Camera neck */}
            <rect x="166" y="100" width="8" height="18" rx="2" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.45)" strokeWidth="1" />
            {/* Camera head */}
            <rect x="158" y="88" width="24" height="15" rx="3" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.55)" strokeWidth="1.2" />
            {/* Camera lens */}
            <circle cx="176" cy="95.5" r="4.5" fill="rgba(245,158,11,0.05)" stroke="rgba(245,158,11,0.6)" strokeWidth="1.2" />
            <circle cx="176" cy="95.5" r="2" fill="rgba(245,158,11,0.4)" />
            {/* Camera lens glow — scanning beam */}
            <ellipse cx="190" cy="95.5" rx="12" ry="6" fill="rgba(245,158,11,0.06)" className="animate-scan-beam" />
            {/* LED indicator on camera */}
            <circle cx="162" cy="93" r="1.2" fill="#22c55e" className="animate-blink-slow" filter="url(#glow-sm)" />
          </g>

          {/* --- Side panel detail (right) --- */}
          <rect x="220" y="133" width="18" height="10" rx="2" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.25)" strokeWidth="0.8" />
          {/* Status LEDs on side */}
          <circle cx="225" cy="138" r="1.5" fill="#22c55e" opacity="0.7" className="animate-blink-slow" />
          <circle cx="231" cy="138" r="1.5" fill="rgba(245,158,11,0.6)" className="animate-blink" />

        </g>

        {/* === WHEELS (on ground, not hovering) === */}
        {/* Left wheel */}
        <g>
          <circle cx="78" cy="186" r="14" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.5)" strokeWidth="1.8" />
          <circle cx="78" cy="186" r="8" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="0.8" />
          <circle cx="78" cy="186" r="3" fill="rgba(245,158,11,0.3)" />
          {/* Wheel spokes — spinning */}
          <g className="animate-wheel-spin" style={{ transformOrigin: '78px 186px' }}>
            <line x1="78" y1="173" x2="78" y2="199" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8" />
            <line x1="65" y1="186" x2="91" y2="186" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8" />
            <line x1="69" y1="177" x2="87" y2="195" stroke="rgba(245,158,11,0.1)" strokeWidth="0.8" />
            <line x1="87" y1="177" x2="69" y2="195" stroke="rgba(245,158,11,0.1)" strokeWidth="0.8" />
          </g>
          {/* Wheel tread marks */}
          <circle cx="78" cy="186" r="13" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="2" strokeDasharray="3 3" />
        </g>

        {/* Center wheel */}
        <g>
          <circle cx="160" cy="186" r="14" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.5)" strokeWidth="1.8" />
          <circle cx="160" cy="186" r="8" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="0.8" />
          <circle cx="160" cy="186" r="3" fill="rgba(245,158,11,0.3)" />
          <g className="animate-wheel-spin" style={{ transformOrigin: '160px 186px' }}>
            <line x1="160" y1="173" x2="160" y2="199" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8" />
            <line x1="147" y1="186" x2="173" y2="186" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8" />
            <line x1="151" y1="177" x2="169" y2="195" stroke="rgba(245,158,11,0.1)" strokeWidth="0.8" />
            <line x1="169" y1="177" x2="151" y2="195" stroke="rgba(245,158,11,0.1)" strokeWidth="0.8" />
          </g>
          <circle cx="160" cy="186" r="13" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="2" strokeDasharray="3 3" />
        </g>

        {/* Right wheel */}
        <g>
          <circle cx="242" cy="186" r="14" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.5)" strokeWidth="1.8" />
          <circle cx="242" cy="186" r="8" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="0.8" />
          <circle cx="242" cy="186" r="3" fill="rgba(245,158,11,0.3)" />
          <g className="animate-wheel-spin" style={{ transformOrigin: '242px 186px' }}>
            <line x1="242" y1="173" x2="242" y2="199" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8" />
            <line x1="229" y1="186" x2="255" y2="186" stroke="rgba(245,158,11,0.15)" strokeWidth="0.8" />
            <line x1="233" y1="177" x2="251" y2="195" stroke="rgba(245,158,11,0.1)" strokeWidth="0.8" />
            <line x1="251" y1="177" x2="233" y2="195" stroke="rgba(245,158,11,0.1)" strokeWidth="0.8" />
          </g>
          <circle cx="242" cy="186" r="13" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="2" strokeDasharray="3 3" />
        </g>

        {/* === GROUND TRACK MARKS === */}
        <line x1="40" y1="200" x2="78" y2="200" stroke="rgba(245,158,11,0.08)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="92" y1="200" x2="146" y2="200" stroke="rgba(245,158,11,0.06)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="174" y1="200" x2="228" y2="200" stroke="rgba(245,158,11,0.06)" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="256" y1="200" x2="295" y2="200" stroke="rgba(245,158,11,0.08)" strokeWidth="1" strokeDasharray="2 4" />

        {/* === SIGNAL WAVES from antenna === */}
        <g className="animate-signal">
          <path d="M 200 75 Q 209 70 218 75" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
          <path d="M 196 68 Q 209 60 222 68" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="1" />
          <path d="M 192 61 Q 209 50 226 61" fill="none" stroke="rgba(245,158,11,0.1)" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-amber-500">
      <path
        d="M12 2L3 7v5c0 5.25 3.83 10.17 9 11.38C17.17 22.17 21 17.25 21 12V7l-9-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="rgba(245,158,11,0.1)"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      await login({ username_or_email: username, password })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed.')
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
              Advanced autonomous rover platform with real-time vision-based surveillance and threat neutralization capabilities.
            </p>

            <div className="flex items-center justify-center gap-6 pt-4">
              {['Live Vision', 'AI Detection', 'Remote Ops'].map((label) => (
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
                <h2 className="text-xl font-bold text-gray-100">Operator Login</h2>
                <p className="text-gray-500 text-sm">Authenticate to access the command center</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your credentials"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Access Command Center'
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

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            New operator?{' '}
            <Link to="/register" className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
              Request Access
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
