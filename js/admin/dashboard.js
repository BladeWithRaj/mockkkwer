// ============================================
// ADMIN CONSOLE — Dashboard & Overview
// ============================================

window.AdminDashboard = {
  async render(el) {
    const d = await AdminCore.api('dashboard');
    const s = d.stats;
    const subs = Object.entries(s.subjectDistribution || {});
    
    el.innerHTML = `
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">Questions</div><div class="metric-value">${s.totalQuestions}</div></div>
        <div class="metric-card"><div class="metric-label">Users</div><div class="metric-value">${s.totalUsers}</div></div>
        <div class="metric-card"><div class="metric-label">Total Tests</div><div class="metric-value">${s.totalTests}</div></div>
        <div class="metric-card"><div class="metric-label">Tests (7d)</div><div class="metric-value">${s.recentTests}</div></div>
      </div>
      
      <div class="sec-card">
        <div class="sec-title">📚 Subject Distribution</div>
        ${subs.length === 0 ? '<div class="empty">No questions yet</div>' :
          subs.map(([sub, c]) => `
            <div class="dist-row">
              <span class="dist-name">${sub}</span>
              <div class="dist-bar-wrap">
                <div class="dist-bar" style="width:${Math.round(c / s.totalQuestions * 100)}%"></div>
              </div>
              <span class="dist-count">${c}</span>
            </div>
          `).join('')}
      </div>
      
      <div class="sec-card">
        <div class="sec-title">🛡️ Recent Login Activity</div>
        ${!(d.loginLog || []).length ? '<div class="empty">No activity</div>' : `
          <table class="dtable">
            <thead>
              <tr><th>Time</th><th>User</th><th>Status</th><th>Reason</th><th>IP</th></tr>
            </thead>
            <tbody>
              ${d.loginLog.map(l => `
                <tr>
                  <td>${new Date(l.created_at).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                  <td>${l.username}</td>
                  <td class="${l.success ? 'ok' : 'fail'}">${l.success ? '✓ OK' : '✗ FAIL'}</td>
                  <td>${l.reason || '-'}</td>
                  <td class="mono">${l.ip_address || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },
  
  async renderUsers(el) {
    const d = await AdminCore.api('users');
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">👥 Users (${(d.users || []).length})</div>
        ${!(d.users || []).length ? '<div class="empty">No users</div>' : `
          <table class="dtable">
            <thead>
              <tr><th>Username</th><th>Tests</th><th>Streak</th><th>Joined</th></tr>
            </thead>
            <tbody>
              ${d.users.map(u => `
                <tr>
                  <td><strong>${u.username}</strong></td>
                  <td>${u.tests_given || 0}</td>
                  <td>🔥 ${u.streak || 0}</td>
                  <td>${new Date(u.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },
  
  renderSecurity(el) {
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">🛡️ Security Configuration</div>
        <table class="dtable">
          <tbody>
            <tr><td>Max Failed Attempts</td><td>3</td></tr>
            <tr><td>Ban Duration</td><td>1 hour</td></tr>
            <tr><td>Session Lifetime</td><td>24 hours</td></tr>
            <tr><td>Password Hash</td><td>bcrypt (12 rounds)</td></tr>
            <tr><td>Cookie</td><td>httpOnly + Secure + SameSite=Strict</td></tr>
            <tr><td>CSRF Protection</td><td>Token per session (X-CSRF-Token header)</td></tr>
            <tr><td>IP Rate Limit</td><td>10 req/min per IP</td></tr>
            <tr><td>Indexing</td><td>noindex, nofollow + robots.txt</td></tr>
          </tbody>
        </table>
      </div>
      <div class="sec-card">
        <div class="sec-title">📝 Current Session</div>
        <table class="dtable">
          <tbody>
            <tr><td>User</td><td>${AdminCore.adminUser?.username || 'unknown'}</td></tr>
            <tr><td>Auth</td><td>httpOnly cookie (JS cannot access)</td></tr>
            <tr><td>CSRF</td><td class="mono">Handled via JWT Bearer Token</td></tr>
          </tbody>
        </table>
      </div>
    `;
  },
  
  async renderActivity(el) {
    const d = await AdminCore.api('audit-logs');
    const logs = d.logs || [];
    const actionColors = { 
      create:'#10b981', update:'#3b82f6', delete:'#ef4444', 
      publish:'#8b5cf6', unpublish:'#f59e0b', archive:'#6b7280', 
      import:'#06b6d4', rollback:'#ec4899', duplicate:'#14b8a6' 
    };
    
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📜 Platform Activity (${logs.length} recent)</div>
        ${logs.length === 0 ? '<div class="empty">No activity recorded yet</div>' :
          logs.map(l => `
            <div class="q-row" style="padding:8px 12px; border-left:3px solid ${actionColors[l.action] || '#6b7280'};">
              <div class="q-body">
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                  <span style="font-weight:600; font-size:12px; padding:2px 6px; border-radius:3px; background:${actionColors[l.action] || '#6b7280'}; color:#fff;">
                    ${l.action.toUpperCase()}
                  </span>
                  <span style="font-size:13px; color:var(--text-primary);">
                    ${l.entity_type} <span class="mono" style="color:var(--text-muted);">${l.entity_id || ''}</span>
                  </span>
                  <span style="font-size:11px; color:var(--text-muted);">by <strong>${l.admin_username}</strong></span>
                  <span style="font-size:11px; color:var(--text-muted);">${new Date(l.created_at).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  }
};
