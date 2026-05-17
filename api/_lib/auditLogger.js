// ═══════════════════════════════════════════════
// AUDIT LOGGER — Immutable trail for all admin mutations
// Every platform mutation MUST be logged via this module.
// ═══════════════════════════════════════════════

/**
 * Log an admin action to admin_audit_logs.
 * 
 * @param {object} supabase  - Service-role Supabase client
 * @param {object} params
 * @param {string} params.adminUsername  - Who performed the action
 * @param {string} params.entityType    - exam_config|question|user|import|reward|admin
 * @param {string} params.entityId      - ID or slug of the entity
 * @param {string} params.action        - create|update|delete|publish|unpublish|archive|import|rollback|duplicate
 * @param {object} [params.beforeState] - Snapshot before mutation
 * @param {object} [params.afterState]  - Snapshot after mutation
 * @param {object} [params.metadata]    - Extra context (import count, version number, etc.)
 * @param {object} [params.req]         - Express/Vercel request for IP + UA
 */
export async function auditLog(supabase, {
  adminUsername,
  entityType,
  entityId,
  action,
  beforeState = null,
  afterState = null,
  metadata = null,
  req = null
}) {
  try {
    const ip = req
      ? (req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "unknown")
      : null;
    const userAgent = req ? (req.headers?.["user-agent"] || "unknown") : null;

    await supabase.from("admin_audit_logs").insert([{
      admin_username: adminUsername || "system",
      entity_type: entityType,
      entity_id: String(entityId || ""),
      action,
      before_state: beforeState,
      after_state: afterState,
      metadata,
      ip_address: ip,
      user_agent: userAgent
    }]);
  } catch (err) {
    // Audit logging MUST NOT crash the parent operation.
    // Log to console and continue.
    console.error("[AUDIT] Failed to write audit log:", err.message, {
      entityType, entityId, action
    });
  }
}

/**
 * Fetch recent audit log entries for the admin dashboard.
 * @param {object} supabase
 * @param {object} [filters]
 * @param {string} [filters.entityType]
 * @param {string} [filters.action]
 * @param {number} [filters.limit]
 * @returns {Promise<Array>}
 */
export async function getAuditLogs(supabase, filters = {}) {
  let query = supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit || 50);

  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);

  const { data, error } = await query;
  if (error) {
    console.error("[AUDIT] Failed to fetch logs:", error.message);
    return [];
  }
  return data || [];
}
