// ============================================
// EXAM PROCTORING — Anti-cheat & Violation
// Tab blur, fullscreen exit, idle, right-click
// ============================================

const ExamProctor = {
  _violations: [],
  _maxViolations: 3,
  _isActive: false,
  _idleTimer: null,
  _idleTimeout: 120000, // 2 minutes idle = warning
  _lastActivity: 0,
  _handlers: {},

  // ── Start proctoring ──
  start() {
    if (this._isActive) return;
    this._isActive = true;
    this._violations = [];
    this._lastActivity = Date.now();

    // 1. Tab visibility / blur detection
    this._handlers.visibilityChange = () => {
      if (document.hidden && this._isActive) {
        this._recordViolation('tab_switch', 'You switched to another tab/window');
      }
    };
    document.addEventListener('visibilitychange', this._handlers.visibilityChange);

    this._handlers.blur = () => {
      if (this._isActive) {
        this._recordViolation('window_blur', 'Browser window lost focus');
      }
    };
    window.addEventListener('blur', this._handlers.blur);

    // 2. Fullscreen exit detection (only if fullscreen was requested)
    this._handlers.fullscreenChange = () => {
      if (!document.fullscreenElement && this._isActive && this._wasFullscreen) {
        this._recordViolation('fullscreen_exit', 'You exited fullscreen mode');
      }
      this._wasFullscreen = !!document.fullscreenElement;
    };
    document.addEventListener('fullscreenchange', this._handlers.fullscreenChange);

    // 3. Right-click block
    this._handlers.contextMenu = (e) => {
      if (this._isActive) {
        e.preventDefault();
        this._showWarningToast('Right-click is disabled during the exam');
      }
    };
    document.addEventListener('contextmenu', this._handlers.contextMenu);

    // 4. Copy/paste block
    this._handlers.copy = (e) => {
      if (this._isActive) {
        e.preventDefault();
        this._showWarningToast('Copy is disabled during the exam');
      }
    };
    this._handlers.paste = (e) => {
      if (this._isActive) {
        e.preventDefault();
      }
    };
    document.addEventListener('copy', this._handlers.copy);
    document.addEventListener('paste', this._handlers.paste);

    // 5. DevTools detection (basic)
    this._handlers.keydown = (e) => {
      if (this._isActive) {
        this._lastActivity = Date.now();
        // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u')) {
          e.preventDefault();
          this._recordViolation('devtools', 'Attempted to open developer tools');
        }
      }
    };
    document.addEventListener('keydown', this._handlers.keydown, true);

    // 6. Idle detection
    this._handlers.activity = () => { this._lastActivity = Date.now(); };
    document.addEventListener('mousemove', this._handlers.activity);
    document.addEventListener('keypress', this._handlers.activity);

    this._idleTimer = setInterval(() => {
      if (this._isActive && Date.now() - this._lastActivity > this._idleTimeout) {
        this._showWarningToast('⚠️ You seem idle. The exam is timed.');
        this._lastActivity = Date.now();
      }
    }, 30000);

    // 7. Print block
    this._handlers.beforePrint = (e) => {
      if (this._isActive) {
        this._recordViolation('print_attempt', 'Attempted to print the exam');
      }
    };
    window.addEventListener('beforeprint', this._handlers.beforePrint);

    console.log('[PROCTOR] Exam proctoring started');
  },

  // ── Stop proctoring ──
  stop() {
    this._isActive = false;
    document.removeEventListener('visibilitychange', this._handlers.visibilityChange);
    window.removeEventListener('blur', this._handlers.blur);
    document.removeEventListener('fullscreenchange', this._handlers.fullscreenChange);
    document.removeEventListener('contextmenu', this._handlers.contextMenu);
    document.removeEventListener('copy', this._handlers.copy);
    document.removeEventListener('paste', this._handlers.paste);
    document.removeEventListener('keydown', this._handlers.keydown, true);
    document.removeEventListener('mousemove', this._handlers.activity);
    document.removeEventListener('keypress', this._handlers.activity);
    window.removeEventListener('beforeprint', this._handlers.beforePrint);
    if (this._idleTimer) {
      clearInterval(this._idleTimer);
      this._idleTimer = null;
    }
    this._handlers = {};
    console.log('[PROCTOR] Exam proctoring stopped');
  },

  // ── Record violation ──
  _recordViolation(type, message) {
    // Debounce: don't record same type within 3 seconds
    const lastSameType = this._violations.filter(v => v.type === type).pop();
    if (lastSameType && Date.now() - lastSameType.timestamp < 3000) return;

    const violation = {
      type,
      message,
      timestamp: Date.now(),
      questionIndex: TestEngine.state ? TestEngine.state.currentIndex : null
    };
    this._violations.push(violation);

    const count = this._violations.length;
    const remaining = this._maxViolations - count;

    // Show violation popup
    this._showViolationPopup(message, count, remaining);

    // Auto-submit on max violations
    if (count >= this._maxViolations) {
      setTimeout(() => {
        this._showWarningToast('⛔ Maximum violations reached. Test auto-submitted.');
        if (typeof TestPage !== 'undefined') {
          TestPage.submitTest();
        }
      }, 2000);
    }

    // Store in localStorage for result page
    try {
      localStorage.setItem('exam_violations', JSON.stringify(this._violations));
    } catch {}
  },

  // ── Violation popup overlay ──
  _showViolationPopup(message, count, remaining) {
    // Remove existing
    const existing = document.getElementById('proctor-violation-popup');
    if (existing) existing.remove();

    const isLast = remaining <= 0;
    const html = `
      <div id="proctor-violation-popup" class="proctor-violation-overlay" onclick="if(event.target===this)ExamProctor.dismissViolation()">
        <div class="proctor-violation-modal ${isLast ? 'danger' : ''}">
          <div class="proctor-violation-icon">${isLast ? '⛔' : '⚠️'}</div>
          <div class="proctor-violation-title">${isLast ? 'EXAM TERMINATED' : 'Violation Detected'}</div>
          <div class="proctor-violation-msg">${message}</div>
          <div class="proctor-violation-count">
            Violation ${count}/${this._maxViolations}
            ${remaining > 0 ? `<br><span style="font-size:12px;color:#E53E3E;">${remaining} more will auto-submit your test</span>` : ''}
          </div>
          ${isLast
            ? '<div style="font-size:13px;color:#E53E3E;font-weight:700;margin-top:8px;">Your test is being submitted...</div>'
            : `<button class="proctor-violation-dismiss" onclick="ExamProctor.dismissViolation()">I Understand</button>`
          }
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  dismissViolation() {
    const popup = document.getElementById('proctor-violation-popup');
    if (popup) popup.remove();
  },

  _showWarningToast(msg) {
    if (typeof Helpers !== 'undefined' && Helpers.showToast) {
      Helpers.showToast(msg, 'warning');
    }
  },

  // ── Get violations for result page ──
  getViolations() {
    return this._violations;
  },

  getViolationCount() {
    return this._violations.length;
  }
};
