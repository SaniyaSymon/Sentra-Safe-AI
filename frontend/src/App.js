import React from 'react';
import "@/App.css";
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import CitizenPortal from './components/citizen/CitizenPortal';
import OperatorDesk from './components/operator/OperatorDesk';
import CampusDesk from './components/campus/CampusDesk';
import { Toaster } from './components/ui/sonner';

function Routed() {
  const { profile } = useApp();
  if (!profile) return <LoginPage />;
  if (profile.role === 'operator') return <OperatorDesk />;
  if (profile.role === 'campus') return <CampusDesk />;
  return <CitizenPortal />;
}

function App() {
  return (
    <AppProvider>
      <div className="App">
        <Routed />
        <Toaster position="top-right" richColors />
      </div>
    </AppProvider>
  );
}

export default App;
