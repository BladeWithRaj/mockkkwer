// ============================================
// TEST PAGE — CBT Exam Simulation UI
// Board theming, section tabs, fullscreen,
// enhanced timer, keyboard A/B/C/D
// ============================================

const TestPage = {
  _visitedQuestions: new Set(),
  timerInterval: null,
  _isProcessing: false,
  _lastWarningShown: false,
  _activeSection: null, // null = all sections
  _isFullscreen: false,

  // Board color mapping
  _boardMap: {
    'SSC': { key: 'ssc', color: '#3B82F6', label: 'SSC' },
    'Railway': { key: 'railway', color: '#10B981', label: 'Railway' },
    'Banking': { key: 'banking', color: '#8B5CF6', label: 'Banking' },
    'UPSC': { key: 'upsc', color: '#D946EF', label: 'UPSC' },
    'Defence': { key: 'defence', color: '#EF4444', label: 'Defence' },
    'Teaching': { key: 'teaching', color: '#06B6D4', label: 'Teaching' },
    'State': { key: 'state', color: '#F59E0B', label: 'State' }
  },

  _getBoard() {
    if (!TestEngine.state?.config?.examId) return null;
    const preset = ExamPresets.get(TestEngine.state.config.examId);
    if (!preset) return null;
    return this._boardMap[preset.category] || null;
  },

  _getSections() {
    if (!TestEngine.state?.config?.examId) return [];
    const preset = ExamPresets.get(TestEngine.state.config.examId);
    if (!preset?.sections) return [];
    return preset.sections;
  },

  _getExamName() {
    if (!TestEngine.state?.config?.examId) return '';
    const preset = ExamPresets.get(TestEngine.state.config.examId);
    return preset ? preset.name : '';
  },

  render() {
    if (!TestEngine.state) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16); text-align: center;">
          <div class="empty-state">
            <div class="empty-state-icon" style="font-size: 40px;">📄</div>
            <div class="empty-state-title" style="font-weight: 600; color: var(--text-primary); margin-top: 12px;">No Active Test</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Go to setup to start a new mock test.</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Go to Setup</button>
          </div>
        </div>
      `;
    }

    const current = TestEngine.getCurrentQuestion();
    const navStatus = TestEngine.getNavStatus();
    const answeredCount = Object.keys(TestEngine.state.answers).length;
    const sections = this._getSections();

    // Determine current section name
    const currentQuestionObj = TestEngine.state.questions[current.index];
    const currentSubject = currentQuestionObj?.subject || '';
    const sectionName = currentSubject.toUpperCase();

    // Palette stats
    const totalCount = current.total;
    const markedCount = Object.keys(TestEngine.state.markedForReview).filter(k => TestEngine.state.markedForReview[k]).length;

    return `
      <div class="test-page page-enter" style="min-height: 100vh; background: var(--bg-primary); display: flex; flex-direction: column;">
        <!-- Top Sticky Bar -->
        <div style="position: sticky; top: 0; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); height: 56px; z-index: var(--z-sticky); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--sp-4);">
          <button class="btn btn-ghost" onclick="TestPage.confirmExit()" style="font-size: var(--text-sm); font-weight: 500; display: flex; align-items: center; gap: 4px;">
            ← Exit
          </button>
          <div style="font-size: var(--text-sm); font-weight: 600; color: var(--text-primary);">
            ${sectionName} · Q ${current.index + 1}/${current.total}
          </div>
          <div id="timer-display" style="font-family: var(--font-mono); font-size: var(--text-base); font-weight: 700; color: var(--text-primary); transition: color 120ms ease; display: flex; align-items: center; gap: 6px;">
            ⏱ <span id="timer-text">${Helpers.formatTime(TestEngine.state.timeRemaining)}</span>
          </div>
        </div>

        <!-- Section Tabs (if multi-section) -->
        ${sections.length > 1 ? `
        <div style="display: flex; gap: 8px; padding: 8px var(--sp-4); background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); overflow-x: auto; scrollbar-width: none;">
          ${sections.map(s => `
            <button class="btn ${currentSubject === s.subject ? 'btn-primary' : 'btn-secondary'}" onclick="TestPage.filterSection('${s.subject}')" style="padding: 4px 12px; font-size: var(--text-xs); border-radius: var(--radius-full); white-space: nowrap;">
              ${s.name}
            </button>
          `).join('')}
        </div>
        ` : ''}

        <!-- Main Workspace -->
        <div style="flex: 1; display: grid; grid-template-columns: 1fr 280px; max-width: var(--container-xl); width: 100%; margin: 0 auto;">
          
          <!-- Left: Question Area -->
          <div style="padding: 24px; border-right: 1px solid var(--border-color); overflow-y: auto;">
            <div id="question-area">
              ${this._renderQuestion(current)}
            </div>
          </div>

          <!-- Right: Side Question Palette (hidden on small screens) -->
          <div class="desktop-only" style="padding: 24px; background: var(--bg-secondary); overflow-y: auto;">
            <div style="font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 12px;">Questions Navigation</div>
            
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 24px;" id="nav-grid">
              ${navStatus.map((ns, i) => {
                const isVisited = this._visitedQuestions.has(i) || ns.current;
                const isAnswered = ns.answered;
                const isMarked = ns.review;
                
                let btnStyle = 'background: var(--bg-sunken); border: 1px solid var(--border-color); color: var(--text-secondary);';
                if (isAnswered && isMarked) {
                  btnStyle = 'background: var(--danger); border: 1px solid var(--danger); color: white;';
                } else if (isMarked) {
                  btnStyle = 'background: var(--warning); border: 1px solid var(--warning); color: white;';
                } else if (isAnswered) {
                  btnStyle = 'background: var(--success); border: 1px solid var(--success); color: white;';
                } else if (isVisited) {
                  btnStyle = 'background: var(--bg-primary); border: 1px solid var(--border-strong); color: var(--text-primary);';
                }
                
                if (ns.current) {
                  btnStyle += ' outline: 2px solid var(--brand-primary); outline-offset: 2px;';
                }

                return `
                  <button onclick="TestPage.goTo(${i})" style="width: 100%; aspect-ratio: 1; border-radius: var(--radius-sm); font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; ${btnStyle}">
                    ${i + 1}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Palette Summary Stats -->
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 16px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Questions</span>
                <strong style="color: var(--text-primary);">${totalCount}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Answered</span>
                <strong style="color: var(--success);">${answeredCount}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Marked for Review</span>
                <strong style="color: var(--warning);">${markedCount}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- Sticky Bottom Bar -->
        <div style="position: sticky; bottom: 0; background: var(--bg-surface); border-top: 1px solid var(--border-color); height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 var(--sp-4); z-index: var(--z-sticky);">
          <button class="btn btn-secondary" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''} style="font-weight: 500;">
            ← Prev
          </button>
          
          <button class="btn btn-secondary ${current.isMarkedForReview ? 'active' : ''}" onclick="TestPage.toggleReview()" style="font-weight: 500; color: ${current.isMarkedForReview ? 'var(--warning)' : 'var(--text-secondary)'};">
            ⭐ Mark for Review
          </button>
          
          <button class="btn btn-primary" onclick="TestPage.next()" style="font-weight: 600; font-family: var(--font-display);">
            ${current.index === current.total - 1 ? 'Submit' : 'Save & Next →'}
          </button>
        </div>

        <!-- Mobile Drawer Navigation Toggle (only visible on mobile) -->
        <div class="mobile-only" style="position: fixed; bottom: 70px; right: 16px; z-index: 100;">
          <button onclick="TestPage.toggleMobileNav()" style="width: 48px; height: 48px; border-radius: 50%; background: var(--brand-primary); color: white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); border: none; font-size: 20px;">
            📑
          </button>
        </div>

        <!-- Mobile Nav Sheet -->
        <div class="mobile-nav-sheet" id="mobile-nav-sheet" style="display: none; position: fixed; inset: 0; z-index: var(--z-modal);">
          <div style="position: absolute; inset: 0; background: var(--bg-overlay);" onclick="TestPage.toggleMobileNav()"></div>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg-surface); border-radius: var(--radius-xl) var(--radius-xl) 0 0; padding: 20px; max-height: 70vh; overflow-y: auto;">
            <div style="font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); margin-bottom: 12px; text-align: center;">Jump to Question</div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;" id="nav-grid-mobile">
              ${navStatus.map((ns, i) => {
                const isVisited = this._visitedQuestions.has(i) || ns.current;
                const isAnswered = ns.answered;
                const isMarked = ns.review;
                
                let btnStyle = 'background: var(--bg-sunken); border: 1px solid var(--border-color); color: var(--text-secondary);';
                if (isAnswered && isMarked) {
                  btnStyle = 'background: var(--danger); border: 1px solid var(--danger); color: white;';
                } else if (isMarked) {
                  btnStyle = 'background: var(--warning); border: 1px solid var(--warning); color: white;';
                } else if (isAnswered) {
                  btnStyle = 'background: var(--success); border: 1px solid var(--success); color: white;';
                } else if (isVisited) {
                  btnStyle = 'background: var(--bg-primary); border: 1px solid var(--border-strong); color: var(--text-primary);';
                }
                
                if (ns.current) {
                  btnStyle += ' outline: 2px solid var(--brand-primary); outline-offset: 2px;';
                }

                return `
                  <button onclick="TestPage.goTo(${i}); TestPage.toggleMobileNav();" style="width: 100%; aspect-ratio: 1; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; ${btnStyle}">
                    ${i + 1}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

      </div>
    `;
  },

  _renderQuestion(current) {
    const q = current.question;
    const labels = ['A', 'B', 'C', 'D'];

    // Track this question as visited
    this._visitedQuestions.add(current.index);

    // Bookmark state
    const bookmarks = Storage.getBookmarks?.() || {};
    const isBookmarked = !!bookmarks[q.id];

    return `
      <div class="tq-wrapper">
        <div class="tq-header">
          <div class="tq-num">Q ${current.index + 1} &nbsp;/&nbsp; ${current.total}</div>
          <div class="tq-actions">
            <button class="tq-action-btn tq-lang-btn" onclick="TestPage.toggleQuestionLanguage()">
              &#127760; EN/HI
            </button>
            <button class="tq-action-btn ${isBookmarked ? 'tq-bookmark-btn--active' : ''}" onclick="TestPage.toggleBookmark('${q.id}')" id="bookmark-btn-${q.id}" title="Bookmark">
              ${isBookmarked ? '&#9733;' : '&#9734;'} ${isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button class="tq-action-btn" onclick="TestPage._showReportModal(${current.index})" title="Report">
              &#9873; Report
            </button>
          </div>
        </div>

        <div class="tq-question">${q.question}</div>

        <div class="opt-list">
          ${q.options.map((opt, i) => {
            const isSelected = current.selectedAnswer === i;
            return `
              <button class="opt-btn ${isSelected ? 'opt-btn--selected' : ''}" onclick="TestPage.selectOption(${i})">
                <span class="opt-label">${labels[i]}</span>
                <span class="opt-text">${opt}</span>
                <span class="opt-check">${isSelected ? '&#10003;' : ''}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  afterRender() {
    this.startTimer();

    // Apply board color as CSS variable
    const board = this._getBoard();
    if (board) {
      document.documentElement.style.setProperty('--exam-color', board.color);
    }

    // Keyboard shortcuts (1-4, A-D, arrows, R, B=bookmark, F11)
    this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch(e.key) {
        case '1': case 'a': case 'A': this.selectOption(0); break;
        case '2': case 'b': case 'B': this.selectOption(1); break;
        case '3': case 'c': case 'C': this.selectOption(2); break;
        case '4': case 'd': case 'D': this.selectOption(3); break;
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowRight': this.next(); break;
        case 'r': case 'R': this.toggleReview(); break;
        case 'F11': e.preventDefault(); this.toggleFullscreen(); break;
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // Swipe support for mobile
    this._setupSwipe();
  },

  destroy() {
    this.stopTimer();
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
    // Stop CBT Engine
    if (typeof CBTEngine !== 'undefined') CBTEngine.stop();
    // Reset board color
    document.documentElement.style.removeProperty('--exam-color');
    // Exit fullscreen
    if (this._isFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this._isFullscreen = false;
    this._activeSection = null;
    this._visitedQuestions.clear();
    // Reset renderer state
    if (typeof RendererBase !== 'undefined') RendererBase.resetState();
    else if (typeof CBTRenderer !== 'undefined') CBTRenderer.resetState();
  },

  // ── Swipe support ──
  _setupSwipe() {
    const area = document.getElementById('question-area');
    if (!area) return;
    let startX = 0;
    area.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    area.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) this.prev();
        else this.next();
      }
    }, { passive: true });
  },

  // ── Timer with %-based thresholds ──
  startTimer() {
    this.stopTimer();
    if (!TestEngine.state || TestEngine.state.totalTime >= 99999) return;

    this.timerInterval = setInterval(() => {
      const result = TestEngine.tick();

      if (result === 'timeout') {
        this.stopTimer();
        // Show timeout popup then auto-submit
        this._showTimeoutPopup();
        return;
      }

      const timerEl = document.getElementById('timer-text');
      const timerDisplay = document.getElementById('timer-display');
      if (timerEl) {
        timerEl.textContent = Helpers.formatTime(result);
      }

      // Board-specific timer update
      const _timerRenderer = typeof RendererRouter !== 'undefined' ? RendererRouter.getActiveRenderer() : null;
      if (_timerRenderer && _timerRenderer.updateTimer) {
        _timerRenderer.updateTimer(result, TestEngine.state.totalTime);
      } else if (typeof CBTRenderer !== 'undefined' && CBTRenderer.shouldUseCBT()) {
        CBTRenderer.updateTimer(result, TestEngine.state.totalTime);
      }

      // CBT Engine: check for warning beeps at thresholds
      if (typeof CBTEngine !== 'undefined' && CBTEngine.isActive()) {
        CBTEngine.checkTimerWarnings(result, TestEngine.state.totalTime);
      }

      if (timerDisplay) {
        const totalTime = TestEngine.state.totalTime;
        const percentLeft = result / totalTime;

        timerDisplay.classList.remove('warning', 'danger', 'timer-shake');

        if (percentLeft <= 0.10) {
          timerDisplay.classList.add('danger', 'timer-shake');
        } else if (percentLeft <= 0.20) {
          timerDisplay.classList.add('warning');
        }
      }

      // Show warning popup at 60 seconds remaining (once)
      if (result === 60 && !this._lastWarningShown) {
        this._lastWarningShown = true;
        this._showTimerWarning();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  selectOption(index) {
    // Debounce: prevent rapid double-clicks
    if (this._isProcessing) return;
    this._isProcessing = true;

    TestEngine.selectAnswer(index);
    this.refreshQuestion();
    this.refreshNav();
    this._updateProgress();

    // CBT Engine: show "Saving answer..." feedback
    if (typeof CBTEngine !== 'undefined' && CBTEngine.isActive()) {
      CBTEngine.showSaving();
    }

    // Gamification: track combo for correct answers (approximate)
    this._trackAnswerForGamification(index);

    // ── Confidence Tracker (Doc 8 §9) — practice mode only ──
    const config = TestEngine.state?.config;
    const isPracticeMode = config && (config.timeMode === 'none' || config.isAdaptive === true);
    if (isPracticeMode && typeof LearningProfile !== 'undefined') {
      this._showConfidenceStrip(index);
    }

    // Release lock after animation frame
    requestAnimationFrame(() => {
      this._isProcessing = false;
    });
  },

  // Confidence strip — non-blocking bottom strip (Doc 8 §9)
  _showConfidenceStrip(selectedIndex) {
    // Remove any existing strip
    const existing = document.getElementById('confidence-strip');
    if (existing) existing.remove();

    const current = TestEngine.getCurrentQuestion?.();
    if (!current) return;
    const q = current.question;

    const strip = document.createElement('div');
    strip.id = 'confidence-strip';
    strip.style.cssText = [
      'position:fixed', 'bottom:70px', 'left:50%', 'transform:translateX(-50%)',
      'background:var(--bg-card)', 'border:1.5px solid var(--border-color)',
      'border-radius:40px', 'padding:8px 6px',
      'display:flex', 'align-items:center', 'gap:6px',
      'z-index:9000', 'box-shadow:0 4px 24px rgba(0,0,0,0.15)',
      'animation:te-fadeUp 0.2s ease both',
      'font-family:var(--font-display)'
    ].join(';');

    const label = document.createElement('span');
    label.style.cssText = 'font-size:11px;color:var(--text-muted);font-weight:600;padding:0 6px;white-space:nowrap';
    label.textContent = 'How confident?';
    strip.appendChild(label);

    const opts = [
      { key: 'guess',     label: 'Guess',     color: '#EF4444' },
      { key: 'unsure',    label: 'Unsure',     color: '#F59E0B' },
      { key: 'confident', label: 'Confident',  color: '#10B981' }
    ];

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.style.cssText = [
        `border:1.5px solid ${opt.color}20`, 'border-radius:20px',
        'padding:5px 12px', 'font-size:12px', 'font-weight:700',
        `color:${opt.color}`, 'background:transparent',
        'cursor:pointer', `font-family:var(--font-display)`,
        'transition:background 120ms,border-color 120ms'
      ].join(';');
      btn.textContent = opt.label;
      btn.onmouseover = () => btn.style.background = `${opt.color}15`;
      btn.onmouseout  = () => btn.style.background = 'transparent';
      btn.onclick = () => {
        // Record confidence
        try {
          const current = TestEngine.getCurrentQuestion?.();
          if (current && typeof LearningProfile !== 'undefined') {
            LearningProfile.recordConfidence(
              current.question?.id,
              opt.key,
              null,    // wasCorrect not known yet (will be determined at submit)
              current.question?.subject
            );
          }
        } catch(e) {}
        strip.remove();
      };
      strip.appendChild(btn);
    });

    // Auto-dismiss after 6 seconds
    setTimeout(() => { if (strip.parentNode) strip.remove(); }, 6000);

    document.body.appendChild(strip);
  },



  clearAnswer() {
    TestEngine.clearAnswer();
    this.refreshQuestion();
    this.refreshNav();
    this._updateProgress();
  },

  toggleReview() {
    TestEngine.toggleReview();
    this.refreshQuestion();
    this.refreshNav();
  },

  next() {
    const current = TestEngine.getCurrentQuestion();
    if (current.index === current.total - 1) {
      this.confirmSubmit();
    } else {
      TestEngine.nextQuestion();
      this.refreshQuestion('left');
      this.refreshNav();
      this._updateProgress();
    }
  },

  prev() {
    const current = TestEngine.getCurrentQuestion();
    if (current.index === 0) return;
    TestEngine.prevQuestion();
    this.refreshQuestion('right');
    this.refreshNav();
    this._updateProgress();
  },

  goTo(index) {
    TestEngine.goToQuestion(index);
    this.refreshQuestion();
    this.refreshNav();
    this._updateProgress();
  },

  // ── Section filter ──
  filterSection(subject) {
    this._activeSection = subject;
    // Update tab UI
    document.querySelectorAll('.exam-section-tab').forEach(tab => tab.classList.remove('active'));
    event?.target?.classList.add('active');
    // Jump to first question of that section
    if (subject && TestEngine.state) {
      const idx = TestEngine.state.questions.findIndex(q => q.subject === subject);
      if (idx >= 0) this.goTo(idx);
    }
    this.refreshNav();
  },

  // ── Fullscreen toggle ──
  toggleFullscreen() {
    if (!document.fullscreenEnabled) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this._isFullscreen = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        this._isFullscreen = false;
      }).catch(() => {});
    }
  },

  refreshQuestion(direction) {
    // Board-specific renderer delegation
    const _qRenderer = typeof RendererRouter !== 'undefined' ? RendererRouter.getActiveRenderer() : null;
    if (_qRenderer && _qRenderer.refreshQuestion && !(_qRenderer.isShowingInstructions && _qRenderer.isShowingInstructions())) {
      _qRenderer.refreshQuestion();
      return;
    }
    if (typeof CBTRenderer !== 'undefined' && CBTRenderer.shouldUseCBT() && !CBTRenderer.isShowingInstructions()) {
      CBTRenderer.refreshQuestion();
      return;
    }
    const area = document.getElementById('question-area');
    if (area) {
      const current = TestEngine.getCurrentQuestion();
      area.innerHTML = this._renderQuestion(current);
    }
  },

  // ── INSTANT language swap — pure DOM text patch, zero innerHTML ──
  refreshLanguage() {
    if (!TestEngine.state) return;
    const idx = TestEngine.state.currentQuestion;
    const q = TestEngine.state.questions[idx];
    if (!q) return;

    const selected = TestEngine.state.answers[q.id];

    // 1. Question text — direct textContent swap
    const qText = document.querySelector('.question-text');
    if (qText) qText.textContent = q.question;

    // 2. Option text + preserve selection state
    const optBtns = document.querySelectorAll('.option-btn');
    optBtns.forEach((btn, i) => {
      const textEl = btn.querySelector('.option-text');
      if (textEl && q.options[i] != null) textEl.textContent = q.options[i];
      btn.classList.toggle('selected', i === selected);
    });

    // 3. Action button labels
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.textContent = Lang.t('test_clear');
    const reviewBtn = document.getElementById('review-btn');
    if (reviewBtn) {
      const isReview = TestEngine.state.markedForReview[idx];
      reviewBtn.textContent = isReview ? Lang.t('test_marked') : Lang.t('test_mark_review');
    }
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) prevBtn.textContent = Lang.t('test_prev');
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.textContent = idx === TestEngine.state.questions.length - 1 ? Lang.t('submit') + ' →' : Lang.t('test_next');
    const submitBtn = document.getElementById('submit-test-btn');
    if (submitBtn) submitBtn.textContent = Lang.t('test_submit_btn');

    // 4. Nav panel title
    document.querySelectorAll('.nav-panel-title').forEach(el => {
      el.textContent = Lang.t('test_questions_nav');
    });
  },

  refreshNav() {
    // Board-specific renderer delegation
    const _navRenderer = typeof RendererRouter !== 'undefined' ? RendererRouter.getActiveRenderer() : null;
    if (_navRenderer && _navRenderer.refreshNav && !(_navRenderer.isShowingInstructions && _navRenderer.isShowingInstructions())) {
      _navRenderer.refreshNav();
      return;
    }
    if (typeof CBTRenderer !== 'undefined' && CBTRenderer.shouldUseCBT() && !CBTRenderer.isShowingInstructions()) {
      CBTRenderer.refreshNav();
      return;
    }
    // Desktop nav
    const grid = document.getElementById('nav-grid');
    if (grid) {
      const navStatus = TestEngine.getNavStatus();
      grid.innerHTML = navStatus.map((ns, i) => `
        <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                onclick="TestPage.goTo(${i})" id="nav-btn-${i}">${i + 1}</button>
      `).join('');
    }
    // Mobile nav
    const mGrid = document.getElementById('nav-grid-mobile');
    if (mGrid) {
      const navStatus = TestEngine.getNavStatus();
      mGrid.innerHTML = navStatus.map((ns, i) => `
        <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                onclick="TestPage.goTo(${i});TestPage.toggleMobileNav()">${i + 1}</button>
      `).join('');
    }
  },

  _updateProgress() {
    const bar = document.getElementById('test-progress-bar');
    if (bar && TestEngine.state) {
      const current = TestEngine.getCurrentQuestion();
      const pct = ((current.index + 1) / current.total) * 100;
      bar.style.width = pct + '%';
      bar.classList.remove('active', 'intense');
      if (pct >= 80) bar.classList.add('intense');
      else if (pct >= 50) bar.classList.add('active');
    }
  },

  // ── GAMIFICATION: Combo + Motivation ──
  // ONLY in Rival Battle mode. Mock tests stay clean/realistic.
  _trackAnswerForGamification(selectedIndex) {
    if (!window.Gamification || !TestEngine.state) return;

    // ── MODE CHECK: Only arcade effects in Rival Battle mode ──
    const _gamRenderer = typeof RendererRouter !== 'undefined' ? RendererRouter.getActiveRenderer() : null;
    const allowsCombo = _gamRenderer && typeof _gamRenderer.allowsCombo === 'function' && _gamRenderer.allowsCombo();
    const isRivalBattle = allowsCombo || TestEngine.state.config?.mode === 'rival-battle' || window._currentTestMode === 'rival-battle';

    // Only show combos/motivation in rival battle
    if (!isRivalBattle) return;
    if (!window.Gamification) return;

    const q = TestEngine.state.questions[TestEngine.state.currentQuestion];
    if (!q) return;

    if (selectedIndex === q.correct) {
      const combo = Gamification.registerCorrect();
      if (combo >= 3) this._showComboIndicator(combo);
    } else {
      Gamification.registerWrong();
    }

    // Check motivation milestones
    const answered = Object.keys(TestEngine.state.answers).length;
    const total = TestEngine.state.questions.length;
    const correctSoFar = this._countCorrectSoFar();
    const comboData = Gamification.getCombo();

    const motivation = Gamification.getMotivation({
      questionsAnswered: answered,
      totalQuestions: total,
      correctSoFar,
      combo: comboData.current
    });

    if (motivation && !this._lastMotivation) {
      this._showMotivationToast(motivation);
      this._lastMotivation = true;
      setTimeout(() => { this._lastMotivation = false; }, 8000);
    }
  },

  _countCorrectSoFar() {
    if (!TestEngine.state) return 0;
    let correct = 0;
    TestEngine.state.questions.forEach(q => {
      const ans = TestEngine.state.answers[q.id];
      if (ans !== undefined && ans === q.correct) correct++;
    });
    return correct;
  },

  _showComboIndicator(combo) {
    // Remove old
    const old = document.querySelector('.combo-indicator');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'combo-indicator' + (combo >= 10 ? ' epic' : '');
    el.innerHTML = `${Icons.get('flame', 16)} ${combo}x Combo!`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 2000);
  },

  _showMotivationToast(motivation) {
    const old = document.querySelector('.motivation-toast');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'motivation-toast';
    el.innerHTML = `${motivation.icon ? Icons.get(motivation.icon, 14) : ''} ${motivation.msg}`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3000);
  },

  toggleQuestionLanguage() {
    // Toggle languageMode between 'english' and 'hindi'
    if (TestEngine.state) {
      const idx = TestEngine.state.currentQuestion;
      const q = TestEngine.state.questions[idx];
      if (q) {
        const nextMode = q.languageMode === 'hindi' ? 'english' : 'hindi';
        TestEngine.state.questions.forEach(item => item.languageMode = nextMode);
        this.refreshQuestion();
        Helpers.showToast(`Swapped to ${nextMode === 'english' ? 'English' : 'Hindi'}!`, 'info');
      }
    }
  },

  toggleMobileNav() {
    const sheet = document.getElementById('mobile-nav-sheet');
    if (sheet) {
      const isVisible = sheet.style.display === 'block';
      sheet.style.display = isVisible ? 'none' : 'block';
    }
  },

  _lastMotivation: false,

  confirmExit() {
    if (confirm('Are you sure you want to exit the test? Your current progress will be lost.')) {
      this.stopTimer();
      if (typeof CBTEngine !== 'undefined') CBTEngine.stop();
      App.navigate('home');
    }
  },

  // ── Bookmark (Doc 7 §13) ──
  toggleBookmark(qId) {
    const bookmarks = Storage.getBookmarks?.() || {};
    if (bookmarks[qId]) {
      delete bookmarks[qId];
      Helpers.showToast?.('Bookmark removed', 'info');
    } else {
      bookmarks[qId] = Date.now();
      Helpers.showToast?.('Bookmarked ✓', 'success');
    }
    Storage.setBookmarks?.(bookmarks);
    // Update button state without full re-render
    const btn = document.getElementById(`bookmark-btn-${qId}`);
    if (btn) {
      const isNowBookmarked = !!bookmarks[qId];
      btn.className = `tq-action-btn ${isNowBookmarked ? 'tq-bookmark-btn--active' : ''}`;
      btn.innerHTML = `${isNowBookmarked ? '&#9733;' : '&#9734;'} ${isNowBookmarked ? 'Saved' : 'Save'}`;
    }
  },

  // ── Report Issue (Doc 7 §14) ──
  _reportSelected: null,
  _showReportModal(qIndex) {
    this._reportSelected = null;
    const reasons = [
      'Wrong Answer Key',
      'Typo or Spelling Error',
      'Duplicate Question',
      'Formatting Issue',
      'Other'
    ];
    const html = `
      <div class="te-report-backdrop" id="report-modal" onclick="if(event.target.id==='report-modal')TestPage._closeReportModal()">
        <div class="te-report-sheet">
          <div class="te-report-title">Report an issue with Q.${qIndex + 1}</div>
          <div class="te-report-reasons" id="report-reasons">
            ${reasons.map((r, i) => `
              <button class="te-report-reason" onclick="TestPage._selectReportReason(this, '${r}')">
                ${r}
              </button>
            `).join('')}
          </div>
          <div class="te-report-actions">
            <button class="te-report-cancel" onclick="TestPage._closeReportModal()">Cancel</button>
            <button class="te-report-submit" onclick="TestPage._submitReport(${qIndex})">
              Send Report
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  _selectReportReason(el, reason) {
    this._reportSelected = reason;
    document.querySelectorAll('.te-report-reason').forEach(btn => btn.classList.remove('selected'));
    el.classList.add('selected');
  },
  _closeReportModal() {
    const m = document.getElementById('report-modal');
    if (m) m.remove();
    this._reportSelected = null;
  },
  _submitReport(qIndex) {
    if (!this._reportSelected) {
      Helpers.showToast?.('Please select a reason', 'warning');
      return;
    }
    // Store locally (future: send to backend)
    const reports = JSON.parse(localStorage.getItem('question_reports') || '[]');
    const q = TestEngine.state?.questions?.[qIndex];
    reports.push({ qId: q?.id || qIndex, reason: this._reportSelected, ts: Date.now() });
    localStorage.setItem('question_reports', JSON.stringify(reports));
    this._closeReportModal();
    Helpers.showToast?.('Report submitted. Thank you!', 'success');
  },

  confirmSubmit() {
    const summary = TestEngine.getSummary();
    if (!summary) return;

    const unansweredWarning = summary.unanswered > 0
      ? `<p style="font-size: var(--text-sm); color: var(--warning); margin-top: var(--space-3);">
           ${Icons.get('alertTriangle', 14)} You have <strong>${summary.unanswered}</strong> unanswered question${summary.unanswered > 1 ? 's' : ''}.
         </p>`
      : '';

    const modalHTML = `
      <div class="modal-backdrop" id="submit-modal" onclick="if(event.target===this)document.getElementById('submit-modal').remove()">
        <div class="modal">
          <div class="modal-title">${Lang.t('test_submit_title')}</div>
          <div class="modal-text">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); margin: var(--space-4) 0;">
              <div style="padding: var(--space-3); background: var(--success-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--success);">${summary.answered}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">Answered</div>
              </div>
              <div style="padding: var(--space-3); background: var(--danger-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--danger);">${summary.unanswered}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">Unanswered</div>
              </div>
              <div style="padding: var(--space-3); background: var(--warning-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--warning);">${summary.reviewed}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">Marked for Review</div>
              </div>
            </div>
            ${unansweredWarning}
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('submit-modal').remove()">${Lang.t('cancel')}</button>
            <button class="btn btn-primary" onclick="TestPage.submitTest()">Submit &amp; View Results &rarr;</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  submitTest() {
    const modal = document.getElementById('submit-modal');
    if (modal) modal.remove();
    const cbtModal = document.getElementById('cbt-submit-modal');
    if (cbtModal) cbtModal.remove();
    const timeoutModal = document.getElementById('timeout-modal');
    if (timeoutModal) timeoutModal.remove();
    const warningModal = document.getElementById('timer-warning-modal');
    if (warningModal) warningModal.remove();

    this.stopTimer();
    this._lastWarningShown = false;
    // Stop proctoring
    if (typeof ExamProctor !== 'undefined') ExamProctor.stop();

    // Store config for retry
    if (TestEngine.state) {
      App.lastTestConfig = { ...TestEngine.state.config };
      App.lastTestQuestionIds = TestEngine.state.questions.map(q => q.id);
    }

    const result = TestEngine.submit();
    if (result) {
      App.lastResult = result;

      // ── Doc 8 AI Study System hooks ──
      try {
        // Learning Profile (§28A) — must be before Flashcards
        if (typeof LearningProfile !== 'undefined') {
          LearningProfile.updateAfterTest(result);
        }
        // Auto-flashcards from wrong answers (§12)
        if (typeof Flashcards !== 'undefined') {
          const newCards = Flashcards.generateFromResult(result);
          if (newCards > 0) {
            Helpers.showToast?.(`${newCards} flashcard${newCards > 1 ? 's' : ''} created from wrong answers`, 'info');
          }
        }
        // Daily progress + streak (already called in some paths, safe to call again)
        if (typeof DailySystem !== 'undefined' && DailySystem.recordProgress) {
          DailySystem.recordProgress(result);
        }
        // Progress engine
        if (typeof ProgressEngine !== 'undefined') {
          ProgressEngine.recordResult(result);
        }
        // Doc 18: Learning Intelligence — auto-classify mistakes + save snapshot
        if (typeof LearningIntelligence !== 'undefined') {
          LearningIntelligence.processResult(result);
        }
        // Doc 19: Cognitive Behaviour — save behaviour snapshot (must run after Doc 18)
        if (typeof BehaviourEngine !== 'undefined') {
          BehaviourEngine.processResult(result);
        }
        // Backfill correctness onto this test's confidence entries (recorded
        // mid-test with wasCorrect:null). Must run before MistakeDNA/any
        // confidence-matrix read so high-confidence-wrong is detectable.
        if (typeof Storage !== 'undefined' && Storage.backfillConfidenceCorrectness) {
          const correctnessById = {};
          (result.questionResults || []).forEach(qr => {
            if (qr && qr.question && qr.question.id != null && !qr.isSkipped) {
              correctnessById[qr.question.id] = !!qr.isCorrect;
            }
          });
          Storage.backfillConfidenceCorrectness(correctnessById);
        }
        // Doc 20: Mistake DNA — root-cause snapshot (must run after Doc 18/19 + backfill)
        if (typeof MistakeDNA !== 'undefined') {
          MistakeDNA.processResult(result);
        }
        // ── Doc 9 EventBus: emit mock_completed for MissionEngine ──
        if (typeof EventBus !== 'undefined') {
          EventBus.emit(EventBus.EVENTS.MOCK_COMPLETED, {
            accuracy: result.accuracy || 0,
            examName: result.examName || result.config?.name || 'Mock Test',
            subject: result.subject || result.config?.subject || ''
          });
        }
      } catch(e) {
        console.warn('AI Study System hook error (non-fatal):', e);
      }

      App.navigate('result');
    }
  },


  // ── Time-up popup ──
  _showTimeoutPopup() {
    const html = `
      <div class="modal-backdrop" id="timeout-modal">
        <div class="modal">
          <div class="modal-title" style="color: var(--danger);">${Lang.t('test_timeout_title')}</div>
          <div class="modal-text">
            <p>${Lang.t('test_timeout_desc')}</p>
          </div>
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn btn-primary" onclick="TestPage.submitTest()">${Lang.t('test_view_results')}</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ── 60-second warning popup ──
  _showTimerWarning() {
    const html = `
      <div class="modal-backdrop" id="timer-warning-modal" onclick="if(event.target===this)document.getElementById('timer-warning-modal').remove()">
        <div class="modal">
          <div class="modal-title" style="color: var(--warning);">${Lang.t('test_60s_title')}</div>
          <div class="modal-text">
            <p>${Lang.t('test_60s_desc')}</p>
            <div style="margin-top: var(--space-4); padding: var(--space-3); background: var(--warning-bg); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--warning);">
              ${Lang.t('test_60s_warn')}
            </div>
          </div>
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn btn-secondary" onclick="document.getElementById('timer-warning-modal').remove()">${Lang.t('test_continue')}</button>
            <button class="btn btn-primary" onclick="TestPage.confirmSubmit()">${Lang.t('test_submit_now')}</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const modal = document.getElementById('timer-warning-modal');
      if (modal) modal.remove();
    }, 5000);
  }
};
