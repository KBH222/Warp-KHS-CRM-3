import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Layouts
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth Guard
import AuthGuard from '../components/AuthGuard';

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
const SyncDebug = lazy(() => import('../pages/SyncDebug'));

// Loading component
const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
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
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/schedule" element={<ScheduleCalendar />} />
          <Route path="/jobs/:id/photos" element={<JobPhotos />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/offline-dashboard" element={<OfflineDataDashboard />} />
          <Route path="/security" element={<PracticalSecurity />} />
          <Route path="/sync-debug" element={<SyncDebug />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};