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
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
