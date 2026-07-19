// ============================================
// EXPERIMENT ENGINE — Doc 16 §11, §26C
// A/B testing with sticky variant assignment.
//
// Pattern:
//   Page checks variant → Engine assigns →
//   Sticky in localStorage + DB → Track exposure
//
// Never show different variants on page refresh.
// ============================================

const ExperimentEngine = {

  STORAGE_KEY: 'mtp_experiments',

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  /**
   * Get variant for a user in an experiment.
   * Returns sticky assignment (same variant on every call).
   * @param {string} experimentId - UUID of the experiment
   * @param {Array} variants - [{id, name, weight}, ...] from DB
   * @returns {string} variant id (e.g., 'control' or 'variant_a')
   */
  getVariant(experimentId, variants = null) {
    // 1. Check localStorage for sticky assignment
    const stored = this._getStored(experimentId);
    if (stored) return stored;

    // 2. No stored assignment → assign new variant
    const defaultVariants = variants || [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant_a', name: 'Variant A', weight: 50 }
    ];

    const assigned = this._assignVariant(defaultVariants);
    this._storeAssignment(experimentId, assigned);

    // 3. Track exposure via EventBus
    this.trackExposure(experimentId, assigned);

    return assigned;
  },

  /**
   * Check if user is in a specific variant.
   * @param {string} experimentId
   * @param {string} variantName - e.g., 'variant_a'
   * @returns {boolean}
   */
  isInVariant(experimentId, variantName) {
    const current = this.getVariant(experimentId);
    return current === variantName;
  },

  /**
   * Track that user was exposed to experiment variant.
   * @param {string} experimentId
   * @param {string} variant
   */
  trackExposure(experimentId, variant) {
    if (typeof EventBus !== 'undefined') {
      EventBus.emit(EventBus.EVENTS.EXPERIMENT_EXPOSED, {
        experimentId,
        variant,
        timestamp: Date.now()
      });
    }
  },

  /**
   * Track conversion event for an experiment.
   * @param {string} experimentId
   * @param {object} data - Additional conversion data
   */
  trackConversion(experimentId, data = {}) {
    const variant = this._getStored(experimentId);
    if (!variant) return; // Not enrolled

    if (typeof EventBus !== 'undefined') {
      EventBus.emit(EventBus.EVENTS.EXPERIMENT_CONVERTED, {
        experimentId,
        variant,
        ...data,
        timestamp: Date.now()
      });
    }
  },

  /**
   * Get all active experiment assignments for diagnostics.
   * @returns {object} { experimentId: variant, ... }
   */
  getAssignments() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Clear all experiment assignments (for testing/reset).
   */
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
  },


  // ═══════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════

  /**
   * Weighted random variant assignment.
   * @param {Array} variants - [{id, weight}, ...]
   * @returns {string} chosen variant id
   */
  _assignVariant(variants) {
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const v of variants) {
      random -= (v.weight || 1);
      if (random <= 0) return v.id;
    }

    // Fallback: first variant
    return variants[0].id;
  },

  /** Get stored assignment from localStorage */
  _getStored(experimentId) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const assignments = raw ? JSON.parse(raw) : {};
      return assignments[experimentId] || null;
    } catch (e) {
      return null;
    }
  },

  /** Store assignment in localStorage (sticky) */
  _storeAssignment(experimentId, variant) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const assignments = raw ? JSON.parse(raw) : {};
      assignments[experimentId] = variant;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assignments));
    } catch (e) {}
  }
};

window.ExperimentEngine = ExperimentEngine;
