import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Pipeline from './pages/Pipeline';
import CRM from './pages/CRM';
import Documents from './pages/Documents';
import Calculators from './pages/Calculators';
import Compliance from './pages/Compliance';
import Radar from './pages/Radar';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import { SuperAdminOverview } from './pages/SuperAdmin/SuperAdminOverview';
import { SuperAdminUsers } from './pages/SuperAdmin/SuperAdminUsers';
import { SuperAdminDeals } from './pages/SuperAdmin/SuperAdminDeals';
import { SuperAdminVerification } from './pages/SuperAdmin/SuperAdminVerification';
import { SuperAdminLogs } from './pages/SuperAdmin/SuperAdminLogs';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { SubscriptionProvider } from './contexts/useSubscription';
import { AuthProvider } from './contexts/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { GuidanceProvider } from './contexts/GuidanceContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Pricing from './pages/Pricing';
import AuthCallback from './components/AuthCallback';
import ProxyComponent from './pages/Workstations/ProxyComponent';
import Spreadsheets from './pages/Workstations/Spreadsheets';
import DealRoom from './pages/Deals/DealRoom';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GuidanceProvider>
          <SubscriptionProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Phase 16: Central Deal Workspace */}
                <Route path="/deal/:id" element={<DealRoom />} />

                {/* Phase 15: Global Super Admin Sandbox */}
                <Route path="/super-admin" element={<SuperAdminLayout />}>
                  <Route index element={<SuperAdminOverview />} />
                  <Route path="users" element={<SuperAdminUsers />} />
                  <Route path="deals" element={<SuperAdminDeals />} />
                  <Route path="verification" element={<SuperAdminVerification />} />
                  <Route path="logs" element={<SuperAdminLogs />} />
                </Route>

                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="properties/*" element={<Properties />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="crm" element={<CRM />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="calculators" element={<Calculators />} />
                  <Route path="radar" element={<Radar />} />
                  <Route path="calendar" element={<CalendarView />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="spreadsheets" element={<Spreadsheets />} />

                  {/* Phase 35: Inter-Persona Placeholder Routes */}
                  <Route path="match-feed" element={<ProxyComponent moduleName="Deal Match Feed" />} />
                  <Route path="criteria" element={<ProxyComponent moduleName="Investor Buy Box" />} />
                  <Route path="saved" element={<ProxyComponent moduleName="Saved Properties" />} />
                  <Route path="offers" element={<ProxyComponent moduleName="Offer Manager" />} />
                  <Route path="referrals" element={<ProxyComponent moduleName="Referral Inbox" />} />
                  <Route path="listings" element={<ProxyComponent moduleName="Active Listings" />} />
                  <Route path="cma" element={<ProxyComponent moduleName="CMA Generation Tool" />} />
                  <Route path="dialer" element={<ProxyComponent moduleName="Auto-Dialer & Scripts" />} />
                  <Route path="leads-queue" element={<ProxyComponent moduleName="Lead Action Queue" />} />
                  <Route path="appointments" element={<ProxyComponent moduleName="Appointment Bookings" />} />
                  <Route path="integrations" element={<Settings />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SubscriptionProvider>
        </GuidanceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
