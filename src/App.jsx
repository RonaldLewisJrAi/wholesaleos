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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { DemoModeProvider } from './contexts/DemoModeContext';
import { SubscriptionProvider } from './contexts/useSubscription';
import { AuthProvider } from './contexts/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { GuidanceProvider } from './contexts/GuidanceContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ProxyComponent from './pages/Workstations/ProxyComponent';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GuidanceProvider>
          <SubscriptionProvider>
            <DemoModeProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
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
                    <Route path="super-admin" element={<SuperAdminDashboard />} />
                    <Route path="terms" element={<TermsOfService />} />
                    <Route path="privacy" element={<PrivacyPolicy />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </DemoModeProvider>
          </SubscriptionProvider>
        </GuidanceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
