const DashboardPage = {
  _isRendering: false,

  async render() {
    // Show loading state first since we fetch from Supabase
    setTimeout(this._renderLoading.bind(this), 0);

    try {
      const stats = await Analytics.loadDashboardStats();
      this._renderContent(stats);
      
      // Initialize real-time listener
      if (window.subscribeToResults) {
        window.subscribeToResults(this._handleRealtimeUpdate.bind(this));
      }
    } catch (err) {
      console.error("Dashboard render error:", err);
      const appEl = document.getElementById('app');
      appEl.innerHTML = `
        <div class="test-container" style="justify-content: center; align-items: center; min-height: 100vh;">
          <div class="card" style="text-align: center;">
            <div style="font-size: var(--text-4xl); margin-bottom: var(--space-4);">⚠️</div>
            <h2 style="color: var(--danger); margin-bottom: var(--space-2);">Failed to load Dashboard</h2>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${err.message}</p>
            <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
          </div>
        </div>
      `;
    }
  },

  async _handleRealtimeUpdate() {
    if (this._isRendering) return;
    this._isRendering = true;
    try {
      console.log("♻️ Silent background refresh of dashboard...");
      // Force refresh bypassing Cache TTL
      const stats = await Analytics.loadDashboardStats(true);
      if (document.getElementById('dashboard-trend-chart')) { // Ensure we are still on the dashboard
         this._renderContent(stats);
      }
    } catch (err) {
      console.error("Realtime refresh failed:", err);
    } finally {
      this._isRendering = false;
    }
  },

  _renderLoading() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div class="test-container" style="min-height: 100vh; padding-top: var(--space-12);">
        <header class="app-header">
          <div class="logo" onclick="App.navigate('home')" style="cursor: pointer;">
            <div class="logo-icon"></div>
            <div class="logo-text">MockTestPro</div>
          </div>
        </header>
        <div class="content-wrapper" style="max-width: 1000px; margin: 0 auto; width: 100%; text-align: center; margin-top: var(--space-12);">
          <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
          <p style="color: var(--text-muted);">Loading your analytics...</p>
        </div>
      </div>
    `;
  },

  _renderContent(stats) {
    const appEl = document.getElementById('app');
    if (!stats) {
      // Empty state
      appEl.innerHTML = `
        <div class="test-container" style="min-height: 100vh; padding-top: var(--space-12);">
          <header class="app-header">
            <div class="logo" onclick="App.navigate('home')" style="cursor: pointer;">
              <div class="logo-icon"></div>
              <div class="logo-text">MockTestPro</div>
            </div>
          </header>
          <div class="content-wrapper" style="max-width: 1000px; margin: 0 auto; width: 100%; text-align: center; margin-top: var(--space-12);">
            <div class="card animate-fadeInUp">
              <div style="font-size: var(--text-4xl); margin-bottom: var(--space-4);">📊</div>
              <h2 style="margin-bottom: var(--space-2);">No Tests Taken Yet</h2>
              <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Take your first mock test to see your performance dashboard.</p>
              <button class="btn btn-primary" onclick="App.navigate('setup')">Start First Test</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Determine trends text
    const impRate = stats.improvementRate;
    const trendIcon = impRate > 0 ? '↗️' : (impRate < 0 ? '↘️' : '→');
    const trendColor = impRate > 0 ? 'var(--success)' : (impRate < 0 ? 'var(--danger)' : 'var(--warning)');
    const trendText = impRate > 0 ? `+${impRate}% in last 5 tests` : (impRate < 0 ? `${impRate}% in last 5 tests` : 'No recent change');

    const html = `
      <div class="test-container" style="min-height: 100vh; padding-top: var(--space-12);">
        
        <!-- HEADER -->
        <header class="app-header">
          <div class="logo" onclick="App.navigate('home')" style="cursor: pointer;">
            <div class="logo-icon"></div>
            <div class="logo-text">MockTestPro <span style="font-size: 12px; background: rgba(139, 92, 246, 0.2); color: #C4B5FD; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">SaaS</span></div>
          </div>
          <div class="desktop-only" style="gap: var(--space-4);">
            <button class="btn btn-outline" onclick="App.navigate('setup')">New Test</button>
          </div>
        </header>

        <div class="content-wrapper animate-fadeInUp" style="max-width: 1000px; margin: 0 auto; width: 100%;">
          
          <div style="margin-bottom: var(--space-8);">
            <h1 style="font-size: var(--text-2xl); font-weight: var(--font-bold);">📊 Your Performance Dashboard</h1>
            <p style="color: var(--text-muted); font-size: var(--text-sm);">Based on your Supabase saved history</p>
          </div>

          <!-- SECTION 1: Quick Stats -->
          <div class="insights-grid" style="margin-bottom: var(--space-8);">
            <div class="insight-item">
              <div class="insight-icon" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA;">📝</div>
              <div>
                <div class="insight-label">Tests Done</div>
                <div class="insight-value">${stats.totalTests}</div>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-icon" style="background: rgba(16, 185, 129, 0.15); color: #34D399;">🎯</div>
              <div>
                <div class="insight-label">Avg Score</div>
                <div class="insight-value">${stats.avgScore}%</div>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-icon" style="background: rgba(245, 158, 11, 0.15); color: #FBBF24;">🏆</div>
              <div>
                <div class="insight-label">Best Score</div>
                <div class="insight-value">${stats.bestScore}%</div>
              </div>
            </div>
            <div class="insight-item">
              <div class="insight-icon" style="background: rgba(239, 68, 68, 0.15); color: #F87171;">⚠️</div>
              <div>
                <div class="insight-label">Weak Area</div>
                <div class="insight-value">${stats.weakArea}</div>
              </div>
            </div>
          </div>

          <!-- LAYOUT GRID -->
          <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-6); margin-bottom: var(--space-8);">
            
            <!-- SECTION 2: Progress Graph -->
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                <h3 style="font-size: var(--text-lg);">Accuracy Trend (Last 10 Tests)</h3>
                <div style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: ${trendColor};">
                  ${trendIcon} ${trendText}
                </div>
              </div>
              <div style="height: 250px; position: relative;">
                <canvas id="dashboard-trend-chart" width="800" height="250" style="width: 100%; height: 100%; display: block;"></canvas>
              </div>
            </div>

          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-8);">
            
            <!-- SECTION 3: Topic-wise Accuracy -->
            <div class="card">
              <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">Topic-wise Accuracy</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                ${stats.topics.map(t => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--bg-glass); border-radius: var(--radius-md);">
                    <div>
                      <div style="font-weight: var(--font-semibold);">${t.topic}</div>
                      <div style="font-size: var(--text-xs); color: var(--text-muted);">${t.tests} tests</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: var(--font-bold); color: ${t.accuracy >= 70 ? 'var(--success)' : (t.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)')};">
                        ${t.accuracy}% ${t.accuracy >= 70 ? '🟢' : (t.accuracy >= 50 ? '🟡' : '🔴')}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- SECTION 4: Time Management & Recs -->
            <div style="display: flex; flex-direction: column; gap: var(--space-6);">
              
              <!-- Time Management -->
              <div class="card">
                <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">Time Management (Avg/Q)</h3>
                <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                  ${[...stats.topics].sort((a,b) => b.avgTimePerQ - a.avgTimePerQ).slice(0, 4).map(t => `
                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1); font-size: var(--text-sm);">
                        <span>${t.topic}</span>
                        <span style="color: ${t.avgTimePerQ > 60 ? 'var(--danger)' : 'var(--text-muted)'};">${t.avgTimePerQ}s ${t.avgTimePerQ > 60 ? '⚠️' : ''}</span>
                      </div>
                      <div style="height: 6px; background: var(--bg-glass); border-radius: var(--radius-full); overflow: hidden;">
                        <div style="height: 100%; width: ${Math.min(100, (t.avgTimePerQ / 90) * 100)}%; background: ${t.avgTimePerQ > 60 ? 'var(--danger)' : 'var(--primary)'}; border-radius: var(--radius-full);"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- SECTION 5: Recommendations -->
              <div class="card" style="background: linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9)); border: 1px solid rgba(99,102,241,0.2);">
                <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4); color: #C4B5FD;">🎯 Smart Recommendations</h3>
                <div style="display: flex; flex-direction: column; gap: var(--space-4);">
                  
                  ${stats.weakTopic ? `
                  <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                    <div style="font-size: 20px;">1️⃣</div>
                    <div>
                      <div style="font-weight: var(--font-semibold); margin-bottom: 2px;">Focus on ${stats.weakTopic.topic}</div>
                      <div style="font-size: var(--text-sm); color: var(--text-muted);">Lowest accuracy: ${stats.weakTopic.accuracy}%</div>
                    </div>
                  </div>
                  ` : ''}

                  ${stats.slowTopic && stats.slowTopic.avgTimePerQ > 50 ? `
                  <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                    <div style="font-size: 20px;">2️⃣</div>
                    <div>
                      <div style="font-weight: var(--font-semibold); margin-bottom: 2px;">Speed up in ${stats.slowTopic.topic}</div>
                      <div style="font-size: var(--text-sm); color: var(--text-muted);">Taking ${stats.slowTopic.avgTimePerQ}s per question. Try to reduce this.</div>
                    </div>
                  </div>
                  ` : ''}

                  <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                    <div style="font-size: 20px;">3️⃣</div>
                    <div>
                      <div style="font-weight: var(--font-semibold); margin-bottom: 2px;">Maintain Consistency</div>
                      <div style="font-size: var(--text-sm); color: var(--text-muted);">Take at least 1 test daily to build a streak.</div>
                    </div>
                  </div>

                </div>
                <div style="margin-top: var(--space-5);">
                  <button class="btn btn-primary" style="width: 100%;" onclick="App.navigate('setup')">Start Practice Session</button>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    `;

    appEl.innerHTML = html;

    // Draw Chart
    const canvas = document.getElementById('dashboard-trend-chart');
    if (canvas && stats.trendData && stats.trendData.length > 0) {
      // Fix for crisp canvas on high DPI
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      Analytics.drawLineChart(canvas, stats.trendData, { centerText: '' });
    }
  }
};
