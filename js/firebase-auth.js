// ============================================
// FIREBASE AUTH — Google Sign-In Integration
// Hybrid: Firebase Auth (identity) + Supabase (data)
// Guest mode works 100% without login
// ============================================

const FirebaseAuth = {
  _app: null,
  _auth: null,
  _provider: null,
  _currentUser: null,
  _listeners: [],
  _initialized: false,

  // Firebase config for authentication-12b37
  _config: {
    apiKey: "AIzaSyD7JcTSA8zhdim7KmktOJLrcnw19i_KOFM",
    authDomain: "authentication-12b37.firebaseapp.com",
    projectId: "authentication-12b37",
    storageBucket: "authentication-12b37.firebasestorage.app",
    messagingSenderId: "995387630981",
    appId: "1:995387630981:web:6323f264b6f767764450ec",
    measurementId: "G-ZVXE787EDW"
  },

  // ── Initialize Firebase ──
  async init() {
    try {
      // Check if Firebase SDK loaded
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK not loaded — guest mode only');
        this._initialized = true;
        return;
      }

      // Initialize app (only once)
      if (!firebase.apps.length) {
        this._app = firebase.initializeApp(this._config);
      } else {
        this._app = firebase.apps[0];
      }

      this._auth = firebase.auth();
      this._provider = new firebase.auth.GoogleAuthProvider();
      this._provider.addScope('profile');
      this._provider.addScope('email');

      // Listen for auth state changes
      this._auth.onAuthStateChanged((user) => {
        this._handleAuthChange(user);
      });

      // Handle redirect result (fallback when popup is blocked)
      try {
        const redirectResult = await this._auth.getRedirectResult();
        if (redirectResult && redirectResult.user) {
          console.log('🔁 Redirect sign-in result received:', redirectResult.user.displayName);
        }
      } catch (redirectErr) {
        console.log('ℹ️ No redirect result:', redirectErr.message);
      }

      this._initialized = true;
      console.log('🔥 Firebase Auth initialized');
    } catch (err) {
      console.error('Firebase init error:', err);
      this._initialized = true; // Don't block app
    }
  },

  // ── Handle auth state change ──
  async _handleAuthChange(firebaseUser) {
    if (firebaseUser) {
      this._currentUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        provider: 'google'
      };
      console.log('✅ Firebase user:', firebaseUser.displayName);

      // Sync to Supabase
      await this._syncToSupabase(firebaseUser);

      // Notify listeners
      this._listeners.forEach(fn => fn(this._currentUser));
    } else {
      this._currentUser = null;
      this._listeners.forEach(fn => fn(null));
    }
  },

  // ── Sync Firebase user to Supabase users table ──
  async _syncToSupabase(firebaseUser) {
    try {
      if (typeof client === 'undefined') {
        console.warn('Supabase client not available for sync');
        return null;
      }

      const uid = firebaseUser.uid;
      const email = firebaseUser.email;
      const displayName = firebaseUser.displayName || email?.split('@')[0] || 'User';
      const avatarUrl = firebaseUser.photoURL;

      // Check if user exists by firebase_uid
      const { data: existing } = await client
        .from('users')
        .select('id, username, firebase_uid')
        .eq('firebase_uid', uid)
        .maybeSingle();

      if (existing) {
        // Update last login
        await client
          .from('users')
          .update({
            display_name: displayName,
            avatar_url: avatarUrl,
            email: email,
            last_login_at: new Date().toISOString()
          })
          .eq('firebase_uid', uid);

        // Store in localStorage for Auth module
        const userData = {
          id: existing.id,
          username: existing.username,
          name: displayName,
          email: email,
          avatar: avatarUrl,
          firebase_uid: uid,
          provider: 'google'
        };
        localStorage.setItem('mock_user', JSON.stringify(userData));
        localStorage.setItem('mocktest_user_id', existing.id);

        // Update Auth module
        if (window.Auth) {
          Auth._currentUser = userData;
        }

        console.log('✅ Supabase user synced:', existing.username);
        return existing;
      } else {
        // Check if guest user exists — merge local data
        const guestId = localStorage.getItem('mocktest_guest_uuid');

        // Try to find existing guest user to merge
        let mergeUserId = null;
        if (guestId) {
          const { data: guestUser } = await client
            .from('users')
            .select('id, username')
            .eq('id', guestId)
            .maybeSingle();

          if (guestUser) {
            mergeUserId = guestUser.id;
          }
        }

        if (mergeUserId) {
          // Merge: upgrade guest account to Firebase account
          await client
            .from('users')
            .update({
              firebase_uid: uid,
              email: email,
              display_name: displayName,
              avatar_url: avatarUrl,
              auth_provider: 'google',
              last_login_at: new Date().toISOString()
            })
            .eq('id', mergeUserId);

          const userData = {
            id: mergeUserId,
            username: displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20),
            name: displayName,
            email: email,
            avatar: avatarUrl,
            firebase_uid: uid,
            provider: 'google'
          };
          localStorage.setItem('mock_user', JSON.stringify(userData));
          localStorage.setItem('mocktest_user_id', mergeUserId);

          if (window.Auth) Auth._currentUser = userData;
          console.log('✅ Guest account merged with Google:', mergeUserId);
          return { id: mergeUserId };
        } else {
          // Create new user
          const username = this._generateUsername(displayName);
          const { data: newUser, error } = await client
            .from('users')
            .insert({
              username: username,
              firebase_uid: uid,
              email: email,
              display_name: displayName,
              avatar_url: avatarUrl,
              auth_provider: 'google',
              last_login_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase user creation failed:', error);
            return null;
          }

          const userData = {
            id: newUser.id,
            username: newUser.username,
            name: displayName,
            email: email,
            avatar: avatarUrl,
            firebase_uid: uid,
            provider: 'google'
          };
          localStorage.setItem('mock_user', JSON.stringify(userData));
          localStorage.setItem('mocktest_user_id', newUser.id);

          if (window.Auth) Auth._currentUser = userData;
          console.log('✅ New Supabase user created:', newUser.username);
          return newUser;
        }
      }
    } catch (err) {
      console.error('🔥 Supabase sync error:', err);
      return null;
    }
  },

  // ── Generate unique username from display name ──
  _generateUsername(displayName) {
    const base = (displayName || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 14);
    const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${base}_${suffix}`;
  },

  // ── Sign In with Google ──
  async signInWithGoogle() {
    try {
      // Auto-initialize if not done yet
      if (!this._auth) {
        console.log('🔥 Auto-initializing Firebase...');
        await this.init();
      }

      if (!this._auth) {
        console.error('Firebase Auth could not be initialized');
        if (window.Helpers) Helpers.showToast('Login service unavailable. Try refreshing.', 'error');
        return null;
      }

      // Show loading
      this._showLoginLoading(true);

      // Detect mobile or cross-origin (use redirect for better compatibility)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobile: always use redirect (popups are unreliable)
        console.log('📱 Mobile detected — using redirect sign-in');
        if (window.Helpers) Helpers.showToast('Redirecting to Google...', 'info');
        await this._auth.signInWithRedirect(this._provider);
        return null;
      }

      // Desktop: try popup first
      try {
        const result = await this._auth.signInWithPopup(this._provider);
        const user = result.user;

        console.log('🎉 Google Sign-In successful:', user.displayName);
        if (window.Helpers) Helpers.showToast(`Welcome, ${user.displayName}! 🎉`, 'success');

        this._showLoginLoading(false);
        this._updateLoginUI(true);

        // Re-render page to reflect login state
        setTimeout(() => {
          if (window.App && App.currentPage) {
            App.navigate(App.currentPage, App.params || {});
          }
        }, 300);

        return user;
      } catch (popupErr) {
        console.error('Popup sign-in error:', popupErr.code, popupErr.message);

        // Popup blocked → fallback to redirect
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
          console.log('Popup blocked, using redirect fallback...');
          if (window.Helpers) Helpers.showToast('Redirecting to Google Sign-In...', 'info');
          await this._auth.signInWithRedirect(this._provider);
          return null;
        }

        if (popupErr.code === 'auth/popup-closed-by-user') {
          this._showLoginLoading(false);
          return null;
        }

        // Domain not authorized
        if (popupErr.code === 'auth/unauthorized-domain') {
          const domain = window.location.hostname;
          console.error('❌ Domain not authorized:', domain);
          if (window.Helpers) Helpers.showToast(`Add "${domain}" in Firebase Console → Auth → Settings → Authorized domains`, 'error');
          this._showLoginLoading(false);
          return null;
        }

        // Internal error (often means Google provider not enabled)
        if (popupErr.code === 'auth/internal-error' || popupErr.code === 'auth/operation-not-allowed') {
          console.error('❌ Google Sign-In not enabled in Firebase Console');
          if (window.Helpers) Helpers.showToast('Google Sign-In is not enabled. Contact admin.', 'error');
          this._showLoginLoading(false);
          return null;
        }

        throw popupErr;
      }
    } catch (err) {
      this._showLoginLoading(false);
      console.error('Google Sign-In error:', err.code, err.message);
      if (window.Helpers) Helpers.showToast('Login failed: ' + (err.message || 'Unknown error'), 'error');
      return null;
    }
  },

  // ── Sign Out ──
  async signOut() {
    try {
      if (this._auth) {
        await this._auth.signOut();
      }

      this._currentUser = null;

      // Reset to guest mode
      const guestId = crypto.randomUUID();
      localStorage.setItem('mocktest_guest_uuid', guestId);
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mocktest_user_id');

      if (window.Auth) {
        Auth._currentUser = { id: guestId, username: 'Guest', name: 'Guest' };
      }

      this._updateLoginUI(false);
      Helpers.showToast('Signed out successfully', 'info');
      console.log('👋 Signed out');

      // Reload to reset state
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  },

  // ── Public API ──
  isLoggedIn() {
    return !!this._currentUser;
  },

  getUser() {
    return this._currentUser;
  },

  onAuthChange(callback) {
    this._listeners.push(callback);
  },

  // ── UI Helpers ──
  _showLoginLoading(show) {
    const btn = document.getElementById('google-login-btn');
    if (!btn) return;
    if (show) {
      btn.disabled = true;
      btn.innerHTML = `<span class="fa-login-spinner"></span> Signing in...`;
    } else {
      btn.disabled = false;
    }
  },

  _updateLoginUI(isLoggedIn) {
    // Update all login/logout buttons across pages
    document.querySelectorAll('.fa-login-area').forEach(el => {
      if (isLoggedIn && this._currentUser) {
        el.innerHTML = `
          <div class="fa-user-card">
            <img src="${this._currentUser.photoURL || ''}" 
                 alt="" class="fa-user-avatar"
                 onerror="this.style.display='none'" />
            <div class="fa-user-info">
              <span class="fa-user-name">${this._currentUser.displayName || 'User'}</span>
              <span class="fa-user-email">${this._currentUser.email || ''}</span>
            </div>
            <button class="fa-logout-btn" onclick="FirebaseAuth.signOut()" title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        `;
      } else {
        el.innerHTML = `
          <button id="google-login-btn" class="fa-google-btn" onclick="FirebaseAuth.signInWithGoogle()">
            <svg class="fa-google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        `;
      }
    });

    // Update nav avatar if present
    const navAvatar = document.querySelector('.nav-user-avatar');
    if (navAvatar && isLoggedIn && this._currentUser?.photoURL) {
      navAvatar.src = this._currentUser.photoURL;
      navAvatar.style.display = 'block';
    }
  },

  // ── Render login section for any page ──
  renderLoginSection() {
    if (this.isLoggedIn()) {
      const u = this._currentUser;
      return `
        <div class="fa-login-area">
          <div class="fa-user-card">
            <img src="${u.photoURL || ''}" alt="" class="fa-user-avatar" onerror="this.style.display='none'" />
            <div class="fa-user-info">
              <span class="fa-user-name">${u.displayName || 'User'}</span>
              <span class="fa-user-email">${u.email || ''}</span>
            </div>
            <button class="fa-logout-btn" onclick="FirebaseAuth.signOut()" title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="fa-login-area">
        <button id="google-login-btn" class="fa-google-btn" onclick="FirebaseAuth.signInWithGoogle()">
          <svg class="fa-google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Sign in with Google</span>
        </button>
      </div>
    `;
  }
};

window.FirebaseAuth = FirebaseAuth;
