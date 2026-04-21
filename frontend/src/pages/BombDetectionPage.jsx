import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

export default function BombDetectionPage() {
  const [streaming, setStreaming] = useState(false)
  const [confidence, setConfidence] = useState(0.4)
  const [fps, setFps] = useState(0)
  const [detections, setDetections] = useState(0)
  const [frameId, setFrameId] = useState(0)
  const [status, setStatus] = useState('disconnected')
  const [cameraUrl, setCameraUrl] = useState('')
  const [cameraUrlLocked, setCameraUrlLocked] = useState(false)

  const [bombDetected, setBombDetected] = useState(false)
  const [currentClasses, setCurrentClasses] = useState([])
  const [currentConfidences, setCurrentConfidences] = useState([])
  const [alertHistory, setAlertHistory] = useState([])
  const [totalBombAlerts, setTotalBombAlerts] = useState(0)
  const [sessionStart, setSessionStart] = useState(null)

  const wsRef = useRef(null)
  const canvasRef = useRef(null)
  const fpsTimestamps = useRef([])
  const lastAlertRef = useRef(0)

  const updateFps = useCallback(() => {
    const now = performance.now()
    fpsTimestamps.current.push(now)
    if (fpsTimestamps.current.length > 30) fpsTimestamps.current.shift()
    const stamps = fpsTimestamps.current
    if (stamps.length >= 2) {
      const elapsed = (stamps[stamps.length - 1] - stamps[0]) / 1000
      setFps(Math.round((stamps.length - 1) / elapsed * 10) / 10)
    }
  }, [])

  const drawFrame = useCallback((blob) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(blob)
  }, [])

  const startStream = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Authentication required.')
      return
    }

    setAlertHistory([])
    setTotalBombAlerts(0)
    setCurrentClasses([])
    setCurrentConfidences([])
    setBombDetected(false)
    setSessionStart(Date.now())

    let wsUrl = `ws://localhost:8000/api/v1/bomb-detection/detect?token=${token}&confidence=${confidence}`
    if (cameraUrl.trim()) {
      wsUrl += `&camera_url=${encodeURIComponent(cameraUrl.trim())}`
    }

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    setStatus('connecting')
    setCameraUrlLocked(true)

    ws.onopen = () => {
      setStatus('connected')
      setStreaming(true)
      fpsTimestamps.current = []
    }

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        drawFrame(event.data)
        updateFps()
      } else {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'frame') {
            setDetections(msg.detections)
            setFrameId(msg.frame_id)
            setCurrentClasses(msg.classes || [])
            setCurrentConfidences(msg.confidences || [])
            setBombDetected(!!msg.bomb_detected)

            if (msg.bomb_detected) {
              const now = Date.now()
              // throttle audible alert to once every 3 seconds
              if (now - lastAlertRef.current > 3000) {
                toast.error('⚠️ BOMB DETECTED', { duration: 2500 })
                lastAlertRef.current = now
              }
              setTotalBombAlerts(prev => prev + 1)
              const maxConf = Math.max(...(msg.confidences || [0]))
              setAlertHistory(prev => {
                const entry = {
                  time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                  confidence: maxConf,
                  frame: msg.frame_id,
                }
                const next = [entry, ...prev]
                return next.slice(0, 50)
              })
            }
          } else if (msg.type === 'connected') {
            toast.success(`Bomb detection active — ${msg.model}`)
          } else if (msg.type === 'warning') {
            toast(msg.message, { icon: '\u26a0\ufe0f' })
          } else if (msg.type === 'error') {
            toast.error(msg.message)
            setStatus('error')
          }
        } catch {
          // binary handled above
        }
      }
    }

    ws.onerror = () => {
      toast.error('Connection error')
      setStatus('error')
    }

    ws.onclose = () => {
      setStreaming(false)
      setStatus('disconnected')
      setFps(0)
      setCameraUrlLocked(false)
    }
  }, [confidence, cameraUrl, drawFrame, updateFps])

  const stopStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setStreaming(false)
    setStatus('disconnected')
    setFps(0)
    setCameraUrlLocked(false)
    setBombDetected(false)
  }, [])

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const elapsedTime = useMemo(() => {
    if (!sessionStart) return '00:00'
    const diff = Math.floor((Date.now() - sessionStart) / 1000)
    const m = Math.floor(diff / 60).toString().padStart(2, '0')
    const s = (diff % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }, [sessionStart, frameId])

  const maxConfidence = useMemo(() => {
    if (!currentConfidences.length) return 0
    return Math.max(...currentConfidences).toFixed(2)
  }, [currentConfidences])

  const statusColor = status === 'connected'
    ? 'bg-green-400'
    : status === 'connecting'
      ? 'bg-yellow-400'
      : status === 'error'
        ? 'bg-red-500'
        : 'bg-gray-500'

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-red-400">Bomb Detection</h1>
          <p className="text-gray-400 text-sm mt-1">
            Roboflow-powered threat detection over live video feed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {streaming && (
            <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
              SESSION {elapsedTime}
            </span>
          )}
          <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-1.5 rounded-lg border border-gray-700">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor} ${status === 'connected' || status === 'connecting' ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-gray-300 capitalize font-medium">{status}</span>
          </div>
        </div>
      </div>

      {/* Threat Banner */}
      {streaming && (
        <div className={`mb-4 rounded-lg border px-4 py-3 flex items-center justify-between transition-colors ${
          bombDetected
            ? 'bg-red-900/40 border-red-500 animate-pulse'
            : 'bg-green-900/20 border-green-700/50'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${bombDetected ? '' : 'opacity-60'}`}>
              {bombDetected ? '⚠️' : '🛡️'}
            </span>
            <div>
              <div className={`text-sm font-bold uppercase tracking-wider ${bombDetected ? 'text-red-300' : 'text-green-400'}`}>
                {bombDetected ? 'THREAT DETECTED' : 'Area Clear'}
              </div>
              <div className="text-xs text-gray-400">
                {bombDetected
                  ? `Bomb detected with ${(maxConfidence * 100).toFixed(0)}% confidence`
                  : 'No bomb signatures detected in current frame'}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Total alerts: <span className="font-bold text-red-400">{totalBombAlerts}</span>
          </div>
        </div>
      )}

      {/* Camera URL Input */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Camera IP Address
            </label>
            <input
              type="text"
              value={cameraUrl}
              onChange={(e) => setCameraUrl(e.target.value)}
              disabled={cameraUrlLocked}
              placeholder="http://192.168.x.x:8080/video"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-red-400 focus:ring-1 focus:ring-red-400/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default server camera. Running local inference for real-time speed.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Detection Confidence: <span className="text-red-300 font-bold text-sm">{confidence.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              disabled={streaming}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-400"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (0.10)</span>
              <span>High (0.95)</span>
            </div>
          </div>
          <button
            onClick={streaming ? stopStream : startStream}
            className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              streaming
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${streaming ? 'bg-white animate-pulse' : 'bg-white'}`} />
            {streaming ? 'Stop Detection' : 'Start Detection'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Video Feed - 2/3 */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Live Feed</h2>
              {streaming && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-red-400">LIVE</span>
                </div>
              )}
            </div>
            <div className={`aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border ${
              bombDetected ? 'border-red-500 shadow-lg shadow-red-500/30' : 'border-gray-700/50'
            } transition-colors`}>
              {streaming ? (
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M5 13l4-8a1 1 0 011.84 0l6 12a1 1 0 01-.92 1.42H6.08a1 1 0 01-.92-1.42z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-300 mb-1">Detection Offline</h3>
                  <p className="text-gray-500 text-xs max-w-sm mx-auto">
                    Click "Start Detection" to begin scanning the live video feed for explosive threats.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats / Alerts Panel - 1/3 */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Live Metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-red-300">{fps}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">FPS</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-blue-400">{detections}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Detections</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-green-400">{frameId}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Frames</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-purple-400">{maxConfidence}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Max Conf</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Alert Log</h2>
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {alertHistory.length > 0 ? (
                alertHistory.map((entry, i) => (
                  <div key={`${entry.frame}-${i}`} className="flex items-center justify-between bg-red-900/20 rounded px-2.5 py-1.5 border border-red-800/40">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-xs">⚠️</span>
                      <span className="text-xs text-gray-200 font-mono">{entry.time}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-300">
                      {(entry.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">
                  {streaming ? 'No threats detected yet' : 'Start detection to monitor'}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Current Detections</h2>
            <div className="space-y-1.5">
              {currentClasses.length > 0 ? (
                currentClasses.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded px-2.5 py-1.5 border border-gray-700/30">
                    <span className="text-xs text-gray-200 font-medium capitalize">{cls}</span>
                    <span className={`text-xs font-mono font-bold ${
                      currentConfidences[i] >= 0.7 ? 'text-red-400' :
                      currentConfidences[i] >= 0.4 ? 'text-amber-300' :
                      'text-gray-400'
                    }`}>
                      {currentConfidences[i]?.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-xs text-gray-500">
                  {streaming ? 'Scanning...' : 'Start detection to scan'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
