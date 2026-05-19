// ============================================
// CBT ENGINE — Realistic Exam Behavior Layer
// Simulates real government CBT system quirks:
// - Fake autosave latency ("Saving answer...")
// - Connection status indicator
// - Inactivity detection + popup
// - Fullscreen enforcement warning
// - Last-5-min warning beeps
// - Option click micro-delay (100-150ms)
// - Section switch flicker
// - Anti-refresh protection
// ============================================

const CBTEngine = {
  _active: false,
  _inactivityTimer: null,
  _inactivityTimeout: 120000, // 2 min inactivity
  _lastActivity: Date.now(),
  _fullscreenWarned: false,
  _beepPlayed: {},
  _savingTimeout: null,

  // ══════════════════════════════════════
  //  LIFECYCLE
  // ══════════════════════════════════════

  /** Call when exam begins (after instructions) */
  start() {
    this._active = true;
    this._lastActivity = Date.now();
    this._beepPlayed = {};
    this._fullscreenWarned = false;

    // Inject status bar
    this._injectStatusBar();

    // Start inactivity monitor
    this._startInactivityMonitor();

    // Anti-refresh protection (beforeunload)
    this._beforeUnloadHandler = (e) => {
      if (!this._active) return;
      e.preventDefault();
      e.returnValue = 'Your examination is in progress. Are you sure you want to leave? Your answers may be lost.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', this._onFullscreenChange);

    // Visibility change (tab switch detection)
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    // Mouse/keyboard activity tracker
    document.addEventListener('mousemove', this._onActivity, { passive: true });
    document.addEventListener('keydown', this._onActivity, { passive: true });
    document.addEventListener('click', this._onActivity, { passive: true });
  },

  /** Call when exam ends */
  stop() {
    this._active = false;
    if (this._inactivityTimer) clearInterval(this._inactivityTimer);
    this._removeStatusBar();
    // Remove anti-refresh
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
    document.removeEventListener('fullscreenchange', this._onFullscreenChange);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    document.removeEventListener('mousemove', this._onActivity);
    document.removeEventListener('keydown', this._onActivity);
    document.removeEventListener('click', this._onActivity);
  },

  /** Is CBT engine currently active? */
  isActive() {
    return this._active;
  },

  // ══════════════════════════════════════
  //  STATUS BAR (connection + autosave)
  // ══════════════════════════════════════

  _injectStatusBar() {
    if (document.getElementById('cbt-status-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'cbt-status-bar';
    bar.className = 'cbt-status-bar';
    bar.innerHTML = `
      <span class="cbt-conn-status" id="cbt-conn-dot">
        <span class="cbt-conn-dot online"></span>
        <span class="cbt-conn-text">Connected to Server</span>
      </span>
      <span class="cbt-autosave-status" id="cbt-autosave">
        <span class="cbt-save-text">All responses saved</span>
      </span>
    `;
    // Insert after header
    const header = document.querySelector(
      '.ssc-header, .rrb-header, .ibps-header, .upsc-header'
    );
    if (header && header.parentNode) {
      header.parentNode.insertBefore(bar, header.nextSibling);
    }
  },

  _removeStatusBar() {
    const bar = document.getElementById('cbt-status-bar');
    if (bar) bar.remove();
  },

  // ══════════════════════════════════════
  //  AUTOSAVE SIMULATION
  // ══════════════════════════════════════

  /** Show "Saving answer..." then "Response recorded" with fake delay */
  showSaving() {
    if (!this._active) return;
    const el = document.getElementById('cbt-autosave');
    if (!el) return;

    // Phase 1: Saving...
    el.innerHTML = `<span class="cbt-save-spinner"></span><span class="cbt-save-text saving">Saving answer...</span>`;

    // Phase 2: Saved (after 300-600ms random delay)
    const delay = 300 + Math.random() * 300;
    clearTimeout(this._savingTimeout);
    this._savingTimeout = setTimeout(() => {
      if (!el) return;
      el.innerHTML = `<span class="cbt-save-text saved">✓ Response recorded</span>`;
      // Phase 3: Reset (after 2s)
      setTimeout(() => {
        if (!el) return;
        el.innerHTML = `<span class="cbt-save-text">All responses saved</span>`;
      }, 2000);
    }, delay);
  },

  /** Briefly show "Please wait..." during section switch */
  showSectionLoading(sectionName) {
    if (!this._active) return;
    const el = document.getElementById('cbt-autosave');
    if (!el) return;
    el.innerHTML = `<span class="cbt-save-spinner"></span><span class="cbt-save-text saving">Loading ${sectionName}...</span>`;
    setTimeout(() => {
      if (!el) return;
      el.innerHTML = `<span class="cbt-save-text">All responses saved</span>`;
    }, 500 + Math.random() * 400);
  },

  // ══════════════════════════════════════
  //  OPTION CLICK MICRO-DELAY
  //  Real CBT systems have ~100-150ms lag
  // ══════════════════════════════════════

  /** Wrap option selection with realistic delay */
  delayedSelect(callback) {
    if (!this._active) { callback(); return; }
    // Add a subtle 80-150ms delay
    const delay = 80 + Math.random() * 70;
    setTimeout(callback, delay);
  },

  // ══════════════════════════════════════
  //  INACTIVITY DETECTION
  // ══════════════════════════════════════

  _onActivity: (() => {
    // Throttled activity handler
    let _lastUpdate = 0;
    return () => {
      const now = Date.now();
      if (now - _lastUpdate < 1000) return;
      _lastUpdate = now;
      CBTEngine._lastActivity = now;
      // Remove inactivity popup if showing
      const popup = document.getElementById('cbt-inactivity-popup');
      if (popup) popup.remove();
    };
  })(),

  _startInactivityMonitor() {
    if (this._inactivityTimer) clearInterval(this._inactivityTimer);
    this._inactivityTimer = setInterval(() => {
      if (!this._active) return;
      const idle = Date.now() - this._lastActivity;
      if (idle >= this._inactivityTimeout && !document.getElementById('cbt-inactivity-popup')) {
        this._showInactivityPopup();
      }
    }, 10000);
  },

  _showInactivityPopup() {
    const html = `
      <div class="cbt-system-popup" id="cbt-inactivity-popup">
        <div class="cbt-system-popup-box">
          <div class="cbt-system-popup-icon">⚠️</div>
          <div class="cbt-system-popup-title">Inactivity Detected</div>
          <div class="cbt-system-popup-text">
            No activity detected for 2 minutes.<br>
            Your session is still active. Click below to continue.
          </div>
          <button class="cbt-system-popup-btn" onclick="document.getElementById('cbt-inactivity-popup').remove(); CBTEngine._lastActivity = Date.now();">
            Continue Examination
          </button>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ══════════════════════════════════════
  //  FULLSCREEN ENFORCEMENT
  // ══════════════════════════════════════

  _onFullscreenChange: () => {
    if (!CBTEngine._active) return;
    if (!document.fullscreenElement && !CBTEngine._fullscreenWarned) {
      CBTEngine._fullscreenWarned = true;
      CBTEngine._showFullscreenWarning();
      // Reset after 30s
      setTimeout(() => { CBTEngine._fullscreenWarned = false; }, 30000);
    }
  },

  _showFullscreenWarning() {
    if (document.getElementById('cbt-fullscreen-popup')) return;
    const html = `
      <div class="cbt-system-popup" id="cbt-fullscreen-popup">
        <div class="cbt-system-popup-box">
          <div class="cbt-system-popup-icon">🖥️</div>
          <div class="cbt-system-popup-title">Fullscreen Mode Required</div>
          <div class="cbt-system-popup-text">
            This examination must be taken in fullscreen mode.<br>
            Exiting fullscreen may be recorded as a violation.
          </div>
          <button class="cbt-system-popup-btn" onclick="document.getElementById('cbt-fullscreen-popup').remove(); document.documentElement.requestFullscreen().catch(()=>{});">
            Return to Fullscreen
          </button>
          <button class="cbt-system-popup-btn-secondary" onclick="document.getElementById('cbt-fullscreen-popup').remove();">
            Continue without Fullscreen
          </button>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ══════════════════════════════════════
  //  VISIBILITY CHANGE (tab switch)
  // ══════════════════════════════════════

  _onVisibilityChange: () => {
    if (!CBTEngine._active) return;
    if (document.hidden) {
      // Tab switched — this would be caught by ExamProctor too
      const el = document.getElementById('cbt-conn-dot');
      if (el) {
        el.innerHTML = `<span class="cbt-conn-dot offline"></span><span class="cbt-conn-text" style="color:#C62828;">Window unfocused</span>`;
      }
    } else {
      const el = document.getElementById('cbt-conn-dot');
      if (el) {
        el.innerHTML = `<span class="cbt-conn-dot reconnecting"></span><span class="cbt-conn-text" style="color:#E65100;">Reconnecting...</span>`;
        setTimeout(() => {
          if (!el) return;
          el.innerHTML = `<span class="cbt-conn-dot online"></span><span class="cbt-conn-text">Connected to Server</span>`;
        }, 800 + Math.random() * 700);
      }
    }
  },

  // ══════════════════════════════════════
  //  TIMER WARNING BEEPS (last 5 min)
  // ══════════════════════════════════════

  /** Called every timer tick — checks for warning thresholds */
  checkTimerWarnings(secondsLeft, totalTime) {
    if (!this._active) return;
    // Warning at 5 min, 2 min, 1 min, 30s
    const thresholds = [300, 120, 60, 30];
    for (const t of thresholds) {
      if (secondsLeft === t && !this._beepPlayed[t]) {
        this._beepPlayed[t] = true;
        this._playWarningBeep(t);
        this._showTimerFlash(t);
      }
    }
  },

  _playWarningBeep(secondsLeft) {
    // Use Web Audio API for a short beep
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = secondsLeft <= 60 ? 800 : 600;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* audio not available */ }
  },

  _showTimerFlash(secondsLeft) {
    const msgs = {
      300: '⚠ 5 minutes remaining',
      120: '⚠ 2 minutes remaining',
      60: '⚠ 1 minute remaining!',
      30: '⚠ 30 seconds remaining!'
    };
    const msg = msgs[secondsLeft] || '';
    if (!msg) return;

    // Flash the autosave bar
    const el = document.getElementById('cbt-autosave');
    if (el) {
      const old = el.innerHTML;
      el.innerHTML = `<span class="cbt-save-text warning-flash">${msg}</span>`;
      setTimeout(() => {
        if (el) el.innerHTML = old;
      }, 3000);
    }
  }
};
window.CBTEngine = CBTEngine;
