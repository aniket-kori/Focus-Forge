// ============================================================
//  db.js  —  Local "file-based" database using localStorage
//  Simulates reading/writing JSON-backed XML-style records.
//  Replace localStorage calls with actual file I/O or REST
//  calls when integrating a real database later.
// ============================================================

const DB_KEYS = {
  USERS:      'sc_db_users',
  SCHEDULES:  'sc_db_schedules',
  SESSIONS:   'sc_db_sessions',     // completed session logs
  NOTES:      'sc_db_notes',
  LOGINS:     'sc_db_logins',
  ACTIVE_SCH: 'sc_db_active_schedule',
  SETTINGS:   'sc_db_settings',
};

// ── Generic helpers ──────────────────────────────────────────
function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function today() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

// ── SEED: initial demo data ──────────────────────────────────
function seedDatabase() {
  if (read(DB_KEYS.USERS)) return; // already seeded

  // Users
  const users = [
    {
      id: 'usr_demo',
      username: 'student',
      password: 'study123',       // plain text for local demo
      displayName: 'Arjun Sharma',
      avatar: '🎓',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_admin',
      username: 'admin',
      password: 'admin123',
      displayName: 'Admin User',
      avatar: '🛠️',
      createdAt: new Date().toISOString(),
    },
  ];
  write(DB_KEYS.USERS, users);

  // Demo schedules
  const schedules = [
    {
      id: 'sch_jee',
      ownerId: 'usr_demo',
      name: 'JEE Preparation',
      description: 'Daily schedule for JEE Mains & Advanced preparation',
      color: '#4a8f7a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        { id:'b1', name:'Mathematics — Calculus',     type:'study', startTime:'06:00', duration:60,  subject:'Mathematics',  notes:'Focus on integration by parts' },
        { id:'b2', name:'Morning Break',              type:'break', startTime:'07:00', duration:15,  subject:'',             notes:'' },
        { id:'b3', name:'Physics — Mechanics',        type:'study', startTime:'07:15', duration:75,  subject:'Physics',      notes:'Newton laws + problem sets' },
        { id:'b4', name:'Short Break',                type:'break', startTime:'08:30', duration:10,  subject:'',             notes:'' },
        { id:'b5', name:'Chemistry — Organic',        type:'study', startTime:'08:40', duration:60,  subject:'Chemistry',    notes:'Reaction mechanisms' },
        { id:'b6', name:'Lunch & Rest',               type:'break', startTime:'09:40', duration:40,  subject:'',             notes:'Eat well, short walk' },
        { id:'b7', name:'Mathematics — Algebra',      type:'study', startTime:'10:20', duration:60,  subject:'Mathematics',  notes:'Matrices and determinants' },
        { id:'b8', name:'Short Break',                type:'break', startTime:'11:20', duration:10,  subject:'',             notes:'' },
        { id:'b9', name:'Physics — Electricity',      type:'study', startTime:'11:30', duration:60,  subject:'Physics',      notes:'Coulomb law, capacitors' },
        { id:'b10',name:'Short Break',                type:'break', startTime:'12:30', duration:10,  subject:'',             notes:'' },
        { id:'b11',name:'Chemistry — Inorganic',      type:'study', startTime:'12:40', duration:50,  subject:'Chemistry',    notes:'Periodic table trends' },
        { id:'b12',name:'Evening Revision',           type:'study', startTime:'13:30', duration:45,  subject:'Revision',     notes:'Review all topics of the day' },
        { id:'b13',name:'Mock Test Practice',         type:'study', startTime:'14:15', duration:60,  subject:'Mock Test',    notes:'Full syllabus questions' },
        { id:'b14',name:'Wind Down',                  type:'break', startTime:'15:15', duration:15,  subject:'',             notes:'Light reading, relax' },
      ],
    },
    {
      id: 'sch_boards',
      ownerId: 'usr_demo',
      name: 'Board Exam Schedule',
      description: 'Class 12 Board preparation — Science stream',
      color: '#5b8dee',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        { id:'c1', name:'English Literature',         type:'study', startTime:'07:00', duration:50,  subject:'English',      notes:'Essay writing practice' },
        { id:'c2', name:'Short Break',                type:'break', startTime:'07:50', duration:10,  subject:'',             notes:'' },
        { id:'c3', name:'Mathematics',                type:'study', startTime:'08:00', duration:90,  subject:'Mathematics',  notes:'Chapter problems' },
        { id:'c4', name:'Lunch',                      type:'break', startTime:'09:30', duration:30,  subject:'',             notes:'' },
        { id:'c5', name:'Physics',                    type:'study', startTime:'10:00', duration:60,  subject:'Physics',      notes:'Derivations & numericals' },
        { id:'c6', name:'Break',                      type:'break', startTime:'11:00', duration:15,  subject:'',             notes:'' },
        { id:'c7', name:'Chemistry',                  type:'study', startTime:'11:15', duration:60,  subject:'Chemistry',    notes:'Reactions and equations' },
        { id:'c8', name:'Biology',                    type:'study', startTime:'12:15', duration:45,  subject:'Biology',      notes:'Diagrams and definitions' },
        { id:'c9', name:'Revision Hour',              type:'study', startTime:'13:00', duration:60,  subject:'Revision',     notes:'Daily topics review' },
      ],
    },
    {
      id: 'sch_weekend',
      ownerId: 'usr_demo',
      name: 'Weekend Light Study',
      description: 'Relaxed weekend schedule with extra breaks',
      color: '#8f7a4a',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        { id:'w1', name:'Morning Reading',            type:'study', startTime:'09:00', duration:45,  subject:'Reading',      notes:'Self-study, light topics' },
        { id:'w2', name:'Break',                      type:'break', startTime:'09:45', duration:20,  subject:'',             notes:'' },
        { id:'w3', name:'Mathematics Practice',       type:'study', startTime:'10:05', duration:60,  subject:'Mathematics',  notes:'Solve previous year papers' },
        { id:'w4', name:'Long Break',                 type:'break', startTime:'11:05', duration:45,  subject:'',             notes:'Walk or exercise' },
        { id:'w5', name:'Science Concepts',           type:'study', startTime:'11:50', duration:50,  subject:'Science',      notes:'Concept clarity sessions' },
        { id:'w6', name:'Revision & Notes',           type:'study', startTime:'12:40', duration:40,  subject:'Revision',     notes:'Organize notes, make mind maps' },
      ],
    },
  ];
  write(DB_KEYS.SCHEDULES, schedules);
  write(DB_KEYS.ACTIVE_SCH, { userId: 'usr_demo', scheduleId: 'sch_jee' });

  // Demo completed sessions (past few days)
  const demoSessions = generateDemoSessions();
  write(DB_KEYS.SESSIONS, demoSessions);

  // Demo notes
  const notes = [
    { id:'n1', userId:'usr_demo', text:'Remember to revise organic chemistry reactions before Thursday test.', date: today(), time:'10:32 AM', pinned: true },
    { id:'n2', userId:'usr_demo', text:'Physics mechanics portion is weak — spend extra 20 min tomorrow.', date: today(), time:'02:15 PM', pinned: false },
    { id:'n3', userId:'usr_demo', text:'Completed full mock test — scored 78%. Need work on integration.', date: prevDay(1), time:'04:00 PM', pinned: false },
  ];
  write(DB_KEYS.NOTES, notes);

  // Login history (last 20 days)
  const logins = [];
  for (let i = 0; i < 20; i++) {
    if (Math.random() > 0.3) logins.push(prevDay(i));
  }
  write(DB_KEYS.LOGINS, [...new Set(logins)]);

  write(DB_KEYS.SETTINGS, {
    userId: 'usr_demo',
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true,
    autoAdvance: true,
    warningAt5min: true,
    warningAt2min: true,
  });
}

function prevDay(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

function generateDemoSessions() {
  const sessions = [];
  const subjectData = [
    { name:'Mathematics — Calculus', subject:'Mathematics', type:'study' },
    { name:'Physics — Mechanics',    subject:'Physics',     type:'study' },
    { name:'Chemistry — Organic',    subject:'Chemistry',   type:'study' },
    { name:'English Literature',     subject:'English',     type:'study' },
    { name:'Revision',               subject:'Revision',    type:'study' },
    { name:'Short Break',            subject:'',            type:'break' },
    { name:'Lunch & Rest',           subject:'',            type:'break' },
  ];
  for (let day = 0; day < 14; day++) {
    if (Math.random() < 0.3) continue; // skip some days
    const date = prevDay(day);
    const count = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < count; s++) {
      const tpl = subjectData[Math.floor(Math.random() * subjectData.length)];
      sessions.push({
        id: uid(),
        userId: 'usr_demo',
        scheduleId: 'sch_jee',
        blockId: 'b' + (s + 1),
        name: tpl.name,
        subject: tpl.subject,
        type: tpl.type,
        plannedMinutes: 45 + Math.floor(Math.random() * 30),
        actualMinutes: 40 + Math.floor(Math.random() * 35),
        date,
        completedAt: new Date().toISOString(),
      });
    }
  }
  return sessions;
}

// ── USER APIs ────────────────────────────────────────────────
export const UserDB = {
  getAll: () => read(DB_KEYS.USERS) || [],

  findByCredentials: (username, password) => {
    const users = read(DB_KEYS.USERS) || [];
    return users.find(u => u.username === username && u.password === password) || null;
  },

  findById: (id) => {
    const users = read(DB_KEYS.USERS) || [];
    return users.find(u => u.id === id) || null;
  },

  update: (id, updates) => {
    const users = read(DB_KEYS.USERS) || [];
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...updates };
    return write(DB_KEYS.USERS, users);
  },
};

// ── SCHEDULE APIs ────────────────────────────────────────────
export const ScheduleDB = {
  getAll: (userId) => {
    const all = read(DB_KEYS.SCHEDULES) || [];
    return userId ? all.filter(s => s.ownerId === userId) : all;
  },

  getById: (id) => {
    const all = read(DB_KEYS.SCHEDULES) || [];
    return all.find(s => s.id === id) || null;
  },

  getActive: (userId) => {
    const active = read(DB_KEYS.ACTIVE_SCH);
    if (!active || active.userId !== userId) return null;
    return ScheduleDB.getById(active.scheduleId);
  },

  setActive: (userId, scheduleId) => {
    return write(DB_KEYS.ACTIVE_SCH, { userId, scheduleId });
  },

  create: (userId, data) => {
    const all = read(DB_KEYS.SCHEDULES) || [];
    const schedule = {
      id: 'sch_' + uid(),
      ownerId: userId,
      name: data.name || 'New Schedule',
      description: data.description || '',
      color: data.color || '#5b8dee',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: (data.blocks || []).map((b, i) => ({ ...b, id: b.id || 'b_' + uid() })),
    };
    all.push(schedule);
    write(DB_KEYS.SCHEDULES, all);
    return schedule;
  },

  update: (id, updates) => {
    const all = read(DB_KEYS.SCHEDULES) || [];
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    write(DB_KEYS.SCHEDULES, all);
    return all[idx];
  },

  delete: (id) => {
    const all = read(DB_KEYS.SCHEDULES) || [];
    const filtered = all.filter(s => s.id !== id);
    return write(DB_KEYS.SCHEDULES, filtered);
  },
};

// ── SESSION LOG APIs ─────────────────────────────────────────
export const SessionDB = {
  getAll: (userId) => {
    const all = read(DB_KEYS.SESSIONS) || [];
    return userId ? all.filter(s => s.userId === userId) : all;
  },

  getByDate: (userId, date) => {
    return SessionDB.getAll(userId).filter(s => s.date === date);
  },

  getByDateRange: (userId, startDate, endDate) => {
    return SessionDB.getAll(userId).filter(s => s.date >= startDate && s.date <= endDate);
  },

  log: (userId, data) => {
    const all = read(DB_KEYS.SESSIONS) || [];
    const entry = {
      id: uid(),
      userId,
      scheduleId: data.scheduleId || '',
      blockId: data.blockId || '',
      name: data.name,
      subject: data.subject || '',
      type: data.type,
      plannedMinutes: data.plannedMinutes || 0,
      actualMinutes: data.actualMinutes || 0,
      date: today(),
      completedAt: new Date().toISOString(),
    };
    all.push(entry);
    write(DB_KEYS.SESSIONS, all);
    return entry;
  },

  getSubjectStats: (userId, days = 7) => {
    const cutoff = prevDay(days);
    const sessions = SessionDB.getAll(userId).filter(s => s.date >= cutoff && s.type === 'study');
    const stats = {};
    sessions.forEach(s => {
      if (!s.subject) return;
      if (!stats[s.subject]) stats[s.subject] = { subject: s.subject, totalMinutes: 0, sessions: 0 };
      stats[s.subject].totalMinutes += s.actualMinutes;
      stats[s.subject].sessions += 1;
    });
    return Object.values(stats).sort((a, b) => b.totalMinutes - a.totalMinutes);
  },
};

// ── NOTES APIs ───────────────────────────────────────────────
export const NoteDB = {
  getAll: (userId) => {
    const all = read(DB_KEYS.NOTES) || [];
    return all.filter(n => n.userId === userId);
  },

  add: (userId, text) => {
    const all = read(DB_KEYS.NOTES) || [];
    const note = {
      id: uid(),
      userId,
      text,
      date: today(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      pinned: false,
    };
    all.push(note);
    write(DB_KEYS.NOTES, all);
    return note;
  },

  delete: (id) => {
    const all = read(DB_KEYS.NOTES) || [];
    write(DB_KEYS.NOTES, all.filter(n => n.id !== id));
  },

  togglePin: (id) => {
    const all = read(DB_KEYS.NOTES) || [];
    const idx = all.findIndex(n => n.id === id);
    if (idx !== -1) { all[idx].pinned = !all[idx].pinned; write(DB_KEYS.NOTES, all); }
  },
};

// ── LOGIN TRACKING ───────────────────────────────────────────
export const LoginDB = {
  getAll: (userId) => {
    const all = read(DB_KEYS.LOGINS) || [];
    return all;
  },

  recordToday: () => {
    const all = read(DB_KEYS.LOGINS) || [];
    const t = today();
    if (!all.includes(t)) {
      all.push(t);
      write(DB_KEYS.LOGINS, all);
    }
  },
};

// ── SETTINGS APIs ────────────────────────────────────────────
export const SettingsDB = {
  get: (userId) => read(DB_KEYS.SETTINGS) || {},
  save: (userId, settings) => write(DB_KEYS.SETTINGS, { ...settings, userId }),
};

// ── EXPORT DATA (as JSON "file") ─────────────────────────────
export function exportAllData() {
  const data = {};
  Object.entries(DB_KEYS).forEach(([k, v]) => {
    data[k] = read(v);
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'studyclock_backup.json'; a.click();
  URL.revokeObjectURL(url);
}

// Initialize database on first load
seedDatabase();

export { today, prevDay, uid };
export default { UserDB, ScheduleDB, SessionDB, NoteDB, LoginDB, SettingsDB };
