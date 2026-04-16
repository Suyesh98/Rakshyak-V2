import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as THREE from 'three'
import logo from '../logo/Rakshyak-removebg-preview.png'

// ── Three.js Globe Animation ──────────────────────────────────────────
function ParticleGlobe({ containerRef }) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 280

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Globe particles
    const globeRadius = 120
    const particleCount = 3200
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const amber = new THREE.Color(0xf59e0b)
    const dimAmber = new THREE.Color(0x92400e)
    const white = new THREE.Color(0xfefce8)

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = globeRadius + (Math.random() - 0.5) * 4

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const mix = Math.random()
      const color = mix < 0.15 ? white : mix < 0.5 ? amber : dimAmber
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = Math.random() * 2.0 + 0.5
    }

    const globeGeometry = new THREE.BufferGeometry()
    globeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    globeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    globeGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const globeMaterial = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const globe = new THREE.Points(globeGeometry, globeMaterial)
    scene.add(globe)

    // Orbital rings
    const ringCount = 3
    for (let r = 0; r < ringCount; r++) {
      const ringRadius = globeRadius + 20 + r * 18
      const ringPoints = 200
      const ringPositions = new Float32Array(ringPoints * 3)
      for (let i = 0; i < ringPoints; i++) {
        const angle = (i / ringPoints) * Math.PI * 2
        ringPositions[i * 3] = ringRadius * Math.cos(angle)
        ringPositions[i * 3 + 1] = 0
        ringPositions[i * 3 + 2] = ringRadius * Math.sin(angle)
      }
      const ringGeometry = new THREE.BufferGeometry()
      ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3))
      const ringMaterial = new THREE.PointsMaterial({
        size: 0.8,
        color: new THREE.Color(0xf59e0b),
        transparent: true,
        opacity: 0.25 - r * 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ring = new THREE.Points(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI * 0.35 + r * 0.15
      ring.rotation.z = r * 0.3
      scene.add(ring)
    }

    // Connection lines between random globe points
    const lineCount = 60
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    for (let i = 0; i < lineCount; i++) {
      const phi1 = Math.acos(2 * Math.random() - 1)
      const theta1 = Math.random() * Math.PI * 2
      const phi2 = Math.acos(2 * Math.random() - 1)
      const theta2 = Math.random() * Math.PI * 2
      const r1 = globeRadius
      const r2 = globeRadius

      const p1 = new THREE.Vector3(
        r1 * Math.sin(phi1) * Math.cos(theta1),
        r1 * Math.sin(phi1) * Math.sin(theta1),
        r1 * Math.cos(phi1)
      )
      const p2 = new THREE.Vector3(
        r2 * Math.sin(phi2) * Math.cos(theta2),
        r2 * Math.sin(phi2) * Math.sin(theta2),
        r2 * Math.cos(phi2)
      )

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      mid.normalize().multiplyScalar(globeRadius * 1.25)

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2)
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20))
      const line = new THREE.Line(lineGeometry, lineMaterial)
      scene.add(line)
    }

    // Floating sentinel particles
    const sentinelCount = 80
    const sentinelPositions = new Float32Array(sentinelCount * 3)
    const sentinelVelocities = []
    for (let i = 0; i < sentinelCount; i++) {
      sentinelPositions[i * 3] = (Math.random() - 0.5) * 500
      sentinelPositions[i * 3 + 1] = (Math.random() - 0.5) * 500
      sentinelPositions[i * 3 + 2] = (Math.random() - 0.5) * 300
      sentinelVelocities.push({
        x: (Math.random() - 0.5) * 0.15,
        y: (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 0.1,
      })
    }
    const sentinelGeometry = new THREE.BufferGeometry()
    sentinelGeometry.setAttribute('position', new THREE.BufferAttribute(sentinelPositions, 3))
    const sentinelMaterial = new THREE.PointsMaterial({
      size: 1.2,
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sentinels = new THREE.Points(sentinelGeometry, sentinelMaterial)
    scene.add(sentinels)

    // Mouse tracking
    let mouseX = 0, mouseY = 0
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // Animation loop
    let animationId
    const clock = new THREE.Clock()
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      globe.rotation.y = elapsed * 0.06
      globe.rotation.x = Math.sin(elapsed * 0.02) * 0.1

      // Subtle camera response to mouse
      camera.position.x += (mouseX * 20 - camera.position.x) * 0.02
      camera.position.y += (-mouseY * 15 - camera.position.y) * 0.02
      camera.lookAt(scene.position)

      // Animate sentinels
      const sPos = sentinelGeometry.attributes.position.array
      for (let i = 0; i < sentinelCount; i++) {
        sPos[i * 3] += sentinelVelocities[i].x
        sPos[i * 3 + 1] += sentinelVelocities[i].y
        sPos[i * 3 + 2] += sentinelVelocities[i].z
        if (Math.abs(sPos[i * 3]) > 250) sentinelVelocities[i].x *= -1
        if (Math.abs(sPos[i * 3 + 1]) > 250) sentinelVelocities[i].y *= -1
        if (Math.abs(sPos[i * 3 + 2]) > 150) sentinelVelocities[i].z *= -1
      }
      sentinelGeometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      globeGeometry.dispose()
      globeMaterial.dispose()
      sentinelGeometry.dispose()
      sentinelMaterial.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [containerRef])

  return null
}

// ── SVG Icons ─────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RadarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6" opacity="0.6"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <line x1="12" y1="12" x2="12" y2="2" strokeLinecap="round"/>
  </svg>
)

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M23 7l-7 5 7 5V7z" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="9" y1="21" x2="15" y2="21" strokeLinecap="round"/>
    <line x1="10" y1="23" x2="14" y2="23" strokeLinecap="round"/>
    <path d="M12 2v5" strokeLinecap="round" opacity="0.5"/>
    <path d="M8.5 5.5l2.5 3" strokeLinecap="round" opacity="0.5"/>
    <path d="M15.5 5.5l-2.5 3" strokeLinecap="round" opacity="0.5"/>
  </svg>
)

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
    <line x1="12" y1="2" x2="12" y2="6" strokeLinecap="round"/>
    <line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round"/>
    <line x1="2" y1="12" x2="6" y2="12" strokeLinecap="round"/>
    <line x1="18" y1="12" x2="22" y2="12" strokeLinecap="round"/>
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
    <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Stat Counter ──────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = Date.now()
          const step = () => {
            const progress = Math.min((Date.now() - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Main HomePage ─────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth()
  const globeRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-x-hidden">

      {/* ── HERO SECTION ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Three.js canvas */}
        <div ref={globeRef} className="absolute inset-0 z-0">
          <ParticleGlobe containerRef={globeRef} />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-gray-900" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-gray-900/60 via-transparent to-gray-900/60" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="homepage-fade-in">
            <img src={logo} alt="Rakshyak" className="h-24 w-auto mx-auto mb-4 drop-shadow-lg" />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Defense Surveillance Active
            </div>
          </div>

          <h1 className="homepage-fade-in homepage-fade-delay-1 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            <span className="block text-gray-100">Welcome,</span>
            <span className="block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              {user?.full_name || 'Operator'}
            </span>
          </h1>

          <p className="homepage-fade-in homepage-fade-delay-2 mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            RAKSHYAK Integrated Command Center. Real-time AI-powered threat
            detection and perimeter surveillance at your fingertips.
          </p>

          <div className="homepage-fade-in homepage-fade-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/realtime"
              className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 rounded-lg font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:from-amber-400 hover:to-amber-500 hover:shadow-lg hover:shadow-amber-500/25"
            >
              Launch Surveillance
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 px-8 py-3.5 border border-gray-600 text-gray-300 rounded-lg font-semibold text-sm tracking-wider uppercase transition-all duration-300 hover:border-amber-500/50 hover:text-amber-400"
            >
              Operator Profile
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-60'}`}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-gray-500 to-transparent scroll-indicator-pulse" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative z-10 -mt-1 border-t border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 99.7, suffix: '%', label: 'Detection Accuracy' },
            { value: 15, suffix: ' FPS', label: 'Processing Speed' },
            { value: 24, suffix: '/7', label: 'Monitoring Uptime' },
            { value: 50, suffix: 'ms', label: 'Response Latency' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-amber-400">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-xs tracking-widest uppercase text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CAPABILITIES SECTION ── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-100">
              System Capabilities
            </h2>
            <div className="mt-3 w-16 h-0.5 bg-amber-500 mx-auto" />
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Military-grade surveillance powered by state-of-the-art neural networks
              and real-time video analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BrainIcon />,
                title: 'AI Threat Detection',
                desc: 'YOLOv8 neural network processes live feeds to identify and classify objects with adjustable confidence thresholds.',
              },
              {
                icon: <CameraIcon />,
                title: 'Live Video Streaming',
                desc: 'WebSocket-based real-time video pipeline delivering annotated frames with bounding box overlays at 15 FPS.',
              },
              {
                icon: <RadarIcon />,
                title: 'Perimeter Monitoring',
                desc: 'Continuous 360-degree surveillance coverage with automated anomaly alerts and zone-based detection triggers.',
              },
              {
                icon: <ShieldIcon />,
                title: 'Secure Communications',
                desc: 'JWT-authenticated encrypted channels ensure all data transmission between operator and system remains protected.',
              },
              {
                icon: <TargetIcon />,
                title: 'Precision Tracking',
                desc: 'Frame-level object tracking with detection count, frame ID, and real-time FPS performance metrics.',
              },
              {
                icon: <LockIcon />,
                title: 'Access Control',
                desc: 'Role-based operator authentication with token refresh, session management, and automated lockout protocols.',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-xl border border-gray-800 bg-gray-800/40 backdrop-blur-sm transition-all duration-500 hover:border-amber-500/30 hover:bg-gray-800/70 hover:shadow-lg hover:shadow-amber-500/5"
              >
                {/* Corner accent */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-amber-500/0 rounded-tl-xl transition-all duration-500 group-hover:border-amber-500/40" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-amber-500/0 rounded-br-xl transition-all duration-500 group-hover:border-amber-500/40" />

                <div className="text-amber-500 mb-4 transition-transform duration-500 group-hover:scale-110 origin-left">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEM OVERVIEW ── */}
      <section className="relative z-10 py-24 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <span className="text-xs tracking-[0.3em] uppercase text-amber-500 font-medium">Operational Overview</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-100 leading-tight">
                Intelligent Defense<br />at Every Level
              </h2>
              <p className="mt-5 text-gray-400 leading-relaxed">
                RAKSHYAK combines advanced computer vision with real-time data
                processing to provide operators with actionable intelligence.
                The system continuously analyzes incoming video feeds, identifies
                potential threats, and presents findings through an intuitive
                command interface.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'Real-time object detection with bounding box annotations',
                  'Adjustable confidence thresholds for mission-specific tuning',
                  'Persistent WebSocket connection for zero-latency streaming',
                  'Automatic stream reconnection on network interruption',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 mt-0.5 shrink-0">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  to="/realtime"
                  className="group inline-flex items-center gap-2 text-amber-400 font-medium text-sm tracking-wide hover:text-amber-300 transition-colors"
                >
                  Access Surveillance Feed
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRightIcon />
                  </span>
                </Link>
              </div>
            </div>

            {/* Right: terminal-style display */}
            <div className="relative">
              <div className="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden shadow-2xl">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">rakshyak-command</span>
                </div>
                {/* Terminal body */}
                <div className="p-5 font-mono text-xs leading-relaxed space-y-1.5">
                  <div><span className="text-amber-500">$</span> <span className="text-gray-300">rakshyak --init surveillance</span></div>
                  <div className="text-green-400">[OK] System initialized</div>
                  <div><span className="text-amber-500">$</span> <span className="text-gray-300">yolo detect --model v8n --confidence 0.65</span></div>
                  <div className="text-green-400">[OK] YOLOv8n model loaded (6.3MB)</div>
                  <div className="text-gray-500">     Inference engine: ONNX Runtime</div>
                  <div><span className="text-amber-500">$</span> <span className="text-gray-300">stream connect --protocol ws --fps 15</span></div>
                  <div className="text-green-400">[OK] WebSocket connection established</div>
                  <div className="text-gray-500">     Endpoint: ws://localhost:8000/api/v1/realtime/detect</div>
                  <div><span className="text-amber-500">$</span> <span className="text-gray-300">status --watch</span></div>
                  <div className="text-cyan-400">     Frames processed: 12,847</div>
                  <div className="text-cyan-400">     Detections total: 3,291</div>
                  <div className="text-cyan-400">     Avg latency: 47ms</div>
                  <div className="text-cyan-400">     Uptime: 14h 23m 08s</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-amber-500">$</span>
                    <span className="text-gray-400 terminal-cursor">_</span>
                  </div>
                </div>
              </div>
              {/* Glow effect behind terminal */}
              <div className="absolute -inset-4 -z-10 bg-amber-500/5 rounded-2xl blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Rakshyak" className="h-7 w-auto" />
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              RAKSHYAK
            </span>
            <span className="text-xs text-gray-600 tracking-wider uppercase">Defense Surveillance System</span>
          </div>
          <div className="text-xs text-gray-600">
            Classified System -- Authorized Personnel Only
          </div>
        </div>
      </footer>
    </div>
  )
}
