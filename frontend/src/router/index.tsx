import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Suspense, lazy } from 'react';

// Layouts
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Pages - Lazy loaded for better performance
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/DashboardEnhanced'));
const Customers = lazy(() => import('../pages/CustomersEnhanced'));
const CustomerDetail = lazy(() => import('../pages/CustomerDetailEnhanced'));
const Jobs = lazy(() => import('../pages/Jobs'));
const JobDetail = lazy(() => import('../pages/JobDetailTabbed'));
const Profile = lazy(() => import('../pages/Profile'));
const Materials = lazy(() => import('../pages/Materials'));
const Workers = lazy(() => import('../pages/Workers'));
const ScheduleCalendar = lazy(() => import('../pages/ScheduleCalendar'));
const JobPhotos = lazy(() => import('../pages/JobPhotos'));
const Reports = lazy(() => import('../pages/Reports'));
const Invoices = lazy(() => import('../pages/Invoices'));
const InvoiceDetail = lazy(() => import('../pages/InvoiceDetail'));
const OfflineDataDashboard = lazy(() => import('../components/OfflineDataDashboard'));
const PracticalSecurity = lazy(() => import('../pages/PracticalSecurity'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected Route wrapper - TEMPORARILY DISABLED
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // TEMPORARILY DISABLED - Always allow access
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
  
  return <>{children}</>;
};

export const Router = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        
        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* All other routes redirect to dashboard */}
          <Route path="/customers" element={<Navigate to="/dashboard" replace />} />
          <Route path="/customers/:id" element={<Navigate to="/dashboard" replace />} />
          <Route path="/jobs" element={<Navigate to="/dashboard" replace />} />
          <Route path="/jobs/:id" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="/materials" element={<Navigate to="/dashboard" replace />} />
          <Route path="/workers" element={<Navigate to="/dashboard" replace />} />
          <Route path="/schedule" element={<Navigate to="/dashboard" replace />} />
          <Route path="/jobs/:id/photos" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/invoices" element={<Navigate to="/dashboard" replace />} />
          <Route path="/invoices/:id" element={<Navigate to="/dashboard" replace />} />
          <Route path="/offline-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/security" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};