// ============================================
// AUTH MODULE — Username Identity System
// No Clerk. No OTP. Instant entry.
// Supabase users table + localStorage session
// ============================================

const Auth = {
  _currentUser: null,
  _ready: false,

  // ── Session Manager ──

  _saveSession(user) {
    localStorage.setItem("mock_user", JSON.stringify(user));
  },

  _getSession() {
    try {
      const data = localStorage.getItem("mock_user");
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  _clearSession() {
    localStorage.removeItem("mock_user");
  },

  // ── Init ──

  async init() {
    const session = this._getSession();

    if (session && session.username) {
      this._currentUser = {
        id: session.id,
        username: session.username,
        name: session.username,
        coins: session.coins || 0,
        streak: session.streak || 0,
        tests_given: session.tests_given || 0,
        created_at: session.created_at
      };
      this._ready = true;

      // Sync to Storage for backward compat
      if (typeof Storage !== 'undefined' && Storage.setUsername) {
        Storage.setUsername(this._currentUser.username);
      }
      localStorage.setItem("mocktest_user_id", this._currentUser.id);

      console.log("✅ User session restored:", this._currentUser.username);
      return;
    }

    // No session — show username modal
    console.log("🔐 No session. Username modal will be triggered by App.");
    this._ready = false;
  },

  // ── Username Check (availability) ──

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

  // ── Create User ──

  async createUser(username) {
    const normalized = username.toLowerCase().trim();

    const exists = await this.checkUsername(normalized);
    if (exists) {
      return { success: false, message: "Username already taken" };
    }

    try {
      const { data, error } = await window.supabaseClient
        .from("users")
        .insert({ username: normalized })
        .select()
        .single();

      if (error) {
        console.error("createUser error:", error);
        return { success: false, message: error.message };
      }

      // Save session
      this._saveSession(data);

      // Set current user
      this._currentUser = {
        id: data.id,
        username: data.username,
        name: data.username,
        coins: data.coins || 0,
        streak: data.streak || 0,
        tests_given: data.tests_given || 0,
        created_at: data.created_at
      };
      this._ready = true;

      // Sync to Storage for backward compat
      if (typeof Storage !== 'undefined' && Storage.setUsername) {
        Storage.setUsername(data.username);
      }
      localStorage.setItem("mocktest_user_id", data.id);

      console.log("✅ User created:", data.username);
      return { success: true, user: data };
    } catch (err) {
      console.error("createUser crash:", err);
      return { success: false, message: "Something went wrong" };
    }
  },

  // ── Login existing user ──

  async loginUser(username) {
    const normalized = username.toLowerCase().trim();

    try {
      const { data, error } = await window.supabaseClient
        .from("users")
        .select("*")
        .eq("username", normalized)
        .single();

      if (error || !data) {
        return { success: false, message: "User not found" };
      }

      // Save session
      this._saveSession(data);

      this._currentUser = {
        id: data.id,
        username: data.username,
        name: data.username,
        coins: data.coins || 0,
        streak: data.streak || 0,
        tests_given: data.tests_given || 0,
        created_at: data.created_at
      };
      this._ready = true;

      if (typeof Storage !== 'undefined' && Storage.setUsername) {
        Storage.setUsername(data.username);
      }
      localStorage.setItem("mocktest_user_id", data.id);

      console.log("✅ User logged in:", data.username);
      return { success: true, user: data };
    } catch (err) {
      console.error("loginUser crash:", err);
      return { success: false, message: "Something went wrong" };
    }
  },

  // ── Username Modal ──

  showUsernameModal() {
    return new Promise((resolve) => {
      // Remove any existing modal
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
            <input
              type="text"
              id="usernameInput"
              class="username-input"
              placeholder="raj_ntpc"
              maxlength="20"
              autocomplete="off"
              autofocus
            />
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

      // Animate in
      requestAnimationFrame(() => {
        modal.classList.add('visible');
      });

      const input = document.getElementById('usernameInput');
      const btn = document.getElementById('continueBtn');
      const status = document.getElementById('usernameStatus');
      const btnText = document.getElementById('continueBtnText');
      const btnLoader = document.getElementById('continueBtnLoader');

      let debounceTimer = null;
      let lastChecked = '';
      let isAvailable = false;

      // Focus input
      setTimeout(() => input.focus(), 300);

      // Live username check with debounce
      input.addEventListener('input', () => {
        const val = input.value.trim();

        // Validate format
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

        // Debounced availability check
        status.className = 'username-status checking';
        status.textContent = 'Checking...';
        btn.disabled = true;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          if (val === lastChecked) return;
          lastChecked = val;

          const taken = await this.checkUsername(val);
          
          // Only update if input hasn't changed
          if (input.value.trim() !== val) return;

          if (taken) {
            status.className = 'username-status taken';
            status.innerHTML = '❌ Already taken — <span class="username-login-link" id="loginLink">Login instead?</span>';
            btn.disabled = true;
            isAvailable = false;

            // Add login link handler
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

      // Enter key support
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btn.disabled) {
          btn.click();
        }
      });

      // Continue button
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
          // If already taken, offer login
          if (result.message === 'Username already taken') {
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

        // Success — close modal
        modal.classList.remove('visible');
        setTimeout(() => {
          modal.remove();
          resolve(result.user);
        }, 300);
      };
    });
  },

  // ── Public API (backward compatible) ──

  isAuthenticated() {
    return this._ready && !!this._currentUser;
  },

  getUser() {
    return this._currentUser;
  },

  async getSessionToken() {
    // No Clerk tokens anymore — return null
    return null;
  },

  async signOut() {
    this._clearSession();
    this._currentUser = null;
    this._ready = false;
    if (typeof Storage !== 'undefined' && Storage.clearAll) Storage.clearAll();
    localStorage.removeItem("mock_user");
    localStorage.removeItem("mocktest_user_id");
    window.location.reload();
  },

  openProfile() {
    if (window.App && App.navigate) {
      App.navigate('profile');
    }
  },

  // Legacy stubs (backward compat)
  isVerified() { return this.isAuthenticated(); },
  isAnonymous() { return !this.isAuthenticated(); },
  shouldShowUpgradePrompt() { return false; },
  dismissUpgradePrompt() {}
};

window.Auth = Auth;
