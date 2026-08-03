import React from 'react';
import "@/App.css";
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/auth/LoginPage';
import CitizenPortal from './components/citizen/CitizenPortal';
import OperatorDesk from './components/operator/OperatorDesk';
import CampusDesk from './components/campus/CampusDesk';
import AdminConsole from './components/admin/AdminConsole';
import { Toaster } from './components/ui/sonner';

function Routed() {
  const { profile } = useApp();
  const [adminMode, setAdminMode] = React.useState(false);

  React.useEffect(() => {
    const onHash = () => setAdminMode(window.location.hash === '#/admin');
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!profile) return <LoginPage />;
  const isOwner = (profile.email || '').toLowerCase() === 'symonsaniya@gmail.com';
  if (adminMode && isOwner) {
    return <AdminConsole onBack={() => { window.location.hash = ''; setAdminMode(false); }} />;
  }
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
