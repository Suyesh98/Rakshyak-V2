import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const MAX_HISTORY = 60 // keep last 60 data points for charts
const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function RealtimePage() {
  const [streaming, setStreaming] = useState(false)
  const [confidence, setConfidence] = useState(0.45)
  const [fps, setFps] = useState(0)
  const [detections, setDetections] = useState(0)
  const [frameId, setFrameId] = useState(0)
  const [status, setStatus] = useState('disconnected')
  const [cameraUrl, setCameraUrl] = useState('')
  const [cameraUrlLocked, setCameraUrlLocked] = useState(false)

  // Visualization data
  const [detectionHistory, setDetectionHistory] = useState([])
  const [classDistribution, setClassDistribution] = useState({})
  const [fpsHistory, setFpsHistory] = useState([])
  const [currentClasses, setCurrentClasses] = useState([])
  const [currentConfidences, setCurrentConfidences] = useState([])
  const [totalDetections, setTotalDetections] = useState(0)
  const [sessionStart, setSessionStart] = useState(null)

  const wsRef = useRef(null)
  const canvasRef = useRef(null)
  const fpsTimestamps = useRef([])

  const updateFps = useCallback(() => {
    const now = performance.now()
    fpsTimestamps.current.push(now)
    if (fpsTimestamps.current.length > 30) {
      fpsTimestamps.current.shift()
    }
    const stamps = fpsTimestamps.current
    if (stamps.length >= 2) {
      const elapsed = (stamps[stamps.length - 1] - stamps[0]) / 1000
      const currentFps = Math.round((stamps.length - 1) / elapsed)
      setFps(currentFps)
      setFpsHistory(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), fps: currentFps }]
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
      })
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

    // Reset visualization data
    setDetectionHistory([])
    setClassDistribution({})
    setFpsHistory([])
    setCurrentClasses([])
    setCurrentConfidences([])
    setTotalDetections(0)
    setSessionStart(Date.now())

    let wsUrl = `ws://localhost:8000/api/v1/realtime/detect?token=${token}&confidence=${confidence}`
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
            setTotalDetections(prev => prev + msg.detections)

            // Update detection history
            const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            setDetectionHistory(prev => {
              const next = [...prev, { time: timeLabel, count: msg.detections }]
              return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
            })

            // Update class distribution
            if (msg.classes && msg.classes.length > 0) {
              setClassDistribution(prev => {
                const updated = { ...prev }
                msg.classes.forEach(cls => {
                  updated[cls] = (updated[cls] || 0) + 1
                })
                return updated
              })
            }
          } else if (msg.type === 'connected') {
            toast.success('Surveillance stream active')
          } else if (msg.type === 'warning') {
            toast(msg.message, { icon: '\u26a0\ufe0f' })
          } else if (msg.type === 'error') {
            toast.error(msg.message)
            setStatus('error')
          }
        } catch {
          // binary data handled above
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
  }, [])

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // Derived chart data
  const classBarData = useMemo(() => {
    return Object.entries(classDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }, [classDistribution])

  const classPieData = useMemo(() => {
    return Object.entries(classDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  }, [classDistribution])

  const elapsedTime = useMemo(() => {
    if (!sessionStart) return '00:00'
    const diff = Math.floor((Date.now() - sessionStart) / 1000)
    const m = Math.floor(diff / 60).toString().padStart(2, '0')
    const s = (diff % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }, [sessionStart, frameId]) // frameId triggers re-render

  const avgConfidence = useMemo(() => {
    if (!currentConfidences.length) return 0
    return (currentConfidences.reduce((a, b) => a + b, 0) / currentConfidences.length).toFixed(2)
  }, [currentConfidences])

  const statusColor = status === 'connected' ? 'bg-green-400' : status === 'connecting' ? 'bg-yellow-400' : status === 'error' ? 'bg-red-500' : 'bg-gray-500'

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-accent-300">Real-Time Surveillance</h1>
          <p className="text-gray-400 text-sm mt-1">
            YOLOv8-powered object detection with live analytics
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

      {/* Camera URL Input */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Camera IP Address
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={cameraUrl}
                  onChange={(e) => setCameraUrl(e.target.value)}
                  disabled={cameraUrlLocked}
                  placeholder="http://192.168.x.x:8080/video"
                  className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
              {cameraUrl && !cameraUrlLocked && (
                <button
                  onClick={() => setCameraUrl('')}
                  className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200 bg-gray-700 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default server camera. Enter your IP Webcam URL to override.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Detection Confidence: <span className="text-accent-300 font-bold text-sm">{confidence.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              disabled={streaming}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-400"
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
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                : 'bg-accent-400 hover:bg-accent-500 text-gray-900 shadow-lg shadow-accent-400/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${streaming ? 'bg-white animate-pulse' : 'bg-gray-900'}`} />
            {streaming ? 'Stop Surveillance' : 'Start Surveillance'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Video Feed - Left Column (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Live Feed</h2>
              {streaming && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-red-400">REC</span>
                </div>
              )}
            </div>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700/50">
              {streaming ? (
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-300 mb-1">Feed Offline</h3>
                  <p className="text-gray-500 text-xs max-w-sm mx-auto mb-4">
                    Enter your IP camera address above and start surveillance to begin real-time detection.
                  </p>
                  <div className="text-left max-w-sm mx-auto bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-accent-300 mb-2">Quick Setup:</h4>
                    <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Install <strong className="text-gray-300">IP Webcam</strong> on Android</li>
                      <li>Start server in the app</li>
                      <li>Enter the IP address above (e.g., http://192.168.x.x:8080/video)</li>
                      <li>Click <strong className="text-gray-300">Start Surveillance</strong></li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Panel - Right Column (1/3 width) */}
        <div className="space-y-4">
          {/* Live Stats Cards */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Live Metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-accent-300">{fps}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">FPS</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-blue-400">{detections}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Objects</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-green-400">{frameId}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Frames</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-2xl font-bold text-purple-400">{avgConfidence}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Conf</div>
              </div>
            </div>
          </div>

          {/* Total Session Stats */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Session Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Total Detections</span>
                <span className="text-sm font-bold text-accent-300">{totalDetections.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Unique Classes</span>
                <span className="text-sm font-bold text-blue-400">{Object.keys(classDistribution).length}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-700/50">
                <span className="text-xs text-gray-400">Confidence Threshold</span>
                <span className="text-sm font-bold text-green-400">{confidence.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-gray-400">Session Duration</span>
                <span className="text-sm font-bold text-purple-400 font-mono">{elapsedTime}</span>
              </div>
            </div>
          </div>

          {/* Current Detections List */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Live Detections
            </h2>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {currentClasses.length > 0 ? (
                currentClasses.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded px-2.5 py-1.5 border border-gray-700/30">
                    <span className="text-xs text-gray-200 font-medium capitalize">{cls}</span>
                    <span className={`text-xs font-mono font-bold ${
                      currentConfidences[i] >= 0.8 ? 'text-green-400' :
                      currentConfidences[i] >= 0.5 ? 'text-accent-300' :
                      'text-red-400'
                    }`}>
                      {currentConfidences[i]?.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">
                  {streaming ? 'No objects detected' : 'Start stream to detect'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Detection Timeline */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Detection Timeline</h2>
          <div className="h-52">
            {detectionHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detectionHistory}>
                  <defs>
                    <linearGradient id="detGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#detGradient)" name="Detections" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                {streaming ? 'Collecting data...' : 'Start stream to see detection trends'}
              </div>
            )}
          </div>
        </div>

        {/* FPS Monitor */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">FPS Monitor</h2>
          <div className="h-52">
            {fpsHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fpsHistory}>
                  <defs>
                    <linearGradient id="fpsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area type="monotone" dataKey="fps" stroke="#10b981" strokeWidth={2} fill="url(#fpsGradient)" name="FPS" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                {streaming ? 'Collecting data...' : 'Start stream to monitor performance'}
              </div>
            )}
          </div>
        </div>

        {/* Class Distribution Bar Chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Object Classification</h2>
          <div className="h-52">
            {classBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {classBarData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                {streaming ? 'Waiting for detections...' : 'Start stream to see classification data'}
              </div>
            )}
          </div>
        </div>

        {/* Class Distribution Pie Chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Detection Distribution</h2>
          <div className="h-52">
            {classPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {classPieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => <span className="text-gray-300 capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                {streaming ? 'Waiting for detections...' : 'Start stream to see distribution'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
