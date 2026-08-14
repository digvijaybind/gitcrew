document.addEventListener('DOMContentLoaded', () => {
  // === Configuration ===
  const SESSIONS = {
    focus:  { label: 'Focus',     duration: 25 * 60, color: 'focus' },
    short:  { label: 'Short Break', duration: 5 * 60,  color: 'short' },
    long:   { label: 'Long Break', duration: 15 * 60,  color: 'long' }
  };

  const LOG_KEY = 'pomodoro_log';

  // === DOM Elements ===
  const timerValue = document.getElementById('timerValue');
  const timerDisplay = document.getElementById('timerDisplay');
  const statusText = document.getElementById('statusText');
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnReset = document.getElementById('btnReset');
  const sessionBtns = document.querySelectorAll('.session-btn');
  const logContainer = document.getElementById('logContainer');
  const logEmpty = document.getElementById('logEmpty');
  const btnClearLog = document.getElementById('btnClearLog');

  // === State ===
  let currentType = 'focus';
  let totalSeconds = SESSIONS.focus.duration;
  let remainingSeconds = totalSeconds;
  let timerInterval = null;
  let isRunning = false;
  let sessionStart = null;

  // === Audio Context for notification ===
  function playNotification() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (time, freq, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
      };
      const now = ctx.currentTime;
      // Pleasant three-note chime
      playTone(now, 784, 0.2);    // B5
      playTone(now + 0.25, 988, 0.2); // D6
      playTone(now + 0.5, 1175, 0.4); // F6
    } catch (_) {
      // Audio not available, silently fail
    }
  }

  // === Format helpers ===
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatDuration(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  }

  function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // === Session switching ===
  function setSession(type) {
    if (isRunning) {
      if (!confirm(`Switching sessions will reset the current timer. Continue?`)) return;
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
    }

    currentType = type;
    totalSeconds = SESSIONS[type].duration;
    remainingSeconds = totalSeconds;
    sessionStart = null;

    // Update toggle buttons
    sessionBtns.forEach(btn => {
      const isActive = btn.dataset.type === type;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive);
    });

    // Update timer color
    timerValue.setAttribute('data-session', type);
    timerValue.textContent = formatTime(remainingSeconds);
    timerValue.classList.remove('complete', 'running');

    // Update status
    statusText.textContent = `${SESSIONS[type].label} — ${SESSIONS[type].duration / 60} minutes`;

    // Reset button visibility
    btnStart.style.display = '';
    btnStart.textContent = 'Start';
    btnPause.style.display = 'none';

    saveState();
  }

  sessionBtns.forEach(btn => {
    btn.addEventListener('click', () => setSession(btn.dataset.type));
  });

  // === Timer controls ===
  function startTimer() {
    if (isRunning) return;
    if (remainingSeconds <= 0) return;

    isRunning = true;
    sessionStart = sessionStart || Date.now();

    // UI update
    btnStart.style.display = 'none';
    btnPause.style.display = '';
    timerValue.classList.add('running');
    timerValue.classList.remove('complete');
    statusText.textContent = `${SESSIONS[currentType].label} in progress…`;

    timerInterval = setInterval(() => {
      remainingSeconds--;
      timerValue.textContent = formatTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        completeSession();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    btnStart.style.display = '';
    btnStart.textContent = 'Resume';
    btnPause.style.display = 'none';
    timerValue.classList.remove('running');
    statusText.textContent = 'Paused';
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    remainingSeconds = totalSeconds;
    sessionStart = null;

    timerValue.textContent = formatTime(remainingSeconds);
    timerValue.classList.remove('running', 'complete');
    btnStart.style.display = '';
    btnStart.textContent = 'Start';
    btnPause.style.display = 'none';
    statusText.textContent = `${SESSIONS[currentType].label} — ${SESSIONS[currentType].duration / 60} minutes`;
  }

  function completeSession() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    sessionStart = sessionStart || Date.now();

    timerValue.classList.remove('running');
    timerValue.classList.add('complete');
    statusText.textContent = 'Session complete!';

    // Play notification
    playNotification();

    // Log the session
    const entry = {
      type: currentType,
      sessionLabel: SESSIONS[currentType].label,
      start: sessionStart,
      end: Date.now(),
      duration: totalSeconds
    };
    addLogEntry(entry);

    // Reset for next session
    remainingSeconds = 0;
    timerValue.textContent = formatTime(0);

    setTimeout(() => {
      timerValue.classList.remove('complete');
      btnStart.style.display = '';
      btnStart.textContent = 'Start New';
      btnPause.style.display = 'none';
    }, 2000);

    sessionStart = null;
  }

  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnReset.addEventListener('click', resetTimer);

  // === Daily Log (localStorage) ===
  function getTodayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function loadLog() {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      if (!raw) return [];
      const all = JSON.parse(raw);
      return all.filter(e => e.dateKey === getTodayKey());
    } catch (_) {
      return [];
    }
  }

  function saveLog(entries) {
    const today = getTodayKey();
    try {
      const raw = localStorage.getItem(LOG_KEY);
      const all = raw ? JSON.parse(raw) : [];
      // Remove old today entries
      const other = all.filter(e => e.dateKey !== today);
      localStorage.setItem(LOG_KEY, JSON.stringify([...other, ...entries]));
    } catch (_) {
      // Storage full or unavailable
    }
  }

  function addLogEntry(entry) {
    entry.dateKey = getTodayKey();
    const entries = loadLog();
    entries.unshift(entry); // newest first
    saveLog(entries);
    renderLog();
  }

  function renderLog() {
    const entries = loadLog();

    // Clear current display
    logContainer.innerHTML = '';

    if (entries.length === 0) {
      logEmpty.style.display = '';
      logEmpty.textContent = 'No sessions yet. Start a focus block to begin.';
      btnClearLog.style.display = 'none';
      return;
    }

    logEmpty.style.display = 'none';
    btnClearLog.style.display = '';

    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry';

      div.innerHTML = `
        <span class="log-type" data-type="${entry.type}">${entry.sessionLabel}</span>
        <div class="log-details">
          <span>Started ${formatTimestamp(entry.start)}</span>
          <span>Ended ${formatTimestamp(entry.end)}</span>
        </div>
        <span class="log-duration">${formatDuration(entry.duration)}</span>
      `;

      logContainer.appendChild(div);
    });
  }

  // Clear log
  btnClearLog.addEventListener('click', () => {
    if (confirm('Clear today\'s session log?')) {
      try {
        const today = getTodayKey();
        const raw = localStorage.getItem(LOG_KEY);
        const all = raw ? JSON.parse(raw) : [];
        localStorage.setItem(LOG_KEY, JSON.stringify(all.filter(e => e.dateKey !== today)));
        renderLog();
      } catch (_) {}
    }
  });

  // === Persist timer state ===
  function saveState() {
    const state = {
      type: currentType,
      remaining: remainingSeconds,
      total: totalSeconds
    };
    sessionStorage.setItem('pomodoro_state', JSON.stringify(state));
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem('pomodoro_state');
      if (!raw) return;
      const state = JSON.parse(raw);
      if (SESSIONS[state.type]) {
        currentType = state.type;
        totalSeconds = state.total;
        remainingSeconds = state.remaining;
      }
    } catch (_) {}
  }

  // === Init ===
  restoreState();
  setSession(currentType);
  renderLog();
});
