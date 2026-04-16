import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import RealtimePage from './pages/RealtimePage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import LoadingPage from './pages/LoadingPage'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/home" replace /> : children
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Loading page — full screen, no navbar */}
      <Route path="/loading" element={<ProtectedRoute><LoadingPage /></ProtectedRoute>} />

      {/* Auth pages with navbar (navbar hides itself on public routes) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Layout><PublicRoute><LoginPage /></PublicRoute></Layout>} />
      <Route path="/register" element={<Layout><PublicRoute><RegisterPage /></PublicRoute></Layout>} />
      <Route path="/home" element={<Layout><ProtectedRoute><HomePage /></ProtectedRoute></Layout>} />
      <Route path="/realtime" element={<Layout><ProtectedRoute><RealtimePage /></ProtectedRoute></Layout>} />
      <Route path="/profile" element={<Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>} />
      <Route path="/dashboard" element={<Layout><ProtectedRoute><DashboardPage /></ProtectedRoute></Layout>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{ duration: 3000 }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
