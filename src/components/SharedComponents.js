import React, { useState, useEffect } from 'react';
import './SharedComponents.css';

// ── Helpers ──────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }
function getIST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

// ── IST Analog + Digital Clock ───────────────────────────────
export function ISTClock() {
  const [now, setNow] = useState(getIST());
  useEffect(() => {
    const t = setInterval(() => setNow(getIST()), 1000);
    return () => clearInterval(t);
  }, []);

  const H = now.getHours(), M = now.getMinutes(), S = now.getSeconds();
  const dH = (H % 12) * 30 + M * 0.5;
  const dM = M * 6 + S * 0.1;
  const dS = S * 6;

  const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const cx = 90, cy = 90, r = 74;

  function pt(angle, len) {
    const a = (angle - 90) * Math.PI / 180;
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  }

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const maj = i % 5 === 0;
    const inner = maj ? r - 10 : r - 5;
    return { x1: cx + inner * Math.cos(angle), y1: cy + inner * Math.sin(angle), x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle), maj };
  });

  const hp = pt(dH, 42), mp = pt(dM, 56), sp = pt(dS, 62);

  return (
    <div className="ist-clock">
      <div className="ist-badge">🇮🇳 India Standard Time</div>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r + 6} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={r} fill="var(--surface)" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.maj ? 'var(--text-muted)' : 'var(--border)'}
            strokeWidth={t.maj ? 1.5 : 0.8} strokeLinecap="round" />
        ))}
        {[12, 3, 6, 9].map((n, i) => {
          const a = (i * 90 - 90) * Math.PI / 180;
          return <text key={n} x={cx + 60 * Math.cos(a)} y={cy + 60 * Math.sin(a) + 4}
            textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontFamily="var(--font-mono)">{n}</text>;
        })}
        <line x1={cx} y1={cy} x2={hp.x} y2={hp.y} stroke="var(--text)" strokeWidth={3} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={mp.x} y2={mp.y} stroke="var(--text)" strokeWidth={2} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={sp.x} y2={sp.y} stroke="var(--accent)" strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--accent)" />
      </svg>
      <div className="ist-digital">{`${pad(H)}:${pad(M)}:${pad(S)}`}</div>
      <div className="ist-date">{DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}</div>
    </div>
  );
}

// ── Circular Pomodoro Timer ───────────────────────────────────
export function CircleTimer({ remaining, total, isBreak, name, paused, running }) {
  const r = 90, cx = 100, cy = 100;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, remaining / total) : 0;
  const dash = pct * circ;
  const col = isBreak ? 'var(--brk)' : 'var(--study)';
  const status = !running && !paused ? 'READY' : paused ? 'PAUSED' : remaining <= 0 ? 'DONE' : 'LIVE';

  const mins = Math.floor(Math.abs(remaining) / 60);
  const secs = Math.abs(remaining) % 60;

  return (
    <div className="circle-timer">
      <div className="timer-type-label" style={{ color: isBreak ? 'var(--brk)' : 'var(--study)' }}>
        {isBreak ? '🍃 Break' : '📚 Study Session'}
      </div>
      <div className="circle-svg-wrap" style={{ '--glow': isBreak ? 'var(--brk-glow)' : 'var(--study-glow)' }}>
        <svg width={220} height={220} viewBox="0 0 200 200">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={9} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={9}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.85s ease' }}
          />
          <circle cx={cx} cy={cy} r={r - 16} fill="var(--card)" />
        </svg>
        <div className="timer-inner">
          <div className="timer-digits">{`${pad(mins)}:${pad(secs)}`}</div>
          <div className="timer-status" style={{ color: col }}>{status}</div>
        </div>
      </div>
      <div className="timer-session-name">{name || '—'}</div>
    </div>
  );
}

// ── Toast Notification List ───────────────────────────────────
export function ToastList({ toasts }) {
  return (
    <div className="toast-list">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type || 'study'}`}>
          <div className="toast-title">{t.title}</div>
          <div className="toast-body">{t.body}</div>
        </div>
      ))}
    </div>
  );
}

// ── Small card stat ───────────────────────────────────────────
export function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={{ color: color || 'var(--text)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div className="section-header">
      <div className="label">{title}</div>
      {action}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`shared-card ${className}`}>{children}</div>;
}

// ── Pill button ───────────────────────────────────────────────
export function Btn({ children, variant = 'ghost', color, onClick, disabled, full, small, style: extraStyle }) {
  const cls = ['sc-btn', `btn-${variant}`, full ? 'btn-full' : '', small ? 'btn-sm' : ''].join(' ');
  return (
    <button className={cls} onClick={onClick} disabled={disabled}
      style={{ '--btn-color': color || 'var(--accent)', ...extraStyle }}>
      {children}
    </button>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────
export function Modal({ children, onClose, title, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-head">
            <div className="modal-title">{title}</div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Time input ────────────────────────────────────────────────
export function TimeInput({ value, onChange, label }) {
  return (
    <div className="field-group">
      {label && <label className="field-label-sm">{label}</label>}
      <input type="time" className="time-input" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner() {
  return <div className="sc-spinner" />;
}
