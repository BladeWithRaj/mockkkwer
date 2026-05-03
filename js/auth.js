// ============================================
// AUTH MODULE — Clerk Authentication
// Sign-in, Sign-up, Session Management
// ============================================

const Auth = {
  _currentUser: null,
  _ready: false,

  /**
   * Initialize Clerk authentication.
   * - Loads Clerk SDK
   * - If no user → opens sign-in modal and waits
   * - If user exists → syncs user data to local storage
   * Returns a promise that resolves when user is authenticated.
   */
  async init() {
    try {
      if (!window.Clerk) {
        throw new Error("Clerk SDK not loaded. Check index.html script tag.");
      }

      await window.Clerk.load({
        appearance: window.CONFIG?.CLERK_APPEARANCE || {}
      });

      if (window.Clerk.user) {
        this._onUserReady();
        return;
      }

      // No user — show sign-in and wait for completion
      return new Promise((resolve) => {
        const unsub = window.Clerk.addListener(({ user }) => {
          if (user) {
            this._onUserReady();
            resolve();
          }
        });

        // Store unsubscribe for cleanup
        this._listenerUnsub = unsub;

        // Open Clerk sign-in modal
        window.Clerk.openSignIn({
          afterSignInUrl: window.location.href,
          afterSignUpUrl: window.location.href
        });
      });

    } catch (err) {
      console.error("❌ Auth init error:", err);
      throw err;
    }
  },

  /**
   * Called when Clerk user is ready.
   * Syncs user data to localStorage for backward compatibility.
   */
  _onUserReady() {
    const u = window.Clerk.user;
    if (!u) return;

    this._currentUser = {
      clerkId: u.id,
      name: u.fullName || u.username || u.firstName || "User",
      email: u.primaryEmailAddress?.emailAddress || null,
      avatar: u.imageUrl || null,
      firstName: u.firstName || "",
      lastName: u.lastName || ""
    };
    this._ready = true;

    // Backward-compatible: sync to Storage keys used throughout the app
    Storage.setUsername(this._currentUser.name);
    localStorage.setItem("mocktest_user_id", this._currentUser.clerkId);

    console.log("✅ Clerk user ready:", this._currentUser.name, this._currentUser.clerkId);
  },

  // ── Public API ──────────────────────────────

  /** Is the user fully authenticated? */
  isAuthenticated() {
    return this._ready && !!window.Clerk?.user;
  },

  /** Get current user info object */
  getUser() {
    return this._currentUser;
  },

  /** Get Clerk session JWT for API calls */
  async getSessionToken() {
    try {
      if (!window.Clerk?.session) return null;
      return await window.Clerk.session.getToken();
    } catch (err) {
      console.warn("Could not get session token:", err);
      return null;
    }
  },

  /** Sign out and reload */
  async signOut() {
    try {
      await window.Clerk.signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    this._currentUser = null;
    this._ready = false;

    // Clear all local state
    Storage.clearAll();
    localStorage.removeItem("mocktest_avatar");
    localStorage.removeItem("mocktest_avatar_synced");
    localStorage.removeItem("used_ids");
    localStorage.removeItem("variant");

    window.location.reload();
  },

  /** Open Clerk user profile modal */
  openProfile() {
    if (window.Clerk?.openUserProfile) {
      window.Clerk.openUserProfile();
    }
  },

  // ── Legacy Compatibility ────────────────────
  // These methods existed in the old Supabase auth module.
  // Kept as stubs so nothing breaks.

  isVerified() { return this.isAuthenticated(); },
  isAnonymous() { return !this.isAuthenticated(); },
  shouldShowUpgradePrompt() { return false; },
  dismissUpgradePrompt() {}
};

// Make globally accessible
window.Auth = Auth;
