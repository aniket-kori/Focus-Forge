// ============================================================
//  audio.js  —  Alert system
//  Tries to play mp3 from /audio/; falls back to Web Speech.
//  Replace mp3 files in /public/audio/ with your recordings.
// ============================================================

const AUDIO_MAP = {
  sessionStart:  { file: '/audio/session_start.mp3',  text: 'Session starting now. Focus up!' },
  sessionEnd:    { file: '/audio/session_end.mp3',    text: 'Session complete. Excellent work!' },
  breakStart:    { file: '/audio/break_start.mp3',    text: 'Time for a break. Relax.' },
  breakEnd:      { file: '/audio/break_end.mp3',      text: 'Break is over. Back to studying!' },
  warning5min:   { file: '/audio/warning_5min.mp3',   text: '5 minutes remaining in this session.' },
  warning2min:   { file: '/audio/warning_2min.mp3',   text: '2 minutes remaining.' },
  nextSession:   { file: '/audio/next_session.mp3',   text: null }, // dynamic text passed in
  skipSession:   { file: '/audio/skip_session.mp3',   text: 'Skipping to the next session.' },
};

let soundEnabled = true;

export function setSoundEnabled(val) {
  soundEnabled = val;
}

function speak(text) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  u.pitch = 1.05;
  u.volume = 0.95;
  // Prefer a female voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

export function playAlert(key, dynamicText = null) {
  if (!soundEnabled) return;
  const entry = AUDIO_MAP[key];
  if (!entry) { if (dynamicText) speak(dynamicText); return; }
  const text = dynamicText || entry.text;
  const audio = new Audio(entry.file);
  audio.volume = 0.85;
  audio.play().catch(() => {
    // mp3 not found or blocked — fall back to speech
    speak(text);
  });
}

export function playNextSessionAlert(nextName) {
  if (!soundEnabled) return;
  speak(`Next up: ${nextName} in 2 minutes. Get ready.`);
}

export function playCustomText(text) {
  if (!soundEnabled) return;
  speak(text);
}

// Notification API
export function sendNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body });
    });
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
