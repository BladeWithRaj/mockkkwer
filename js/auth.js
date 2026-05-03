// ============================================
// AUTH MODULE — Clerk Authentication
// Clean, simple, no hacks
// ============================================

const Auth = {
  _currentUser: null,
  _ready: false,

  /**
   * Poll until window.Clerk exists (async CDN script)
   */
  async _waitForClerk() {
    while (!window.Clerk) {
      await new Promise(r => setTimeout(r, 50));
    }
    return window.Clerk;
  },

  /**
   * Init:
   * 1. Wait for Clerk CDN
   * 2. Clerk.load()
   * 3. If user → ready
   * 4. If no user → openSignIn, listen for login
   */
  async init() {
    const Clerk = await this._waitForClerk();

    await Clerk.load();

    console.log("✅ Clerk loaded. user:", Clerk.user?.id || "none");

    if (Clerk.user) {
      this._onUserReady();
      return;
    }

    // No user — open sign-in popup and wait
    console.log("🔐 Opening sign-in...");
    Clerk.openSignIn();

    // Wait for user to sign in
    return new Promise((resolve) => {
      Clerk.addListener(({ user }) => {
        if (user) {
          console.log("🎉 Signed in:", user.id);
          this._onUserReady();
          resolve();
        }
      });
    });
  },

  _onUserReady() {
    const u = window.Clerk.user;
    if (!u) return;

    this._currentUser = {
      clerkId: u.id,
      name: u.fullName || u.username || u.firstName || "User",
      email: u.primaryEmailAddress?.emailAddress || null,
      avatar: u.imageUrl || null
    };
    this._ready = true;

    // Sync to localStorage for backward compat
    if (typeof Storage !== 'undefined' && Storage.setUsername) {
      Storage.setUsername(this._currentUser.name);
    }
    localStorage.setItem("mocktest_user_id", this._currentUser.clerkId);

    console.log("✅ User ready:", this._currentUser.name);
  },

  // ── Public API ──

  isAuthenticated() {
    return this._ready && !!window.Clerk?.user;
  },

  getUser() {
    return this._currentUser;
  },

  async getSessionToken() {
    try {
      if (!window.Clerk?.session) return null;
      return await window.Clerk.session.getToken();
    } catch (e) {
      return null;
    }
  },

  async signOut() {
    try { await window.Clerk.signOut(); } catch (e) {}
    this._currentUser = null;
    this._ready = false;
    if (typeof Storage !== 'undefined' && Storage.clearAll) Storage.clearAll();
    window.location.reload();
  },

  openProfile() {
    if (window.Clerk?.openUserProfile) window.Clerk.openUserProfile();
  },

  // Legacy stubs
  isVerified() { return this.isAuthenticated(); },
  isAnonymous() { return !this.isAuthenticated(); },
  shouldShowUpgradePrompt() { return false; },
  dismissUpgradePrompt() {}
};

window.Auth = Auth;
