import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    // Simulate async (for future API integration)
    await new Promise(r => setTimeout(r, 600));
    const result = login(username.trim(), password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  function fillDemo(u, p) {
    setUsername(u); setPassword(p); setError('');
  }

  return (
    <div className="login-root">
      {/* Background noise texture */}
      <div className="login-bg" />

      {/* Floating glow orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card scale-in">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-icon">🎯</div>
          <h1 className="brand-name">StudyClock</h1>
          <p className="brand-tagline">Focus · Flow · Excel</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Username</label>
            <div className="field-wrap">
              <span className="field-icon">👤</span>
              <input
                className="field-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div className="field-wrap">
              <span className="field-icon">🔒</span>
              <input
                className="field-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(s => !s)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <button className={`login-btn ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <>Sign In →</>
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="demo-section">
          <div className="demo-label">Demo Accounts</div>
          <div className="demo-accounts">
            <button className="demo-account" onClick={() => fillDemo('student', 'study123')}>
              <span className="demo-avatar">🎓</span>
              <div>
                <div className="demo-name">Arjun Sharma</div>
                <div className="demo-cred">student · study123</div>
              </div>
            </button>
            <button className="demo-account" onClick={() => fillDemo('admin', 'admin123')}>
              <span className="demo-avatar">🛠️</span>
              <div>
                <div className="demo-name">Admin User</div>
                <div className="demo-cred">admin · admin123</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        StudyClock v1.0 &nbsp;·&nbsp; Local storage mode &nbsp;·&nbsp; No data leaves your device
      </div>
    </div>
  );
}
