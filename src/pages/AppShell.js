import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import TimerPage from './TimerPage';
import SchedulePage from './SchedulePage';
import DashboardPage from './DashboardPage';
import './AppShell.css';

const NAV_ITEMS = [
  { id: 'timer',    icon: '⏱',  label: 'Timer'     },
  { id: 'schedule', icon: '📋',  label: 'Schedule'  },
  { id: 'dashboard',icon: '📊',  label: 'Dashboard' },
];

export default function AppShell() {
  const { user, logout } = useApp();
  const [tab, setTab] = useState('timer');
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="shell-root">
      {/* Sidebar */}
      <aside className="shell-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon-sm">🎯</span>
          <span className="brand-text-sm">StudyClock</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {tab === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        {/* User block at bottom */}
        <div className="sidebar-user" onClick={() => setShowProfile(s => !s)}>
          <div className="user-avatar">{user?.avatar || '👤'}</div>
          <div className="user-info">
            <div className="user-name">{user?.displayName || user?.username}</div>
            <div className="user-role">Student</div>
          </div>
        </div>

        {/* Profile dropdown */}
        {showProfile && (
          <div className="profile-popup">
            <div className="profile-header">
              <span style={{ fontSize: 28 }}>{user?.avatar}</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{user?.displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user?.username}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="shell-main">
        {tab === 'timer'     && <TimerPage    user={user} />}
        {tab === 'schedule'  && <SchedulePage user={user} />}
        {tab === 'dashboard' && <DashboardPage user={user} />}
      </main>
    </div>
  );
}
