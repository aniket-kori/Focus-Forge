import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleDB, SessionDB } from '../utils/db';
import { playAlert, playNextSessionAlert, setSoundEnabled } from '../utils/audio';
import { CircleTimer, ToastList, Card, Btn, SectionHeader } from '../components/SharedComponents';
import './TimerPage.css';

const pad = n => String(n).padStart(2, '0');
const fmtDur = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}`;

function getIST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

// Digital IST Clock Component for header
function DigitalISTClock() {
  const [now, setNow] = useState(getIST());
  useEffect(() => {
    const t = setInterval(() => setNow(getIST()), 1000);
    return () => clearInterval(t);
  }, []);

  const H = now.getHours(), M = now.getMinutes(), S = now.getSeconds();
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="digital-clock">
      <div className="clock-time">{`${pad(H)}:${pad(M)}:${pad(S)}`}</div>
      <div className="clock-date">
        {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()} · IST
      </div>
    </div>
  );
}

export default function TimerPage({ user }) {
  // Schedule & session state
  const [schedule, setSchedule]   = useState(null);
  const [blocks, setBlocks]       = useState([]);
  const [cidx, setCidx]           = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning]     = useState(false);
  const [paused, setPaused]       = useState(false);
  const [soundOn, setSoundOn]     = useState(true);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Refs
  const ivRef     = useRef(null);
  const startTs   = useRef(null);
  const alertedRef = useRef({});

  // Load active schedule
  useEffect(() => {
    if (!user) return;
    const sch = ScheduleDB.getActive(user.id);
    if (sch) {
      setSchedule(sch);
      setBlocks(sch.blocks || []);
    }
  }, [user]);

  // Sound toggle
  useEffect(() => setSoundEnabled(soundOn), [soundOn]);

  const cur = blocks[cidx] || null;
  const totalSecs = (cur?.duration || 0) * 60;
  const isBreak = cur?.type === 'break';

  const totalMin = blocks.reduce((a, b) => a + b.duration, 0);
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = SessionDB.getByDate(user?.id, today);

  // Toast helper
  const toast = useCallback((title, body, type = 'study') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, body, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5500);
  }, []);

  // Start/switch session
  function startSession(idx) {
    const block = blocks[idx];
    if (!block) return;
    clearInterval(ivRef.current);
    setCidx(idx);
    setRemaining(block.duration * 60);
    setRunning(true);
    setPaused(false);
    startTs.current = Date.now();
    alertedRef.current = {};

    if (block.type === 'break') {
      toast('🍃 Break Time!', `${block.name} — ${block.duration} minutes`, 'break');
      playAlert('breakStart');
    } else {
      toast('📚 Session Starting', `${block.name} — ${block.duration} minutes`, 'study');
      playAlert('sessionStart');
    }
  }

  // Tick
  useEffect(() => {
    if (!running || paused || remaining === null) return;
    ivRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev === null) return null;
        const nxt = prev - 1;
        // 5-minute warning
        if (nxt === 300 && !alertedRef.current['5m']) {
          alertedRef.current['5m'] = true;
          toast('⏰ 5 Minutes Left', `${cur?.name} ending soon`, 'warn');
          playAlert('warning5min');
        }
        // 2-minute warning with next session name
        if (nxt === 120 && !alertedRef.current['2m']) {
          alertedRef.current['2m'] = true;
          const nxBlock = blocks[cidx + 1];
          if (nxBlock) {
            toast('⏰ 2 Minutes', `Next: ${nxBlock.name}`, 'warn');
            playNextSessionAlert(nxBlock.name);
          } else {
            toast('⏰ 2 Minutes', 'Final session ending soon', 'warn');
            playAlert('warning2min');
          }
        }
        if (nxt <= 0) return 0;
        return nxt;
      });
    }, 1000);
    return () => clearInterval(ivRef.current);
  }, [running, paused, remaining, cur, cidx, blocks, toast]);

  // Session end
  useEffect(() => {
    if (remaining !== 0 || !running) return;
    setRunning(false);
    const spent = startTs.current ? (Date.now() - startTs.current) / 1000 : (cur?.duration || 0) * 60;

    // Log to DB
    if (user && cur) {
      SessionDB.log(user.id, {
        scheduleId: schedule?.id,
        blockId: cur.id,
        name: cur.name,
        subject: cur.subject || '',
        type: cur.type,
        plannedMinutes: cur.duration,
        actualMinutes: Math.round(spent / 60),
      });
    }

    if (cur?.type === 'break') {
      toast('✅ Break Complete', 'Ready to study again!', 'study');
      playAlert('breakEnd');
    } else {
      toast(`✅ ${cur?.name} Done!`, 'Great focus. Keep it up!', 'study');
      playAlert('sessionEnd');
    }

    setTimeout(() => {
      const next = cidx + 1;
      if (next < blocks.length) startSession(next);
    }, 3500);
  }, [remaining, running]);

  function pause()  { setPaused(true);  setRunning(false); clearInterval(ivRef.current); }
  function resume() { setPaused(false); setRunning(true); }
  function skip()   {
    clearInterval(ivRef.current);
    setRunning(false);
    // Log partial
    if (user && cur && startTs.current) {
      const spent = (Date.now() - startTs.current) / 1000;
      SessionDB.log(user.id, {
        scheduleId: schedule?.id, blockId: cur.id,
        name: cur.name, subject: cur.subject || '',
        type: cur.type, plannedMinutes: cur.duration,
        actualMinutes: Math.round(spent / 60),
      });
    }
    const next = cidx + 1;
    if (next < blocks.length) startSession(next);
  }
  function reset() {
    clearInterval(ivRef.current);
    setRunning(false); setPaused(false);
    setCidx(0); setRemaining(null);
    alertedRef.current = {};
  }
  function editCurrentDur(delta) {
    setBlocks(prev => prev.map((b, i) => i !== cidx ? b : { ...b, duration: Math.max(5, b.duration + delta) }));
    if (running || paused) setRemaining(p => Math.max(0, (p || 0) + delta * 60));
  }

  if (!schedule) {
    return (
      <div className="timer-page">
        <div className="no-schedule">
          <div style={{ fontSize: 48 }}>📋</div>
          <h3>No Active Schedule</h3>
          <p>Go to the <strong>Schedule</strong> tab to create or activate a schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-page">
      <ToastList toasts={toasts} />

      {/* Top bar with IST Clock, Schedule name, and Sound toggle */}
      <div className="timer-top-bar">
        <DigitalISTClock />
        <div className="top-bar-center">
          <div className="timer-schedule-name">{schedule.name}</div>
          <div className="timer-meta">{blocks.length} sessions · {fmtDur(totalMin)} total</div>
        </div>
        <button
          className={`sound-btn ${soundOn ? 'on' : 'off'}`}
          onClick={() => setSoundOn(s => !s)}
          title="Toggle sound alerts"
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Main two-column layout */}
      <div className="timer-main-grid">
        
        {/* LEFT: Pomodoro Timer */}
        <div className="timer-pomodoro-section">
          <Card className="pomodoro-card">
            <CircleTimer
              remaining={remaining ?? totalSecs}
              total={totalSecs || 1}
              isBreak={isBreak}
              name={cur?.name || 'No Session'}
              paused={paused}
              running={running}
            />

            {/* Time adjust */}
            <div className="adjust-row">
              {[-15, -10, -5, 5, 10, 15].map(d => (
                <button
                  key={d}
                  className={`adj-btn ${d < 0 ? 'adj-minus' : 'adj-plus'}`}
                  onClick={() => editCurrentDur(d)}
                  title={`${d > 0 ? 'Add' : 'Remove'} ${Math.abs(d)} minutes`}
                >
                  {d > 0 ? '+' : ''}{d}m
                </button>
              ))}
            </div>

            {/* Current block info */}
            {cur && (
              <div className="block-info">
                {cur.subject && <span className="block-subject">{cur.subject}</span>}
                {cur.notes && <p className="block-notes">💡 {cur.notes}</p>}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Controls (top) + Schedule (bottom) */}
        <div className="timer-right-panel">
          
          {/* TOP: Controls */}
          <Card className="controls-card">
            <SectionHeader title="Controls" />
            <div className="controls-grid">
              {!running && !paused && (
                <Btn variant="solid" color="var(--study)" full onClick={() => startSession(cidx)}>
                  ▶ Start Session
                </Btn>
              )}
              {running && (
                <Btn variant="outline" color="var(--brk)" full onClick={pause}>
                  ⏸ Pause
                </Btn>
              )}
              {paused && (
                <Btn variant="solid" color="var(--study)" full onClick={resume}>
                  ▶ Resume
                </Btn>
              )}
              <Btn variant="outline" color="var(--accent)" full onClick={skip} disabled={cidx >= blocks.length - 1 && !running}>
                ⏭ Skip to Next
              </Btn>
              <Btn variant="ghost" full onClick={reset}>
                ↺ Reset Schedule
              </Btn>
            </div>

            {/* Stats summary - horizontal */}
            <div className="stats-chips">
              <div className="stat-chip">
                <span className="chip-label">Done Today</span>
                <span className="chip-value" style={{ color: 'var(--study)' }}>
                  {doneToday.filter(s => s.type === 'study').length}
                </span>
              </div>
              <div className="stat-chip">
                <span className="chip-label">Breaks</span>
                <span className="chip-value" style={{ color: 'var(--brk)' }}>
                  {doneToday.filter(s => s.type === 'break').length}
                </span>
              </div>
              <div className="stat-chip">
                <span className="chip-label">Total Time</span>
                <span className="chip-value">{fmtDur(totalMin)}</span>
              </div>
            </div>
          </Card>

          {/* BOTTOM: Schedule Queue */}
          <Card className="schedule-card">
            <SectionHeader title={`Today's Schedule (${blocks.length})`} />
            <div className="schedule-compact-list">
              {blocks.map((b, i) => {
                const done = i < cidx;
                const active = i === cidx;
                return (
                  <div
                    key={b.id}
                    className={`schedule-compact-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                    onClick={() => {
                      if (!running) {
                        setCidx(i);
                        setRemaining(b.duration * 60);
                        setRunning(false);
                        setPaused(false);
                      }
                    }}
                  >
                    <div className="sched-left">
                      <div className={`sched-bar ${b.type}`} />
                      <span className="sched-time">{b.startTime}</span>
                      <div className="sched-name-wrap">
                        <span className="sched-name">{b.name}</span>
                        {b.subject && <span className="sched-subject-mini">{b.subject}</span>}
                      </div>
                    </div>
                    <div className="sched-right">
                      <span className="sched-dur">{fmtDur(b.duration)}</span>
                      {done && <span className="sched-done">✓</span>}
                      {active && <span className="sched-live pulse">●</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
