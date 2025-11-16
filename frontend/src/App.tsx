import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PatientDashboard from './pages/PatientDashboard'
import PatientAppointments from './pages/PatientAppointments'
import PatientMessages from './pages/PatientMessages'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Templates from './pages/Templates'
import Broadcasts from './pages/Broadcasts'
import Analytics from './pages/Analytics'
import Messages from './pages/Messages'
import AuditLogs from './pages/AuditLogs'
import AdminManagement from './pages/AdminManagement'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { isAuthenticated, loading, isPatient } = useAuth()

  // Show beautiful dental-themed loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={
          !isAuthenticated ? (
            <Login />
          ) : (
            isPatient ? <Navigate to="/patient-dashboard" /> : <Navigate to="/dashboard" />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          !isAuthenticated ? (
            <Register />
          ) : (
            isPatient ? <Navigate to="/patient-dashboard" /> : <Navigate to="/dashboard" />
          )
        } 
      />
      
      {/* Patient Routes - Only accessible to patients */}
      <Route
        path="/patient-dashboard"
        element={
          isAuthenticated ? (
            <Layout><PatientDashboard /></Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/patient-appointments"
        element={
          isAuthenticated ? (
            <Layout><PatientAppointments /></Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/patient-messages"
        element={
          isAuthenticated ? (
            <Layout><PatientMessages /></Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      
      {/* Admin/Staff Routes - Only accessible to admin/staff */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Layout><Dashboard /></Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/patients"
        element={isAuthenticated ? <Layout><Patients /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/appointments"
        element={isAuthenticated ? <Layout><Appointments /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/templates"
        element={isAuthenticated ? <Layout><Templates /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/broadcasts"
        element={isAuthenticated ? <Layout><Broadcasts /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/analytics"
        element={isAuthenticated ? <Layout><Analytics /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/messages"
        element={isAuthenticated ? <Layout><Messages /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/audit-logs"
        element={isAuthenticated ? <Layout><AuditLogs /></Layout> : <Navigate to="/login" />}
      />
      <Route
        path="/admin-management"
        element={isAuthenticated ? <Layout><AdminManagement /></Layout> : <Navigate to="/login" />}
      />
    </Routes>
  )
}

export default App

