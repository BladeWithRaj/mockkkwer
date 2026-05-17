// ============================================
// AUTH MODULE — Session-Based Identity System
// Backend httpOnly cookie = source of truth.
// No spoofable localStorage-only identity.
// ============================================

const Auth = {
  _currentUser: null,
  _ready: false,

  // ── Init — Check if user has active session ──

  async init() {
    try {
      const resp = await fetch('/api/user-verify', { credentials: 'include' });
      const data = await resp.json();

      if (data.valid && data.user) {
        this._currentUser = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.username
        };
        this._ready = true;

        // Sync to localStorage for renderers (display name only)
        localStorage.setItem("mock_user", JSON.stringify(this._currentUser));
        localStorage.setItem("mocktest_user_id", this._currentUser.id);

        if (typeof Storage !== 'undefined' && Storage.setUsername) {
          Storage.setUsername(this._currentUser.username);
        }

        console.log("✅ Session verified:", this._currentUser.username);
        return;
      }
    } catch (e) {
      console.warn("Session verify failed:", e.message);
    }

    // No valid session — try local cache for offline display
    const cached = this._getLocalCache();
    if (cached) {
      this._currentUser = cached;
      this._ready = true;
      console.log("⚠️ Using cached identity (no active session):", cached.username);
      return;
    }

    // No session, no cache — show username modal
    console.log("🔐 No session. Username modal will be triggered by App.");
    this._ready = false;
  },

  // ── Local cache (display only, NOT for auth) ──

  _getLocalCache() {
    try {
      const data = localStorage.getItem("mock_user");
      if (!data) return null;
      return JSON.parse(data);
    } catch { return null; }
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

      // Session cookie set by backend — store display data locally
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

  isAuthenticated() { return this._ready && !!this._currentUser; },
  getUser() { return this._currentUser; },
  async getSessionToken() { return null; }, // Cookie-based, no manual token needed

  async signOut() {
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

  // Legacy stubs
  isVerified() { return this.isAuthenticated(); },
  isAnonymous() { return !this.isAuthenticated(); },
  shouldShowUpgradePrompt() { return false; },
  dismissUpgradePrompt() {}
};

window.Auth = Auth;
