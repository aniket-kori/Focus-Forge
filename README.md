# 🎯 StudyClock — Focus & Flow

A complete Pomodoro-style study tracker built with React. Features a login system, schedule management, IST clock, session tracking, dashboard with analytics, and custom voice alerts.

---

## 🚀 Quick Start

### Requirements
- Node.js 16 or higher
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Open http://localhost:3000 in your browser
```

---

## 🔐 Demo Login Credentials

| User | Username | Password |
|------|----------|----------|
| 🎓 Arjun Sharma | `student` | `study123` |
| 🛠️ Admin | `admin` | `admin123` |

---

## 🗂️ Project Structure

```
studyclock/
├── public/
│   ├── index.html
│   └── audio/              ← Drop your custom MP3 files here
│       ├── session_start.mp3
│       ├── session_end.mp3
│       ├── break_start.mp3
│       ├── break_end.mp3
│       ├── warning_5min.mp3
│       └── warning_2min.mp3
├── src/
│   ├── context/
│   │   └── AppContext.js    ← Auth & global state
│   ├── pages/
│   │   ├── LoginPage.js     ← Login screen
│   │   ├── AppShell.js      ← Sidebar layout
│   │   ├── TimerPage.js     ← Pomodoro timer + IST clock
│   │   ├── SchedulePage.js  ← Schedule manager
│   │   └── DashboardPage.js ← Analytics + Calendar + Notes
│   ├── components/
│   │   └── SharedComponents.js  ← Clock, Timer, Toasts, Cards
│   ├── utils/
│   │   ├── db.js            ← LocalStorage database layer
│   │   └── audio.js         ← Alert system
│   ├── tokens.css           ← Design system
│   ├── App.js
│   └── index.js
└── package.json
```

---

## 🔊 Custom Voice Alerts

Place your personal MP3 recordings in `/public/audio/`:

| File | Spoken when |
|------|-------------|
| `session_start.mp3` | A study session begins |
| `session_end.mp3`   | A study session completes |
| `break_start.mp3`   | A break begins |
| `break_end.mp3`     | A break ends |
| `warning_5min.mp3`  | 5 minutes left in a session |
| `warning_2min.mp3`  | 2 minutes left (next session named) |

> **Fallback**: If MP3 files are missing, the app uses your browser's built-in speech synthesis automatically.

---

## 📦 Features

### ⏱ Timer Tab
- Live IST analog + digital clock
- Circular Pomodoro countdown timer
- Color-coded study (teal) vs break (amber) sessions
- Adjustable duration (+5/−5/+10/−15 minutes) — schedule auto-shifts
- Session queue with progress tracking
- Auto-advance to next session after completion
- Sound toggle

### 📋 Schedule Tab
- Create unlimited named schedules
- Each schedule has time blocks with:
  - Name, type (study/break), start time, duration
  - Subject tag, focus notes
- Edit, reorder (↑↓), and delete blocks
- Set any schedule as "Active" for the timer
- Color themes per schedule
- Visual timeline bar preview

### 📊 Dashboard
- Today's session log (actual vs planned time)
- Weekly bar chart (last 7 days)
- Subject breakdown with progress bars
- Activity calendar with study intensity heatmap
- Login streak tracking
- Notes panel (pin, delete, timestamp)

### 🔐 Auth
- Multi-user login (stored locally)
- Session persistence across page refreshes
- Auto-login on return

---

## 🗄️ Database

Currently uses **localStorage** as a JSON database. Data is stored in these keys:

| Key | Contents |
|-----|----------|
| `sc_db_users` | User accounts |
| `sc_db_schedules` | All schedules + blocks |
| `sc_db_sessions` | Completed session logs |
| `sc_db_notes` | User notes |
| `sc_db_logins` | Login date history |
| `sc_db_active_schedule` | Which schedule is active |
| `sc_db_settings` | User preferences |

### Migrating to a Real Database

Replace the functions in `src/utils/db.js`:
- `read(key)` → API GET call
- `write(key, data)` → API POST/PUT call

All data interfaces remain the same — only the persistence layer changes.

---

## 🎨 Customization

Edit `src/tokens.css` to change:
- Color scheme (study/break/accent colors)
- Typography (fonts)
- Border radius, shadows

---

## 📄 Export Data

Open browser console and run:
```js
import { exportAllData } from './utils/db';
exportAllData(); // Downloads studyclock_backup.json
```

---

## 🛠️ Build for Production

```bash
npm run build
```

Outputs to `/build/` — serve with any static file server.

---

## 📝 License

MIT — free to use and modify.
