// ============================================
// AUTH MODULE — Email Sign-up, Sign-in,
// Anonymous Upgrade, Merge, Session Management
// ============================================

const Auth = {
  // ── State ──────────────────────────────────
  _currentUser: null,
  _upgradePromptDismissed: false,
  _authListener: null,

  /**
   * Initialize session.
   * - If no session → create anonymous
   * - If anonymous session → store token in http-only cookie
   * - If email session → auto-merge any leftover anonymous data
   * - Setup onAuthStateChange for auto token refresh
   */
  async init() {
    try {
      const { data: { session } } = await client.auth.getSession();

      if (!session) {
        // No session at all → create anonymous
        console.log("🔑 Creating anonymous session...");
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        this._currentUser = data.user;
        await this._storeAnonCookie(data.session.access_token);
        console.log("✅ Anonymous session created:", data.user.id);
      } else if (!session.user.email) {
        // Anonymous session exists → ensure cookie is set
        this._currentUser = session.user;
        await this._storeAnonCookie(session.access_token);
        console.log("✅ Anonymous session resumed:", session.user.id);
      } else {
        // Email session → try auto-merge
        this._currentUser = session.user;
        console.log("✅ Email session active:", session.user.email);
        await this._tryAutoMerge();
      }

      this._upgradePromptDismissed = localStorage.getItem("upgradePromptDismissed") === "true";

      // ── Setup Auth State Listener ──────────
      // Handles: token refresh, session expiry, sign-in/sign-out from other tabs
      this._setupAuthListener();

    } catch (err) {
      console.error("Auth init error:", err);
    }
  },

  /**
   * Listen for auth state changes — keeps session alive, handles expiry
   */
  _setupAuthListener() {
    if (this._authListener) return; // Already listening

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 Auth event: ${event}`);

      switch (event) {
        case 'SIGNED_IN':
          this._currentUser = session?.user || null;
          break;

        case 'TOKEN_REFRESHED':
          // Supabase auto-refreshed the JWT — update our reference
          this._currentUser = session?.user || null;
          console.log('🔄 Token refreshed successfully');
          break;

        case 'SIGNED_OUT':
          this._currentUser = null;
          console.log('👋 User signed out');
          break;

        case 'USER_UPDATED':
          this._currentUser = session?.user || null;
          break;

        default:
          break;
      }
    });

    this._authListener = subscription;
  },

  /**
   * Sign up with email + password
   * After successful signup, auto-merges anonymous data
   */
  async signUp(email, password) {
    try {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;

      this._currentUser = data.user;
      console.log("✅ Signed up:", email);

      // Auto-merge anonymous data
      await this._tryAutoMerge();

      return { success: true, user: data.user };
    } catch (err) {
      console.error("Sign-up error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Sign in with email + password
   * After successful sign-in, auto-merges anonymous data from THIS device
   */
  async signIn(email, password) {
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      this._currentUser = data.user;
      console.log("✅ Signed in:", email);

      // Auto-merge anonymous data
      await this._tryAutoMerge();

      return { success: true, user: data.user };
    } catch (err) {
      console.error("Sign-in error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Sign out — clears session AND all local state.
   * Prevents data leakage between accounts.
   */
  async signOut() {
    try {
      const wasVerified = this.isVerified();
      await client.auth.signOut();

      // ── Clear ALL local state ──
      Storage.clearCurrentTest();
      Storage.clearHistory();
      localStorage.removeItem('mocktest_username');
      localStorage.removeItem('mocktest_user_id');
      localStorage.removeItem('mocktest_seen_questions');
      localStorage.removeItem('upgradePromptDismissed');
      this._upgradePromptDismissed = false;

      if (wasVerified) {
        // Don't create anonymous — user should re-login
        this._currentUser = null;
        console.log("✅ Signed out (email user) — all state cleared, no anonymous fallback");
      } else {
        // Was already anonymous — create fresh anonymous session
        const { data } = await client.auth.signInAnonymously();
        this._currentUser = data?.user || null;
        if (data?.session) {
          await this._storeAnonCookie(data.session.access_token);
        }
        console.log("✅ Signed out → new anonymous session");
      }

      // Redirect to home
      window.location.hash = 'home';
      if (window.App) App.navigate('home');

      return { success: true };
    } catch (err) {
      console.error("Sign-out error:", err);
      return { success: false, error: err.message };
    }
  },

  // ── Helpers ────────────────────────────────

  /** Is the current user verified (has email)? */
  isVerified() {
    return !!(this._currentUser && this._currentUser.email);
  },

  /** Is the current user anonymous? */
  isAnonymous() {
    return !!(this._currentUser && !this._currentUser.email);
  },

  /** Get current user object */
  getUser() {
    return this._currentUser;
  },

  /**
   * Get current session token for API calls.
   * Returns null if no active session.
   */
  async getSessionToken() {
    try {
      const { data: { session } } = await client.auth.getSession();
      return session?.access_token || null;
    } catch (err) {
      console.warn("Could not get session token:", err);
      return null;
    }
  },

  /** Should we show the upgrade prompt? */
  shouldShowUpgradePrompt() {
    return this.isAnonymous() && !this._upgradePromptDismissed;
  },

  /** Dismiss the upgrade prompt */
  dismissUpgradePrompt() {
    this._upgradePromptDismissed = true;
    localStorage.setItem("upgradePromptDismissed", "true");
  },

  /**
   * Store the anonymous JWT in an http-only cookie via the API.
   * The cookie is invisible to JS — only the server can read it.
   */
  async _storeAnonCookie(token) {
    try {
      await fetch("/api/set-anon-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token })
      });
    } catch (err) {
      console.warn("Could not store anon cookie:", err);
    }
  },

  /**
   * Auto-merge: called after sign-up or sign-in.
   * The merge endpoint reads the cookie — we just need to pass
   * the current (email) user's token in the Authorization header.
   */
  async _tryAutoMerge() {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session || !session.user.email) return;

      const resp = await fetch("/api/merge-anonymous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        credentials: "include" // sends the anon_token cookie
      });

      const result = await resp.json();

      if (result.merged > 0) {
        console.log(`🔄 Merged ${result.merged} anonymous result(s) into your account`);
        if (window.Helpers) {
          Helpers.showToast(`✅ ${result.merged} previous test(s) linked to your account!`, "success");
        }
      } else {
        console.log("ℹ️ Merge:", result.message);
      }

      // Clear the cookie (server already does it, but belt-and-suspenders)
      await fetch("/api/clear-anon-cookie", {
        method: "POST",
        credentials: "include"
      });

    } catch (err) {
      console.warn("Auto-merge failed (non-critical):", err);
    }
  }
};

// Make globally accessible
window.Auth = Auth;

