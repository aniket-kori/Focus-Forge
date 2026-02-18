import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import AppShell from './pages/AppShell';
import './tokens.css';

function Root() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d1117', color: '#6b7591', fontSize: 14, gap: 12
      }}>
        <div style={{
          width: 22, height: 22, border: '2px solid #252d3f', borderTopColor: '#5b8dee',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite'
        }} />
        Loading StudyClock…
      </div>
    );
  }

  return user ? <AppShell /> : <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
