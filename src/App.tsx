import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/authStore';
import { getDefaultRouteForRole } from './utils/permissions';

// Pages
import { Login } from './pages/Login';
import { NurseWorklist } from './pages/NurseWorklist';
import { ReadyForReview } from './pages/ReadyForReview';
import { DischargeQueue } from './pages/DischargeQueue';
import { PatientProfile } from './pages/PatientProfile';
import { BedMap } from './pages/BedMap';
import { DischargeProcessing } from './pages/DischargeProcessing';
import { QualityDashboard } from './pages/QualityDashboard';
import { Settings } from './pages/Settings';
import { AuditLog } from './pages/AuditLog';

const HomeRedirect: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Nurse Routes */}
          <Route
            path="/nurse"
            element={
              <ProtectedRoute allowedRoles={['nurse', 'admin', 'head_doctor']}>
                <AppLayout>
                  <NurseWorklist />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'head_doctor']}>
                <AppLayout>
                  <ReadyForReview />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/discharge-queue"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'head_doctor']}>
                <AppLayout>
                  <DischargeQueue />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Patient Profile */}
          <Route
            path="/patient/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PatientProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/beds" replace />}
          />

          <Route
            path="/admin/beds"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BedMap />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/discharge-processing"
            element={
              <ProtectedRoute allowedRoles={['admin', 'head_doctor']}>
                <AppLayout>
                  <DischargeProcessing />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Head Doctor Routes */}
          <Route
            path="/head-doctor"
            element={
              <ProtectedRoute allowedRoles={['head_doctor']}>
                <AppLayout>
                  <QualityDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/head-doctor/settings"
            element={
              <ProtectedRoute allowedRoles={['head_doctor']}>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/head-doctor/audit"
            element={
              <ProtectedRoute allowedRoles={['head_doctor']}>
                <AppLayout>
                  <AuditLog />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
