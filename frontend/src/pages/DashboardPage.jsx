import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import html2pdf from 'html2pdf.js'
import logo from '../logo/Rakshyak-removebg-preview.png'
import api from '../api/axios'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts'

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

// SVG Icons
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
  </svg>
)

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
    <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
)

function formatDuration(seconds) {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateTime(iso) {
  return `${formatDate(iso)} ${formatTime(iso)}`
}

export default function DashboardPage() {
  const [logs, setLogs] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('logs')
  const [logoBase64, setLogoBase64] = useState('')

  // Fetch real data from backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [logsRes, sessionsRes] = await Promise.all([
          api.get('/dashboard/detections'),
          api.get('/dashboard/sessions'),
        ])
        setLogs(logsRes.data || [])
        setSessions(sessionsRes.data || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      setLogoBase64(canvas.toDataURL('image/png'))
    }
    img.src = logo
  }, [])

  // Filter state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterConfMin, setFilterConfMin] = useState('')
  const [filterConfMax, setFilterConfMax] = useState('')
  const [logsPage, setLogsPage] = useState(0)
  const logsPerPage = 20
  const tableRef = useRef(null)

  // Heatmap filters
  const now = new Date()
  const [heatmapYear, setHeatmapYear] = useState(now.getFullYear())
  const [heatmapMonth, setHeatmapMonth] = useState(now.getMonth())

  // All unique classes from logs
  const allClasses = useMemo(() => {
    const set = new Set(logs.map(l => l.class))
    return [...set].sort()
  }, [logs])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (dateFrom && new Date(log.timestamp) < new Date(dateFrom + 'T00:00:00')) return false
      if (dateTo && new Date(log.timestamp) > new Date(dateTo + 'T23:59:59')) return false
      if (filterClass && log.class !== filterClass) return false
      if (filterConfMin && log.confidence < parseFloat(filterConfMin)) return false
      if (filterConfMax && log.confidence > parseFloat(filterConfMax)) return false
      return true
    })
  }, [logs, dateFrom, dateTo, filterClass, filterConfMin, filterConfMax])

  const pagedLogs = useMemo(() => {
    const start = logsPage * logsPerPage
    return filteredLogs.slice(start, start + logsPerPage)
  }, [filteredLogs, logsPage])

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  // Daily detection trend
  const dailyTrend = useMemo(() => {
    const map = {}
    logs.forEach(log => {
      const day = formatDate(log.timestamp)
      map[day] = (map[day] || 0) + 1
    })
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .reverse()
  }, [logs])

  // Class distribution
  const classDistData = useMemo(() => {
    const map = {}
    filteredLogs.forEach(log => {
      map[log.class] = (map[log.class] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }, [filteredLogs])

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalDet = logs.length
    const totalSessions = sessions.length
    const avgConf = logs.length > 0
      ? (logs.reduce((s, l) => s + l.confidence, 0) / logs.length).toFixed(2)
      : '0.00'
    const topClass = classDistData[0]?.name || 'N/A'
    return { totalDet, totalSessions, avgConf, topClass }
  }, [logs, sessions, classDistData])

  // Export functions
  const exportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Class', 'Confidence', 'Session']
    const rows = filteredLogs.map(l => [
      formatDateTime(l.timestamp), l.class, l.confidence, l.session_id || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rakshyak-detections-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully')
  }, [filteredLogs])

  const exportPDF = useCallback(() => {
    const container = document.createElement('div')
    container.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a;">
        <div style="display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #f59e0b; padding-bottom: 14px; margin-bottom: 10px;">
          ${logoBase64 ? `<img src="${logoBase64}" style="height: 50px; width: auto;" />` : ''}
          <h1 style="color: #1e3a5f; margin: 0; font-size: 24px;">RAKSHYAK Detection Report</h1>
        </div>
        <p style="font-size: 12px; color: #6b7280;">Generated: ${new Date().toLocaleString()} | Records: ${filteredLogs.length}</p>
        <div style="display: flex; gap: 16px; margin: 18px 0;">
          <div style="background: #f3f4f6; padding: 12px 18px; border-radius: 8px; flex: 1;">
            <div style="font-size: 22px; font-weight: bold; color: #1e3a5f;">${summaryStats.totalDet}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">Total Detections</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px 18px; border-radius: 8px; flex: 1;">
            <div style="font-size: 22px; font-weight: bold; color: #1e3a5f;">${summaryStats.avgConf}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">Avg Confidence</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px 18px; border-radius: 8px; flex: 1;">
            <div style="font-size: 22px; font-weight: bold; color: #1e3a5f;">${summaryStats.topClass}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">Top Class</div>
          </div>
          <div style="background: #f3f4f6; padding: 12px 18px; border-radius: 8px; flex: 1;">
            <div style="font-size: 22px; font-weight: bold; color: #1e3a5f;">${summaryStats.totalSessions}</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 3px;">Sessions</div>
          </div>
        </div>
        <h2 style="color: #1e3a5f; margin-top: 24px; font-size: 16px;">Detection Logs</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px;">
          <thead>
            <tr>
              <th style="background: #1e3a5f; color: white; padding: 7px 10px; text-align: left;">Timestamp</th>
              <th style="background: #1e3a5f; color: white; padding: 7px 10px; text-align: left;">Class</th>
              <th style="background: #1e3a5f; color: white; padding: 7px 10px; text-align: left;">Confidence</th>
              <th style="background: #1e3a5f; color: white; padding: 7px 10px; text-align: left;">Session</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs.slice(0, 200).map((l, i) => `<tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
              <td style="padding: 5px 10px; border-bottom: 1px solid #e5e7eb;">${formatDateTime(l.timestamp)}</td>
              <td style="padding: 5px 10px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${l.class}</td>
              <td style="padding: 5px 10px; border-bottom: 1px solid #e5e7eb;">${l.confidence}</td>
              <td style="padding: 5px 10px; border-bottom: 1px solid #e5e7eb;">${l.session_id || ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${filteredLogs.length > 200 ? '<p style="color:#6b7280;font-size:11px;margin-top:8px;">Showing first 200 of ' + filteredLogs.length + ' records. Export CSV for full data.</p>' : ''}
        <div style="margin-top: 30px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          RAKSHYAK Defense Surveillance System - Classification: RESTRICTED
        </div>
      </div>
    `

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `rakshyak-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    html2pdf().set(opt).from(container).save().then(() => {
      toast.success('PDF downloaded successfully')
    })
  }, [filteredLogs, summaryStats, logoBase64])

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setFilterClass('')
    setFilterConfMin('')
    setFilterConfMax('')
    setLogsPage(0)
  }

  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await api.delete(`/dashboard/sessions/${sessionId}`)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast.success('Session removed')
    } catch {
      toast.error('Failed to delete session')
    }
    setDeleteConfirmId(null)
  }, [])

  // Filter logs by selected year/month for heatmap
  const heatmapFilteredLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.timestamp)
      return d.getFullYear() === heatmapYear && d.getMonth() === heatmapMonth
    })
  }, [logs, heatmapYear, heatmapMonth])

  // Heatmap as hourly breakdown per day (from filtered logs)
  const heatmapBarData = useMemo(() => {
    const periods = [
      { label: '00:00 – 03:59', hours: [0, 1, 2, 3] },
      { label: '04:00 – 07:59', hours: [4, 5, 6, 7] },
      { label: '08:00 – 11:59', hours: [8, 9, 10, 11] },
      { label: '12:00 – 15:59', hours: [12, 13, 14, 15] },
      { label: '16:00 – 19:59', hours: [16, 17, 18, 19] },
      { label: '20:00 – 23:59', hours: [20, 21, 22, 23] },
    ]
    return periods.map(p => {
      const row = { period: p.label }
      DAYS_OF_WEEK.forEach((day, dayIdx) => {
        row[day] = heatmapFilteredLogs
          .filter(log => {
            const d = new Date(log.timestamp)
            return d.getDay() === dayIdx && p.hours.includes(d.getHours())
          }).length
      })
      return row
    })
  }, [heatmapFilteredLogs])

  // Hourly average data from filtered logs
  const hourlyAvgData = useMemo(() => {
    // Count how many unique days have data for proper averaging
    const daysWithData = new Set(heatmapFilteredLogs.map(l => new Date(l.timestamp).toDateString())).size || 1
    return HOURS.map((hour, idx) => {
      const count = heatmapFilteredLogs.filter(log => new Date(log.timestamp).getHours() === idx).length
      return { hour, avg: parseFloat((count / daysWithData).toFixed(1)) }
    })
  }, [heatmapFilteredLogs])

  // Available years from logs
  const availableYears = useMemo(() => {
    const years = new Set(logs.map(l => new Date(l.timestamp).getFullYear()))
    if (years.size === 0) years.add(now.getFullYear())
    return [...years].sort((a, b) => b - a)
  }, [logs])

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const tabs = [
    { id: 'logs', label: 'Detection Logs', icon: <TableIcon /> },
    { id: 'heatmap', label: 'Heatmap', icon: <ChartIcon /> },
    { id: 'sessions', label: 'Session History', icon: <ClockIcon /> },
  ]

  // Loading state
  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 py-5">
        <div className="flex flex-col items-center justify-center py-32">
          <svg className="animate-spin h-10 w-10 text-accent-400 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400 text-sm">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-accent-300">Dashboard & Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Historical detection data, heatmaps, and session reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-400/10 border border-accent-400/30 text-accent-300 hover:bg-accent-400/20 transition-all"
          >
            <DownloadIcon />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="card">
          <div className="text-2xl font-bold text-accent-300">{summaryStats.totalDet.toLocaleString()}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Total Detections</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-blue-400">{summaryStats.totalSessions}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Sessions Recorded</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-400">{summaryStats.avgConf}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Avg Confidence</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-purple-400 capitalize">{summaryStats.topClass}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Top Detection Class</div>
        </div>
      </div>

      {/* Empty state when no data */}
      {logs.length === 0 && sessions.length === 0 && (
        <div className="card mb-5 text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
            <ChartIcon />
          </div>
          <h3 className="text-base font-semibold text-gray-300 mb-1">No Detection Data Yet</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Start a surveillance session from the Real-Time page to begin collecting detection data. All detections and session history will appear here automatically.
          </p>
        </div>
      )}

      {/* Detection Trend Chart */}
      {dailyTrend.length > 0 && (
        <div className="card mb-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Detection Trend</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} label={{ value: 'Detection Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280', dx: -5 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#trendGrad)" name="Detections" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-800 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setLogsPage(0) }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === tab.id
                ? 'bg-gray-800 text-accent-300 border-b-2 border-accent-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== DETECTION LOGS TAB ===== */}
      {activeTab === 'logs' && (
        <div>
          {/* Filters */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FilterIcon />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Filters</h3>
              {(dateFrom || dateTo || filterClass || filterConfMin || filterConfMax) && (
                <button onClick={clearFilters} className="ml-auto text-xs text-accent-300 hover:text-accent-200 transition-colors">
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date From</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"><CalendarIcon /></span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setLogsPage(0) }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date To</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"><CalendarIcon /></span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setLogsPage(0) }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Object Class</label>
                <select
                  value={filterClass}
                  onChange={e => { setFilterClass(e.target.value); setLogsPage(0) }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                >
                  <option value="">All Classes</option>
                  {allClasses.map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Confidence</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={filterConfMin}
                  onChange={e => { setFilterConfMin(e.target.value); setLogsPage(0) }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Confidence</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={filterConfMax}
                  onChange={e => { setFilterConfMax(e.target.value); setLogsPage(0) }}
                  placeholder="1.00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              Showing {pagedLogs.length} of {filteredLogs.length} detections
            </p>
          </div>

          {/* Logs Table */}
          <div className="card overflow-hidden p-0" ref={tableRef}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/80 border-b border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Class</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Confidence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{formatDateTime(log.timestamp)}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-700/50 text-gray-200 capitalize">
                          {log.class}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-mono font-bold ${
                          log.confidence >= 0.8 ? 'text-green-400' :
                          log.confidence >= 0.6 ? 'text-accent-300' :
                          'text-red-400'
                        }`}>
                          {log.confidence.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{log.session_id || '—'}</td>
                    </tr>
                  ))}
                  {pagedLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-xs">
                        {logs.length === 0
                          ? 'No detection data yet. Start a surveillance session to record detections.'
                          : 'No detections match your filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <button
                  onClick={() => setLogsPage(p => Math.max(0, p - 1))}
                  disabled={logsPage === 0}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {logsPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setLogsPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={logsPage >= totalPages - 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Class Distribution Charts (below table) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Object Classification (Filtered)</h2>
              <div className="h-56">
                {classDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classDistData.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} label={{ value: 'Detection Count', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#6b7280' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} label={{ value: 'Object Class', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280', dx: -15 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                        {classDistData.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500">No data for current filters</div>
                )}
              </div>
            </div>
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Detection Distribution</h2>
              <div className="h-56">
                {classDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classDistData.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {classDistData.slice(0, 8).map((_, i) => (
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
                  <div className="h-full flex items-center justify-center text-xs text-gray-500">No data for current filters</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HEATMAP TAB ===== */}
      {activeTab === 'heatmap' && (
        <div>
          {/* Year/Month Filters */}
          <div className="card mb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <FilterIcon />
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Filter Period</span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <select
                    value={heatmapYear}
                    onChange={e => setHeatmapYear(Number(e.target.value))}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Month</label>
                  <select
                    value={heatmapMonth}
                    onChange={e => setHeatmapMonth(Number(e.target.value))}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:border-accent-400 focus:ring-1 focus:ring-accent-400/50 focus:outline-none transition-colors"
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <span className="text-xs text-gray-500 sm:ml-auto">
                {heatmapFilteredLogs.length} detections in {MONTH_NAMES[heatmapMonth]} {heatmapYear}
              </span>
            </div>
          </div>

          {heatmapFilteredLogs.length === 0 ? (
            <div className="card text-center py-10">
              <ChartIcon />
              <p className="text-gray-500 text-sm mt-2">No detection data for {MONTH_NAMES[heatmapMonth]} {heatmapYear}.</p>
              <p className="text-gray-600 text-xs mt-1">Run a surveillance session to start collecting heatmap data.</p>
            </div>
          ) : (
            <>
              {/* Stacked bar chart: detections by time period, broken down by day */}
              <div className="card mb-5">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Weekly Detection Pattern — {MONTH_NAMES[heatmapMonth]} {heatmapYear}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={heatmapBarData} margin={{ left: 10, bottom: 20, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        label={{ value: 'Time Period (Hours)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        allowDecimals={false}
                        label={{ value: 'Number of Detections', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af', fontWeight: 600, dx: -5 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                      {DAYS_OF_WEEK.map((day, i) => (
                        <Bar key={day} dataKey={day} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} name={day} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Stacked bars show detection volume across time windows, colored by day of week. Taller bars indicate peak activity periods.
                </p>
              </div>

              {/* Hourly average line chart */}
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Hourly Detection Average</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyAvgData} margin={{ left: 10, bottom: 20, right: 10 }}>
                      <defs>
                        <linearGradient id="heatAvgGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        interval={2}
                        label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        label={{ value: 'Avg Detections per Day', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af', fontWeight: 600, dx: -5 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Area type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} fill="url(#heatAvgGrad)" name="Avg Detections" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== SESSION HISTORY TAB ===== */}
      {activeTab === 'sessions' && (
        <div>
          <div className="space-y-3">
            {sessions.length === 0 && (
              <div className="card text-center py-10">
                <ClockIcon />
                <p className="text-gray-500 text-sm mt-2">No session history available.</p>
                <p className="text-gray-600 text-xs mt-1">Sessions are recorded when you start and stop surveillance from the Real-Time page.</p>
              </div>
            )}
            {sessions.map(session => (
              <div key={session.id} className="card hover:border-gray-600 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      session.status === 'active' ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800 border border-gray-700'
                    }`}>
                      <ClockIcon />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-200">{formatDateTime(session.startTime)}</span>
                        {session.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Duration: {formatDuration(session.duration)} | Confidence: {session.avgConfidence}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent-300">{session.totalDetections}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Detections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{session.uniqueClasses}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Classes</div>
                    </div>
                    {/* Delete button */}
                    <div className="shrink-0">
                      {deleteConfirmId === session.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(session.id)}
                          className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete session"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                            <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round"/>
                            <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sessions overview chart */}
          {sessions.length > 0 && (
            <div className="card mt-5">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Detections per Session</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...sessions].reverse().map(s => ({
                    session: formatDateTime(s.startTime),
                    detections: s.totalDetections,
                    duration: formatDuration(s.duration),
                  }))} margin={{ left: 10, bottom: 20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="session"
                      tick={{ fontSize: 9, fill: '#6b7280' }}
                      label={{ value: 'Session Start Time', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      allowDecimals={false}
                      label={{ value: 'Total Detections', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af', fontWeight: 600, dx: -5 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(value, name, props) => {
                        if (name === 'Detections') return [value, 'Detections']
                        return [value, name]
                      }}
                      labelFormatter={(label) => `Session: ${label}`}
                    />
                    <Bar dataKey="detections" fill="#f59e0b" name="Detections" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pb-4 text-center">
        <p className="text-xs text-gray-600">
          RAKSHYAK Defense Surveillance System - Analytics Dashboard
        </p>
      </div>
    </div>
  )
}
