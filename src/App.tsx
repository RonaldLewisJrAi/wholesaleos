import React, { Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { PersistentLayout } from './components/layout/Layout';

// Async Chunk Splitting (Antigravity Memory Optimization)
const AppDashboard = React.lazy(() => import('./pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const LeadsManagement = React.lazy(() => import('./pages/Leads/LeadsManagement').then(m => ({ default: m.LeadsManagement })));
const LeadImport = React.lazy(() => import('./pages/Leads/LeadImport').then(m => ({ default: m.LeadImport })));
const DealsPipeline = React.lazy(() => import('./pages/Deals/DealsPipeline').then(m => ({ default: m.DealsPipeline })));
const InvestorDashboard = React.lazy(() => import('./pages/Investor/InvestorDashboard').then(m => ({ default: m.InvestorDashboard })));
const BuyerCRM = React.lazy(() => import('./pages/CRM/BuyerCRM').then(m => ({ default: m.BuyerCRM })));
const DealAnalyzer = React.lazy(() => import('./pages/Analyzer/DealAnalyzer').then(m => ({ default: m.DealAnalyzer })));
const ComplianceMonitor = React.lazy(() => import('./pages/Compliance/ComplianceMonitor').then(m => ({ default: m.ComplianceMonitor })));
const MarketingDashboard = React.lazy(() => import('./pages/Marketing/MarketingDashboard').then(m => ({ default: m.MarketingDashboard })));
const AppSettings = React.lazy(() => import('./pages/Settings/Settings').then(m => ({ default: m.Settings })));
const DealPublic = React.lazy(() => import('./pages/Deals/DealPublic').then(m => ({ default: m.DealPublic })));

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Properties = React.lazy(() => import('./pages/Properties'));
const Pipeline = React.lazy(() => import('./pages/Pipeline'));
const CRM = React.lazy(() => import('./pages/CRM'));
const Documents = React.lazy(() => import('./pages/Documents'));
const Calculators = React.lazy(() => import('./pages/Calculators'));
const Compliance = React.lazy(() => import('./pages/Compliance'));
const Radar = React.lazy(() => import('./pages/Radar'));
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

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GuidanceProvider>
          <SubscriptionProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white text-xl">Loading Wholesale OS...</div>}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Investor Room - Standalone UI Layout */}
                  <Route path="/investor" element={<InvestorDashboard />} />

                  {/* Public Deal Room - Standalone UI Layout */}
                  <Route path="/deal/:id" element={<DealPublic />} />

                  {/* Phase 15: Global Super Admin Sandbox */}
                  <Route path="/super-admin" element={<SuperAdminLayout />}>
                    <Route index element={<SuperAdminOverview />} />
                    <Route path="users" element={<SuperAdminUsers />} />
                    <Route path="deals" element={<SuperAdminDeals />} />
                    <Route path="verification" element={<SuperAdminVerification />} />
                    <Route path="logs" element={<SuperAdminLogs />} />
                  </Route>

                  {/* New SaaS App Layout Engine */}
                  <Route path="/app" element={<PersistentLayout />}>
                    <Route index element={<AppDashboard />} />
                    <Route path="leads" element={<LeadsManagement />} />
                    <Route path="leads/import" element={<LeadImport />} />
                    <Route path="deals" element={<DealsPipeline />} />
                    <Route path="buyers" element={<BuyerCRM />} />
                    <Route path="analyzer" element={<DealAnalyzer />} />
                    <Route path="compliance" element={<ComplianceMonitor />} />
                    <Route path="marketing" element={<MarketingDashboard />} />
                    <Route path="settings" element={<AppSettings />} />
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
              </Suspense>
            </BrowserRouter>
          </SubscriptionProvider>
        </GuidanceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
