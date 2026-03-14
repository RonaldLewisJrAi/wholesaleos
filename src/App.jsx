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
import MarketplaceFeed from './pages/MarketplaceFeed';
import DealAnalyzer from './pages/DealAnalyzer';
import AcademyDashboard from './pages/Academy/AcademyDashboard';
import AcademyModule from './pages/Academy/AcademyModule';
import DealSimulator from './pages/Academy/DealSimulator';
import { DealRadarDashboard } from './pages/DealRadar/DealRadarDashboard';
import { ReferralDashboard } from './pages/Referrals/ReferralDashboard';
import { useAuth } from './contexts/useAuth';

const RoleBasedRedirect = () => {
  const { user, loadingAuth } = useAuth();

  if (loadingAuth) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0B1F33] text-white font-mono gap-4 tracking-widest uppercase">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <div>Initializing Matrix Node...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const role = user.primary_persona || 'WHOLESALER';
  console.info(`[ROUTER] Identity resolved. Routing persona: ${role}`);

  switch (role) {
    case 'WHOLESALER': return <Navigate to="/pipeline" replace />;
    case 'INVESTOR': return <Navigate to="/match-feed" replace />;
    case 'REALTOR': return <Navigate to="/referrals" replace />;
    case 'ACQUISITION': return <Navigate to="/lead-intake" replace />;
    case 'DISPOSITION': return <Navigate to="/buyer-matching" replace />;
    case 'VIRTUAL_ASSISTANT': return <Navigate to="/task-queue" replace />;
    case 'TEAM_MEMBER': return <Navigate to="/pipeline" replace />;
    case 'TITLE_COMPANY': return <Navigate to="/title-portal" replace />;
    default: return <Navigate to="/pipeline" replace />;
  }
};

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
                  <Route index element={<RoleBasedRedirect />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="properties/*" element={<Properties />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="crm" element={<CRM />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="analyzer" element={<DealAnalyzer />} />
                  <Route path="calculators" element={<Calculators />} />
                  <Route path="radar" element={<Radar />} />
                  <Route path="calendar" element={<CalendarView />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="spreadsheets" element={<Spreadsheets />} />

                  {/* Phase 35: Inter-Persona Placeholder Routes */}
                  <Route path="match-feed" element={<MarketplaceFeed />} />
                  <Route path="criteria" element={<ProxyComponent moduleName="Investor Buy Box" />} />
                  <Route path="saved" element={<ProxyComponent moduleName="Saved Properties" />} />
                  <Route path="offers" element={<ProxyComponent moduleName="Offer Manager" />} />
                  <Route path="referrals" element={<ReferralDashboard />} />
                  <Route path="lead-intake" element={<ProxyComponent moduleName="Lead Intake & Qualification" />} />
                  <Route path="buyer-matching" element={<ProxyComponent moduleName="Buyer Matching Matrix" />} />
                  <Route path="task-queue" element={<ProxyComponent moduleName="Global Task Queue" />} />
                  <Route path="title-portal" element={<ProxyComponent moduleName="Title Verification Portal" />} />
                  <Route path="listings" element={<ProxyComponent moduleName="Active Listings" />} />
                  <Route path="cma" element={<ProxyComponent moduleName="CMA Generation Tool" />} />
                  <Route path="dialer" element={<ProxyComponent moduleName="Auto-Dialer & Scripts" />} />
                  <Route path="leads-queue" element={<ProxyComponent moduleName="Lead Action Queue" />} />
                  <Route path="appointments" element={<ProxyComponent moduleName="Appointment Bookings" />} />
                  <Route path="integrations" element={<Settings />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="academy" element={<AcademyDashboard />} />
                  <Route path="academy/:moduleId" element={<AcademyModule />} />
                  <Route path="simulator" element={<DealSimulator />} />
                  <Route path="deal-radar/foreclosures" element={<DealRadarDashboard />} />
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
