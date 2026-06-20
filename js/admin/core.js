// ============================================
// ADMIN CONSOLE — Core Operating System
// ============================================

window.AdminCore = {
  adminUser: null,
  currentTab: 'dashboard',
  token: localStorage.getItem('admin_token'),
  
  // Shared State
  qPage: 1,
  qSearch: '',
  qSubject: '',
  
  async init() {
    if (!this.token) {
      window.location.href = '/secure-admin-login/';
      return;
    }
    
    try {
      const r = await fetch('/api/admin-verify', { 
        headers: { 'Authorization': 'Bearer ' + this.token } 
      });
      const d = await r.json();
      
      if (!d.valid) throw new Error('Invalid token');
      
      this.adminUser = d;
      document.getElementById('adminName').textContent = d.username;
      document.getElementById('authGuard').style.display = 'none';
      document.getElementById('adminShell').style.display = 'block';
      
      this.loadTab('dashboard');
    } catch (e) {
      localStorage.removeItem('admin_token');
      window.location.href = '/secure-admin-login/';
    }
  },
  
  switchTab(t) {
    this.currentTab = t;
    document.querySelectorAll('.tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === t);
    });
    this.loadTab(t);
  },
  
  async loadTab(t) {
    const el = document.getElementById('adminContent');
    el.innerHTML = '<div class="loading"><span class="guard-spin"></span> Loading...</div>';
    
    try {
      switch(t) {
        case 'dashboard': await window.AdminDashboard.render(el); break;
        case 'questions': await window.AdminQuestions.renderList(el); break;
        case 'add': window.AdminQuestions.renderAdd(el); break;
        case 'import': window.AdminQuestions.renderImport(el); break;
        case 'exams': await window.AdminExams.renderList(el); break;
        case 'poly': await window.AdminPoly.renderTab(el); break;
        case 'users': await window.AdminDashboard.renderUsers(el); break;
        case 'activity': await window.AdminDashboard.renderActivity(el); break;
        case 'security': window.AdminDashboard.renderSecurity(el); break;
        default: el.innerHTML = '<div class="empty">Tab not found</div>';
      }
    } catch(e) {
      el.innerHTML = `<div class="empty">❌ ${e.message}</div>`;
      console.error(e);
    }
  },
  
  async api(action, body = null) {
    const opts = { 
      headers: { 'Authorization': 'Bearer ' + this.token } 
    };
    
    let url = `/api/admin-data?action=${action}`;
    if (body) {
      opts.method = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    
    const r = await fetch(url, opts);
    if (r.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/secure-admin-login/';
      throw new Error('Session expired');
    }
    
    const d = await r.json();
    if (!d.success && d.error) throw new Error(d.error);
    return d;
  },
  
  async logout() {
    try {
      await fetch('/api/admin-logout', { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer ' + this.token } 
      });
    } catch(e) {}
    
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/secure-admin-login/';
  },
  
  showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => {
      t.classList.remove('visible');
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }
};

// Global hooks for inline HTML handlers
window.switchTab = (t) => AdminCore.switchTab(t);
window.adminLogout = () => AdminCore.logout();
window.showToast = (msg, type) => AdminCore.showToast(msg, type);

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('authGuard')) {
    AdminCore.init();
  }
});
