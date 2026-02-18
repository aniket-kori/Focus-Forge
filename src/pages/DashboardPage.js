import React, { useState, useEffect } from 'react';
import { SessionDB, NoteDB, LoginDB, ScheduleDB } from '../utils/db';
import { StatCard, Card, SectionHeader } from '../components/SharedComponents';
import './DashboardPage.css';

const pad = n => String(n).padStart(2, '0');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function fmtDur(m) {
  if (!m || m <= 0) return '0m';
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60 > 0 ? m % 60 + 'm' : ''}`.trim();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ── Mini bar chart ────────────────────────────────────────────
function BarChart({ data, maxVal, color }) {
  if (!data || data.length === 0) return null;
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-wrap">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%`, background: color || 'var(--study)' }} />
          </div>
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Subject pie/bar breakdown ─────────────────────────────────
function SubjectBreakdown({ stats }) {
  if (!stats || stats.length === 0) {
    return <div className="no-data">No study data yet for this week.</div>;
  }
  const total = stats.reduce((a, s) => a + s.totalMinutes, 0);
  const colors = ['var(--study)','var(--accent)','var(--brk)','#9b4a82','#4a6b9b','#6a9b4a'];
  return (
    <div className="subject-breakdown">
      {stats.map((s, i) => (
        <div key={s.subject} className="subject-row">
          <div className="subject-left">
            <div className="subject-dot" style={{ background: colors[i % colors.length] }} />
            <span className="subject-name">{s.subject}</span>
            <span className="subject-sessions">{s.sessions}×</span>
          </div>
          <div className="subject-bar-wrap">
            <div className="subject-bar" style={{
              width: `${(s.totalMinutes / total) * 100}%`,
              background: colors[i % colors.length],
            }} />
          </div>
          <span className="subject-time">{fmtDur(s.totalMinutes)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────
function ActivityCalendar({ loginDates, sessionsByDate }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const todayKey    = todayStr();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const n = new Date();
    if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth())) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function getIntensity(key) {
    const count = (sessionsByDate[key] || []).filter(s => s.type === 'study').length;
    if (count === 0) return 'none';
    if (count < 2)  return 'low';
    if (count < 4)  return 'mid';
    return 'high';
  }

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{MONTHS[month]} {year}</span>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {DAYS_SHORT.map(d => (
          <div key={d} className="cal-header-cell">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isToday = key === todayKey;
          const isLogin = loginDates.includes(key);
          const intensity = getIntensity(key);
          return (
            <div
              key={day}
              className={`cal-cell ${isToday ? 'today' : ''} ${isLogin ? 'logged' : ''} intensity-${intensity}`}
              title={`${key}: ${(sessionsByDate[key] || []).filter(s => s.type === 'study').length} study sessions`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span>Less</span>
        <div className="legend-cell intensity-none" />
        <div className="legend-cell intensity-low" />
        <div className="legend-cell intensity-mid" />
        <div className="legend-cell intensity-high" />
        <span>More</span>
      </div>
    </div>
  );
}

// ── Notes panel ───────────────────────────────────────────────
function NotesPanel({ userId }) {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');

  function reload() { setNotes(NoteDB.getAll(userId)); }
  useEffect(() => reload(), [userId]);

  function addNote() {
    if (!input.trim()) return;
    NoteDB.add(userId, input.trim());
    setInput('');
    reload();
  }

  function deleteNote(id) { NoteDB.delete(id); reload(); }
  function togglePin(id)  { NoteDB.togglePin(id); reload(); }

  const pinned   = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);
  const sorted   = [...pinned, ...unpinned].reverse();

  return (
    <div className="notes-panel">
      <div className="notes-input-row">
        <textarea
          className="notes-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Write a note about today's study session… (Enter to save)"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
          rows={2}
        />
        <button className="notes-add-btn" onClick={addNote}>Add</button>
      </div>
      <div className="notes-list">
        {sorted.length === 0 && (
          <div className="no-data">No notes yet. Add your first note above.</div>
        )}
        {sorted.map(n => (
          <div key={n.id} className={`note-item ${n.pinned ? 'pinned' : ''}`}>
            <div className="note-text">{n.text}</div>
            <div className="note-footer">
              <span className="note-meta">{n.date} · {n.time}</span>
              <div className="note-actions">
                <button className="note-btn" onClick={() => togglePin(n.id)} title="Pin note">
                  {n.pinned ? '📌' : '🔲'}
                </button>
                <button className="note-btn del" onClick={() => deleteNote(n.id)} title="Delete">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function DashboardPage({ user }) {
  const [todaySessions, setTodaySessions] = useState([]);
  const [weekSessions,  setWeekSessions]  = useState([]);
  const [loginDates,    setLoginDates]    = useState([]);
  const [subjectStats,  setSubjectStats]  = useState([]);
  const [sessionsByDate,setSessionsByDate]= useState({});
  const [schedules,     setSchedules]     = useState([]);

  const today = todayStr();

  useEffect(() => {
    if (!user) return;
    const ts = SessionDB.getByDate(user.id, today);
    setTodaySessions(ts);

    const ws = SessionDB.getByDateRange(user.id, prevDayStr(6), today);
    setWeekSessions(ws);

    const all = SessionDB.getAll(user.id);
    const byDate = {};
    all.forEach(s => {
      if (!byDate[s.date]) byDate[s.date] = [];
      byDate[s.date].push(s);
    });
    setSessionsByDate(byDate);

    setLoginDates(LoginDB.getAll(user.id));
    setSubjectStats(SessionDB.getSubjectStats(user.id, 7));
    setSchedules(ScheduleDB.getAll(user.id));
  }, [user, today]);

  function prevDayStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  const studyToday   = todaySessions.filter(s => s.type === 'study').reduce((a, s) => a + s.actualMinutes, 0);
  const breakToday   = todaySessions.filter(s => s.type === 'break').reduce((a, s) => a + s.actualMinutes, 0);
  const sessionsToday= todaySessions.filter(s => s.type === 'study').length;
  const studyWeek    = weekSessions.filter(s => s.type === 'study').reduce((a, s) => a + s.actualMinutes, 0);
  const loginStreak  = computeStreak(loginDates, today);

  // Weekly chart data (last 7 days)
  const weekChartData = Array.from({ length: 7 }, (_, i) => {
    const d = prevDayStr(6 - i);
    const mins = (sessionsByDate[d] || []).filter(s => s.type === 'study').reduce((a, s) => a + s.actualMinutes, 0);
    const label = ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d).getDay()];
    return { label, value: mins };
  });

  function computeStreak(dates, today) {
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      if (dates.includes(key)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  const activeSchedule = schedules.find(s => {
    const act = JSON.parse(localStorage.getItem('sc_db_active_schedule') || '{}');
    return s.id === act.scheduleId;
  });

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="user-greeting">
          <span className="greeting-emoji">{user?.avatar}</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>Welcome back,</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.displayName}</div>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="stats-grid">
        <StatCard icon="📚" value={fmtDur(studyToday)} label="Study Today" color="var(--study)" />
        <StatCard icon="🍃" value={fmtDur(breakToday)} label="Break Today"  color="var(--brk)" />
        <StatCard icon="✅" value={sessionsToday}       label="Sessions Done" color="var(--accent)" />
        <StatCard icon="📅" value={`${studyWeek >= 60 ? Math.floor(studyWeek/60)+'h' : studyWeek+'m'}`} label="This Week" color="var(--text)" />
        <StatCard icon="🔥" value={`${loginStreak}d`}  label="Login Streak"  color="var(--warning)" />
        <StatCard icon="📋" value={schedules.length}   label="Schedules"     color="var(--text-muted)" />
      </div>

      <div className="dash-grid">

        {/* TODAY'S SESSION LOG */}
        <Card>
          <SectionHeader title="Today's Session Log" />
          {todaySessions.length === 0 ? (
            <div className="no-data">No sessions logged today. Start the Timer to begin!</div>
          ) : (
            <div className="session-log">
              {todaySessions.map(s => (
                <div key={s.id} className="log-row">
                  <div className={`log-dot ${s.type}`} />
                  <div className="log-info">
                    <div className="log-name">{s.name}</div>
                    {s.subject && <div className="log-subject">{s.subject}</div>}
                  </div>
                  <div className="log-times">
                    <span className="log-actual">{fmtDur(s.actualMinutes)}</span>
                    {s.plannedMinutes !== s.actualMinutes && (
                      <span className="log-planned">/ {fmtDur(s.plannedMinutes)} planned</span>
                    )}
                  </div>
                  <span className={`log-type-tag ${s.type}`}>{s.type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* WEEKLY CHART */}
        <Card>
          <SectionHeader title="Study Time (Last 7 Days)" />
          <BarChart data={weekChartData} color="var(--study)" />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            Total this week: {fmtDur(studyWeek)}
          </div>
        </Card>

        {/* SUBJECT BREAKDOWN */}
        <Card>
          <SectionHeader title="Subject Breakdown (7 Days)" />
          <SubjectBreakdown stats={subjectStats} />
        </Card>

        {/* ACTIVITY CALENDAR */}
        <Card>
          <SectionHeader title="Activity Calendar" />
          <ActivityCalendar loginDates={loginDates} sessionsByDate={sessionsByDate} />
        </Card>

        {/* ACTIVE SCHEDULE INFO */}
        {activeSchedule && (
          <Card>
            <SectionHeader title="Active Schedule" />
            <div className="active-sch-info">
              <div className="active-sch-color" style={{ background: activeSchedule.color }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{activeSchedule.name}</div>
                {activeSchedule.description && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{activeSchedule.description}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {activeSchedule.blocks.length} blocks ·{' '}
                  {fmtDur(activeSchedule.blocks.reduce((a, b) => a + b.duration, 0))} total
                </div>
              </div>
            </div>
            <div className="timeline-preview">
              {activeSchedule.blocks.map((b, i) => (
                <div key={i} className={`tl-seg ${b.type}`} style={{ flex: b.duration }}
                  title={`${b.name} (${b.duration}m)`} />
              ))}
            </div>
          </Card>
        )}

        {/* NOTES — full width */}
        <Card className="notes-card">
          <SectionHeader title="Study Notes" />
          <NotesPanel userId={user?.id} />
        </Card>

      </div>
    </div>
  );
}
