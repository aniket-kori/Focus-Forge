import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDB, LoginDB, ScheduleDB, SessionDB } from '../utils/db';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sc_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const u = UserDB.findById(parsed.id);
        if (u) {
          setUser(u);
          LoginDB.recordToday();
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  function login(username, password) {
    const u = UserDB.findByCredentials(username, password);
    if (!u) return { success: false, error: 'Invalid username or password' };
    setUser(u);
    localStorage.setItem('sc_session', JSON.stringify({ id: u.id }));
    LoginDB.recordToday();
    return { success: true };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('sc_session');
  }

  return (
    <AppContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
