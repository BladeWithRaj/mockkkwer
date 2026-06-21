// ============================================
// AUTH MODULE — Hybrid Identity System
// Priority: Firebase Google Auth > Username > Guest
// No-login mode always works. Login is optional.
// ============================================

const Auth = {
  _currentUser: null,
  _ready: false,

  // ── Init — Set up identity layer ──
  async init() {
    // ── STEP 1: Instant guest identity (never blocks UI) ──
    const guestId = localStorage.getItem('mocktest_guest_uuid') || crypto.randomUUID();
    localStorage.setItem('mocktest_guest_uuid', guestId);
    this._currentUser = { id: guestId, username: 'Guest', name: 'Guest' };
    this._ready = true;

    // ── STEP 2: Restore cached user (returning visitor) ──
    const cached = this._getLocalCache();
    if (cached && cached.id && cached.username) {
      this._currentUser = cached;
      console.log("✅ Loaded cached user:", cached.username);
    }

    // ── STEP 3: Initialize Firebase Auth (non-blocking) ──
    try {
      if (window.FirebaseAuth) {
        await FirebaseAuth.init();

        // If Firebase user is already signed in, it will update _currentUser
        // via the _syncToSupabase callback
        const fbUser = FirebaseAuth.getUser();
        if (fbUser) {
          console.log("🔥 Firebase session active:", fbUser.displayName);
        }
      }
    } catch (e) {
      console.log("ℹ️ Firebase init skipped:", e.message);
    }

    // ── STEP 4: Best-effort API verify (legacy username system) ──
    try {
      const resp = await fetch('/api/user-verify', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        if (data.valid && data.user) {
          this._currentUser = {
            id: data.user.id,
            username: data.user.username,
            name: data.user.username
          };
          localStorage.setItem("mock_user", JSON.stringify(this._currentUser));
          localStorage.setItem("mocktest_user_id", this._currentUser.id);
          if (typeof Storage !== 'undefined' && Storage.setUsername) {
            Storage.setUsername(this._currentUser.username);
          }
          console.log("✅ Session verified:", this._currentUser.username);
        }
      }
    } catch (e) {
      // Silent — guest mode continues
      console.log("ℹ️ Guest mode active (API unavailable)");
    }
  },

  // ── Local cache (display only, NOT for auth) ──
  _getLocalCache() {
    try {
      const data = localStorage.getItem("mock_user");
      if (!data) return null;
      return JSON.parse(data);
    } catch { return null; }
  },

  // Legacy helpers for supabaseClient.js compatibility
  _getSession() {
    return this._currentUser;
  },

  _saveSession(data) {
    if (data) {
      Object.assign(this._currentUser, data);
      localStorage.setItem("mock_user", JSON.stringify(this._currentUser));
    }
  },

  // ── Check username availability (direct Supabase) ──
  async checkUsername(username) {
    try {
      const { data } = await window.supabaseClient
        .from("users")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      return !!data;
    } catch (err) {
      console.error("checkUsername error:", err);
      return false;
    }
  },

  // ── Create User (via backend — gets session cookie) ──
  async createUser(username) {
    try {
      const resp = await fetch('/api/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, action: 'create' })
      });

      const data = await resp.json();
      if (!data.success) {
        return { success: false, message: data.error || 'Creation failed' };
      }

      this._currentUser = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.username
      };
      this._ready = true;

      localStorage.setItem("mock_user", JSON.stringify(this._currentUser));
      localStorage.setItem("mocktest_user_id", data.user.id);

      if (typeof Storage !== 'undefined' && Storage.setUsername) {
        Storage.setUsername(data.user.username);
      }

      console.log("✅ User created + session set:", data.user.username);
      return { success: true, user: data.user };
    } catch (err) {
      console.error("createUser crash:", err);
      return { success: false, message: "Something went wrong" };
    }
  },

  // ── Login existing user (via backend — gets session cookie) ──
  async loginUser(username) {
    try {
      const resp = await fetch('/api/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, action: 'login' })
      });

      const data = await resp.json();
      if (!data.success) {
        return { success: false, message: data.error || 'Login failed' };
      }

      this._currentUser = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.username
      };
      this._ready = true;

      localStorage.setItem("mock_user", JSON.stringify(this._currentUser));
      localStorage.setItem("mocktest_user_id", data.user.id);

      if (typeof Storage !== 'undefined' && Storage.setUsername) {
        Storage.setUsername(data.user.username);
      }

      console.log("✅ User logged in + session set:", data.user.username);
      return { success: true, user: data.user };
    } catch (err) {
      console.error("loginUser crash:", err);
      return { success: false, message: "Something went wrong" };
    }
  },

  // ── Username Modal ──
  showUsernameModal() {
    return new Promise((resolve) => {
      const existing = document.querySelector('.username-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.className = 'username-modal';
      modal.innerHTML = `
        <div class="username-card">
          <div class="username-brand">
            <div class="username-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h1 class="username-brand-title">Mock<span>24hr</span></h1>
          </div>

          <p class="username-subtitle">Choose your username to get started</p>

          <!-- Google Sign-In Option -->
          <div style="margin-bottom:16px;">
            ${window.FirebaseAuth ? FirebaseAuth.renderLoginSection() : ''}
          </div>

          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
            <span style="color:#64748b;font-size:12px;font-weight:500;">OR</span>
            <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
          </div>

          <div class="username-input-wrap">
            <div class="username-input-icon">@</div>
            <input type="text" id="usernameInput" class="username-input"
              placeholder="raj_ntpc" maxlength="20" autocomplete="off" autofocus />
          </div>

          <div id="usernameStatus" class="username-status"></div>

          <button id="continueBtn" class="username-continue-btn" disabled>
            <span id="continueBtnText">Continue</span>
            <span id="continueBtnLoader" class="username-btn-loader" style="display:none;"></span>
          </button>

          <div class="username-rules">
            3-20 characters · Letters, numbers, underscore only
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      requestAnimationFrame(() => modal.classList.add('visible'));

      // Listen for Firebase login (if user clicks Google button in modal)
      if (window.FirebaseAuth) {
        FirebaseAuth.onAuthChange((user) => {
          if (user) {
            modal.classList.remove('visible');
            setTimeout(() => {
              modal.remove();
              resolve(Auth.getUser());
            }, 300);
          }
        });
      }

      const input = document.getElementById('usernameInput');
      const btn = document.getElementById('continueBtn');
      const status = document.getElementById('usernameStatus');
      const btnText = document.getElementById('continueBtnText');
      const btnLoader = document.getElementById('continueBtnLoader');

      let debounceTimer = null;
      let lastChecked = '';
      let isAvailable = false;

      setTimeout(() => input.focus(), 300);

      // Live username check
      input.addEventListener('input', () => {
        const val = input.value.trim();

        if (!val || val.length < 3) {
          status.className = 'username-status';
          status.textContent = '';
          btn.disabled = true;
          isAvailable = false;
          return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
          status.className = 'username-status error';
          status.textContent = 'Only letters, numbers, underscore allowed';
          btn.disabled = true;
          isAvailable = false;
          return;
        }

        status.className = 'username-status checking';
        status.textContent = 'Checking...';
        btn.disabled = true;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          if (val === lastChecked) return;
          lastChecked = val;

          const taken = await this.checkUsername(val);
          if (input.value.trim() !== val) return;

          if (taken) {
            status.className = 'username-status taken';
            status.innerHTML = '❌ Already taken — <span class="username-login-link" id="loginLink">Login instead?</span>';
            btn.disabled = true;
            isAvailable = false;

            const loginLink = document.getElementById('loginLink');
            if (loginLink) {
              loginLink.onclick = async (e) => {
                e.preventDefault();
                btn.disabled = true;
                btnText.textContent = 'Logging in...';
                btnLoader.style.display = '';
                const result = await this.loginUser(val);
                if (result.success) {
                  modal.classList.remove('visible');
                  setTimeout(() => { modal.remove(); resolve(result.user); }, 300);
                } else {
                  status.className = 'username-status error';
                  status.textContent = result.message;
                  btnText.textContent = 'Continue';
                  btnLoader.style.display = 'none';
                  btn.disabled = false;
                }
              };
            }
          } else {
            status.className = 'username-status available';
            status.textContent = '✅ Available';
            btn.disabled = false;
            isAvailable = true;
          }
        }, 400);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btn.disabled) btn.click();
      });

      btn.onclick = async () => {
        const username = input.value.trim();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
          status.className = 'username-status error';
          status.textContent = '3-20 chars. Letters/numbers/underscore only.';
          return;
        }

        btn.disabled = true;
        btnText.textContent = 'Creating...';
        btnLoader.style.display = '';

        const result = await this.createUser(username);

        if (!result.success) {
          if (result.message === 'Username already taken' || result.message?.includes('already')) {
            status.className = 'username-status taken';
            status.innerHTML = '❌ Already taken — <span class="username-login-link" id="loginLink2">Login instead?</span>';
            const loginLink = document.getElementById('loginLink2');
            if (loginLink) {
              loginLink.onclick = async () => {
                const loginResult = await this.loginUser(username);
                if (loginResult.success) {
                  modal.classList.remove('visible');
                  setTimeout(() => { modal.remove(); resolve(loginResult.user); }, 300);
                } else {
                  status.className = 'username-status error';
                  status.textContent = loginResult.message;
                }
              };
            }
          } else {
            status.className = 'username-status error';
            status.textContent = result.message;
          }
          btnText.textContent = 'Continue';
          btnLoader.style.display = 'none';
          btn.disabled = false;
          return;
        }

        modal.classList.remove('visible');
        setTimeout(() => { modal.remove(); resolve(result.user); }, 300);
      };
    });
  },

  // ── Public API ──
  isAuthenticated() { return true; }, // Always true — guest mode is valid
  
  isFirebaseUser() {
    return !!(this._currentUser && this._currentUser.firebase_uid);
  },

  getUser() {
    return this._currentUser || { id: 'guest_user', username: 'Guest', name: 'Guest' };
  },

  getAuthProvider() {
    if (this._currentUser?.provider === 'google') return 'google';
    if (this._currentUser?.username && this._currentUser.username !== 'Guest') return 'username';
    return 'guest';
  },

  async getSessionToken() { return null; }, // Cookie-based, no manual token needed

  async signOut() {
    // Sign out of Firebase if active
    if (window.FirebaseAuth && FirebaseAuth.isLoggedIn()) {
      await FirebaseAuth.signOut();
      return; // FirebaseAuth.signOut handles reload
    }

    // Legacy username logout
    try {
      await fetch('/api/user-logout', { method: 'POST', credentials: 'include' });
    } catch (e) { /* best effort */ }
    this._currentUser = null;
    this._ready = false;
    if (typeof Storage !== 'undefined' && Storage.clearAll) Storage.clearAll();
    localStorage.removeItem("mock_user");
    localStorage.removeItem("mocktest_user_id");
    window.location.reload();
  },

  openProfile() {
    if (window.App && App.navigate) App.navigate('profile');
  },

  // ── Render nav login/user UI ──
  renderNavAuth() {
    if (window.FirebaseAuth && FirebaseAuth.isLoggedIn()) {
      const u = FirebaseAuth.getUser();
      return `
        <div class="nav-user-pill" onclick="Auth.openProfile()" title="${u.displayName}">
          <img src="${u.photoURL || ''}" alt="" onerror="this.style.display='none'" />
          <span>${(u.displayName || 'User').split(' ')[0]}</span>
        </div>
      `;
    }

    return `
      <button class="nav-login-btn" onclick="FirebaseAuth.signInWithGoogle()" title="Sign in with Google">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Login
      </button>
    `;
  },

  // Legacy stubs
  isVerified() { return this.isAuthenticated(); },
  isAnonymous() { return !this.isAuthenticated(); },
  shouldShowUpgradePrompt() { return false; },
  dismissUpgradePrompt() {}
};

window.Auth = Auth;
