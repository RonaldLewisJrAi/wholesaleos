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
import { DemoModeProvider } from './contexts/DemoModeContext';

function App() {
  return (
    <DemoModeProvider>
      <BrowserRouter>
        <Routes>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoModeProvider>
  );
}

export default App;
