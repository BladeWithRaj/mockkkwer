// ============================================
// SOLUTION REVIEW SCREEN v2.0 — Scholar Design
// Single question review, read-only options, AI explanation accordions, jump-to dropdown
// ============================================

const AnalysisPage = {
  _currentQuestionIdx: 0,
  _explanationExpanded: true,

  render() {
    const result = App.lastResult;
    if (!result) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16); text-align: center;">
          <div class="empty-state">
            <div class="empty-state-icon" style="font-size: 40px;">📊</div>
            <div class="empty-state-title" style="font-weight: 600; color: var(--text-primary); margin-top: 12px;">No Analysis Available</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Complete a test to view solution reviews.</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Start a Test</button>
          </div>
        </div>
      `;
    }

    const questionResults = result.questionResults || [];
    if (questionResults.length === 0) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16); text-align: center;">
          <div class="empty-state">
            <div class="empty-state-icon" style="font-size: 40px;">📭</div>
            <div class="empty-state-title" style="font-weight: 600; color: var(--text-primary); margin-top: 12px;">No Solutions Found</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Questions details are not available for this session.</p>
            <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
          </div>
        </div>
      `;
    }

    // Wrap around boundaries
    if (this._currentQuestionIdx < 0) this._currentQuestionIdx = 0;
    if (this._currentQuestionIdx >= questionResults.length) this._currentQuestionIdx = questionResults.length - 1;

    const qr = questionResults[this._currentQuestionIdx];
    const q = qr.question;
    const labels = ['A', 'B', 'C', 'D'];

    // Badges based on correctness
    let statusBadge = '';
    if (qr.isSkipped) {
      statusBadge = `<span class="badge" style="background: var(--skipped-light); color: var(--skipped); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 600;">○ Skipped</span>`;
    } else if (qr.isCorrect) {
      statusBadge = `<span class="badge" style="background: var(--success-light); color: var(--success); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 600;">✓ Correct</span>`;
    } else {
      statusBadge = `<span class="badge" style="background: var(--danger-light); color: var(--danger); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 600;">✗ Incorrect</span>`;
    }

    return `
      <div class="analysis-page page-enter" style="min-height: 100vh; background: var(--bg-primary); display: flex; flex-direction: column;">
        
        <!-- Sticky Top Bar -->
        <div style="position: sticky; top: 0; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); height: 56px; z-index: var(--z-sticky); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--sp-4);">
          <button class="btn btn-ghost" onclick="App.navigate('result')" style="font-size: var(--text-sm); font-weight: 500;">
            ← Results
          </button>
          
          <!-- Jump to dropdown -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: var(--text-xs); color: var(--text-muted); font-weight: 500;">Jump to:</span>
            <select class="form-select" onchange="AnalysisPage.jumpTo(this.value)" style="height: 32px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: var(--text-xs); font-weight: 600; padding: 0 8px; outline: none; cursor: pointer;">
              ${questionResults.map((item, idx) => `
                <option value="${idx}" ${this._currentQuestionIdx === idx ? 'selected' : ''}>
                  Q${idx + 1} (${item.isCorrect ? '✓' : item.isSkipped ? '○' : '✗'})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">
            ${q.subject}
          </div>
        </div>

        <!-- Main Question Review Section -->
        <div style="flex: 1; max-width: 640px; width: 100%; margin: 0 auto; padding: 24px var(--sp-4) 80px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); font-family: var(--font-display);">Question ${this._currentQuestionIdx + 1}</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              ${statusBadge}
              ${Storage.isQuestionInMistakeBook?.(q.id)
                ? `<span class="ap-bookmark-indicator">&#9733; Saved</span>`
                : ''}
              <button class="bookmark-btn ${Storage.isQuestionInMistakeBook?.(q.id) ? 'bookmarked' : ''}"
                      onclick="AnalysisPage.toggleBookmark('${q.id}', this)"
                      style="background: transparent; border: none; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${Storage.isQuestionInMistakeBook?.(q.id) ? '#f87171' : 'var(--text-muted)'}; transition: color 120ms;"
                      title="Save to Mistake Book">
                &#9733;
              </button>
            </div>
          </div>

          <!-- Meta strip: time taken + difficulty + topic (Doc 7 §22) -->
          ${(() => {
            const qResult = questionResults[this._currentQuestionIdx];
            const totalQ  = questionResults.length || 1;
            const result  = App.lastResult;
            const avgTime = result?.timeSpent ? Math.round(result.timeSpent / totalQ) : 0;
            const timeTaken = qResult?.timeTaken || avgTime;
            const diff = q.difficulty || '';
            const diffClass = diff === 'easy' ? 'ap-diff--easy' : diff === 'hard' ? 'ap-diff--hard' : diff ? 'ap-diff--medium' : '';
            const diffLabel = diff ? diff.charAt(0).toUpperCase() + diff.slice(1) : '';
            return `
              <div class="ap-meta-strip">
                ${timeTaken ? `<span class="ap-meta-item">&#8987; ~${timeTaken}s spent</span>` : ''}
                ${diffLabel ? `<span class="ap-meta-item"><span class="ap-diff-badge ${diffClass}">${diffLabel}</span></span>` : ''}
                ${q.subject ? `<span class="ap-meta-item">&#9654; ${q.subject}</span>` : ''}
                ${q.topic   ? `<span class="ap-meta-item">&#9670; ${q.topic}</span>` : ''}
              </div>
            `;
          })()}

          <!-- Question Content -->
          <div class="question-text" style="font-size: 16px; line-height: 1.6; color: var(--text-primary); margin-bottom: 20px; font-family: var(--font-body);">
            ${q.question}
          </div>

          <!-- Read-only Options List -->
          <div class="options-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
            ${q.options.map((opt, i) => {
              const isCorrectOpt = q.correct === i;
              const isUserOpt = qr.selectedAnswer === i && !qr.isSkipped;
              
              let optStyle = 'background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary);';
              let badge = '';

              if (isCorrectOpt) {
                optStyle = 'background: var(--success-light); border: 1px solid var(--success); color: var(--text-primary);';
                badge = '<span style="color: var(--success); font-weight: 700;">✓ Correct</span>';
              } else if (isUserOpt) {
                optStyle = 'background: var(--danger-light); border: 1px solid var(--danger); color: var(--text-primary);';
                badge = '<span style="color: var(--danger); font-weight: 700;">✗ Your Choice</span>';
              }

              return `
                <div style="width: 100%; padding: 14px 16px; border-radius: var(--radius); font-size: var(--text-base); display: flex; align-items: center; justify-content: space-between; border-left: 3px solid ${isCorrectOpt ? 'var(--success)' : isUserOpt ? 'var(--danger)' : 'transparent'}; ${optStyle}">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 700; color: ${isCorrectOpt ? 'var(--success)' : isUserOpt ? 'var(--danger)' : 'var(--text-muted)'}; font-family: var(--font-display);">(${labels[i]})</span>
                    <span style="font-family: var(--font-body);">${opt}</span>
                  </div>
                  ${badge}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Accordion Toggle for Explanation -->
          <div style="border-top: 1px solid var(--border-color); padding-top: 16px;">
            <button onclick="AnalysisPage.toggleExplanation()" style="width: 100%; background: none; border: none; padding: 0; display: flex; align-items: center; justify-content: space-between; font-weight: 600; color: var(--brand-primary); font-size: var(--text-sm); cursor: pointer; outline: none; font-family: var(--font-display);">
              <span>${this._explanationExpanded ? '▼ Hide Explanation' : '▶ Show Explanation'}</span>
              <span class="badge" style="background: var(--warning-light); color: var(--warning); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600;">AI Explanation</span>
            </button>

            <!-- Explanation Content -->
            <div id="explanation-container" style="display: ${this._explanationExpanded ? 'block' : 'none'}; margin-top: 12px; font-size: var(--text-sm); line-height: 1.6; color: var(--text-secondary); padding-left: 8px;">
              <p style="margin: 0 0 10px;">${q.explanation || 'No detailed explanation is available for this question.'}</p>
              ${q.topic ? `<p style="margin: 6px 0; font-size: var(--text-xs); color: var(--text-muted);">Topic: <strong>${q.topic}</strong></p>` : ''}
            </div>

            <!-- Practice Similar button (Doc 7 §22) -->
            ${q.subject ? `
              <button class="ap-practice-btn" onclick="App.navigate('setup',{subject:'${q.subject}',mode:'section'})">
                &#9670; Practice Similar ${q.subject} Questions
              </button>
            ` : ''}
          </div>

        </div>

        <!-- Sticky Bottom Nav Bar -->
        <div style="position: sticky; bottom: 0; background: var(--bg-surface); border-top: 1px solid var(--border-color); height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 var(--sp-4); z-index: var(--z-sticky);">
          <button class="btn btn-secondary" onclick="AnalysisPage.prev()" ${this._currentQuestionIdx === 0 ? 'disabled' : ''}>
            ← Prev Question
          </button>
          
          <button class="btn btn-primary" onclick="AnalysisPage.next()" ${this._currentQuestionIdx === questionResults.length - 1 ? 'disabled' : ''}>
            Next Question →
          </button>
        </div>

      </div>
    `;
  },

  jumpTo(idx) {
    this._currentQuestionIdx = parseInt(idx, 10);
    App.renderPage('analysis');
  },

  prev() {
    if (this._currentQuestionIdx > 0) {
      this._currentQuestionIdx--;
      App.renderPage('analysis');
    }
  },

  next() {
    const result = App.lastResult;
    const total = result?.questionResults?.length || 0;
    if (this._currentQuestionIdx < total - 1) {
      this._currentQuestionIdx++;
      App.renderPage('analysis');
    }
  },

  toggleExplanation() {
    this._explanationExpanded = !this._explanationExpanded;
    const container = document.getElementById('explanation-container');
    if (container) {
      container.style.display = this._explanationExpanded ? 'block' : 'none';
    }
    // Re-render
    App.renderPage('analysis');
  },

  toggleBookmark(qId, btn) {
    const result = App.lastResult;
    if (!result) return;
    const qr = result.questionResults.find(r => r.question && r.question.id === qId);
    if (!qr || !qr.question) return;

    const inBook = Storage.isQuestionInMistakeBook(qId);
    if (inBook) {
      Storage.removeSingleMistake(qId);
      Helpers.showToast('Removed from Mistake Book', 'info');
      btn.style.color = 'var(--text-muted)';
      btn.classList.remove('bookmarked');
    } else {
      Storage.addSingleMistake(qr.question);
      Helpers.showToast('Saved to Mistake Book!', 'success');
      btn.style.color = '#f87171';
      btn.classList.add('bookmarked');
    }
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "analysis_scholar" });
  }
};

window.AnalysisPage = AnalysisPage;
