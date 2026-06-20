// ═══════════════════════════════════════════════
// ADMIN HANDLERS — TOTP Auth + Bearer Token
// No cookies. No CSRF. Authenticator-based.
// ═══════════════════════════════════════════════

import { verifyTOTPLogin, verifyAdminToken, adminLogout, setupTOTP, verifyTOTPSetup, resetTOTP } from "../adminAuth.js";
import { validateExamConfig }                                                                   from "../examConfigValidator.js";
import { auditLog, getAuditLogs }                                                              from "../auditLogger.js";
import { generateQuestionHash, backfillQuestionHashes }                                        from "../questionHash.js";
import { shuffleQuestionOptions, shuffleAllRows }                                              from "../optionShuffler.js";

function extractToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  const url = new URL(req.url, `http://${req.headers.host}`);
  return url.searchParams.get("token") || null;
}

export async function handleAdminLogin(supabase, req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "6-digit code required" });

    const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const result = await verifyTOTPLogin(supabase, code, ip, userAgent);

    if (!result.success) {
      const status = result.banned ? 429 : result.needsSetup ? 403 : 401;
      return res.status(status).json({
        error: result.error, attemptsRemaining: result.attemptsRemaining,
        retryAfter: result.retryAfter, banned: result.banned || false,
        needsSetup: result.needsSetup || false
      });
    }

    return res.json({ success: true, token: result.token, username: result.username, expiresAt: result.expiresAt });
  } catch (err) {
    console.error("[ADMIN LOGIN] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleAdminVerify(supabase, req, res) {
  try {
    const token = extractToken(req);
    // if (!token) return res.status(401).json({ valid: false, error: "No token" });
    // const result = await verifyAdminToken(supabase, token);
    // if (!result.valid) return res.status(401).json({ valid: false, expired: result.expired || false });
    return res.json({ valid: true, username: 'AdminGuest', adminId: '00000000-0000-0000-0000-000000000000' });
  } catch (err) {
    console.error("[ADMIN VERIFY] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleAdminLogout(supabase, req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const token = extractToken(req);
    if (token) await adminLogout(supabase, token);
    return res.json({ success: true });
  } catch (err) {
    console.error("[ADMIN LOGOUT] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// TOTP Status — lightweight check (no secret generation)
export async function handleTOTPStatus(supabase, req, res) {
  try {
    const { data: admin } = await supabase.from("admin_users").select("id").limit(1).single();
    if (!admin) return res.json({ needsSetup: true });

    const { data: totp } = await supabase.from("admin_totp").select("setup_complete").eq("admin_id", admin.id).single();
    const isSetup = totp?.setup_complete === true;

    return res.json({ needsSetup: !isSetup });
  } catch (err) {
    console.error("[TOTP STATUS] Crash:", err);
    return res.json({ needsSetup: true });
  }
}

// TOTP Setup — LOCKED after initial configuration
export async function handleTOTPSetup(supabase, req, res) {
  try {
    const { data: admin } = await supabase.from("admin_users").select("id, setup_locked").limit(1).single();
    if (!admin) return res.status(500).json({ error: "No admin configured" });

    // If setup is locked, require valid admin token
    if (admin.setup_locked) {
      const token = extractToken(req);
      if (!token) return res.status(403).json({ error: "TOTP setup locked. Authenticate first." });
      const session = await verifyAdminToken(supabase, token);
      if (!session.valid) return res.status(403).json({ error: "TOTP setup locked. Authenticate first." });
    }

    // Check if TOTP is already set up
    const { data: existing } = await supabase.from("admin_totp").select("setup_complete").eq("admin_id", admin.id).single();
    const alreadySetup = existing?.setup_complete === true;

    if (req.method === "GET") {
      // If already set up → require valid admin token to re-setup (reset flow)
      if (alreadySetup) {
        const token = extractToken(req);
        if (!token) return res.status(403).json({ error: "TOTP already configured. Authenticate first to reset." });
        const session = await verifyAdminToken(supabase, token);
        if (!session.valid) return res.status(403).json({ error: "TOTP already configured. Authenticate first to reset." });
        // Authenticated admin wants reset → allow re-setup
        await supabase.from("admin_totp").update({ setup_complete: false }).eq("admin_id", admin.id);
      }
      const result = await setupTOTP(supabase, admin.id);
      return res.json(result);
    }
    if (req.method === "POST") {
      const { code } = req.body || {};
      if (!code) return res.status(400).json({ error: "Code required" });
      const result = await verifyTOTPSetup(supabase, admin.id, code);
      return res.json(result);
    }
    return res.status(405).json({ error: "GET or POST" });
  } catch (err) {
    console.error("[TOTP SETUP] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleAdminData(supabase, req, res) {
  try {
    const token = extractToken(req);
    // Bypassed for no-login mode
    // if (!token) return res.status(401).json({ error: "Unauthorized" });

    // const session = await verifyAdminToken(supabase, token);
    // if (!session.valid) return res.status(401).json({ error: "Session expired" });
    
    // Mock session
    const session = { valid: true, admin: { username: "AdminGuest", id: "00000000-0000-0000-0000-000000000000" } };

    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get("action") || "dashboard";

    switch (action) {
      case "dashboard": {
        const { count: questionCount } = await supabase.from("questions").select("*", { count: "exact", head: true });
        const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
        const { count: testCount } = await supabase.from("test_attempts").select("*", { count: "exact", head: true });

        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count: recentTests } = await supabase.from("test_attempts").select("*", { count: "exact", head: true }).gte("created_at", weekAgo);

        const { data: subjectData } = await supabase.from("questions").select("subject");
        const subjectCounts = {};
        (subjectData || []).forEach(q => { subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1; });

        const { data: loginLog } = await supabase.from("admin_login_log").select("*").order("created_at", { ascending: false }).limit(10);

        return res.json({
          success: true,
          stats: { totalQuestions: questionCount || 0, totalUsers: userCount || 0, totalTests: testCount || 0, recentTests: recentTests || 0, subjectDistribution: subjectCounts },
          loginLog: loginLog || [],
          admin: session.admin.username
        });
      }

      case "questions": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const search = url.searchParams.get("search") || "";
        const subject = url.searchParams.get("subject") || "";
        const limit = 50;
        const offset = (page - 1) * limit;

        let query = supabase.from("questions").select("*", { count: "exact" });
        if (search) query = query.ilike("question_en", `%${search}%`);
        if (subject) query = query.eq("subject", subject);
        query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

        const { data, count, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true, questions: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) });
      }

      case "users": {
        const { data: users, error } = await supabase.from("users").select("id, username, streak, tests_given, created_at").order("created_at", { ascending: false }).limit(100);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true, users: users || [] });
      }

      case "create-question": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const q = req.body || {};
        if (!q.question_en || !Array.isArray(q.options_en) || q.options_en.length < 2) return res.status(400).json({ error: "question_en and options_en[] required" });
        if (typeof q.correct_index !== "number") return res.status(400).json({ error: "correct_index required" });

        // ★ Shuffle options before saving — prevents Option-A always correct
        const shuffled = shuffleQuestionOptions(q.options_en, q.options_hi, q.correct_index);
        const qHash = generateQuestionHash(q.question_en, shuffled.options_en);

        const row = {
          question_en: q.question_en.trim(), question_hi: (q.question_hi || "").trim() || null,
          options_en: shuffled.options_en, options_hi: shuffled.options_hi,
          correct_index: shuffled.correct_index, subject: (q.subject || "general").toLowerCase(),
          difficulty: (q.difficulty || "medium").toLowerCase(), exam: q.exam || null,
          board: q.board || null, topic: q.topic || null, year: q.year || null, source: q.source || null, marks: q.marks || null,
          question_hash: qHash, moderation_status: "approved"
        };

        const { data, error } = await supabase.from("questions").insert([row]).select();
        if (error) {
          if (error.code === "23505" && error.message.includes("question_hash")) {
            return res.status(409).json({ error: "Duplicate question detected", hash: qHash });
          }
          return res.status(500).json({ error: error.message });
        }
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "question", entityId: String(data?.[0]?.id), action: "create", afterState: row, req });
        return res.json({ success: true, question: data?.[0] });
      }

      case "edit-question": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { id, ...updates } = req.body || {};
        if (!id) return res.status(400).json({ error: "Question ID required" });

        // Fetch before-state for audit
        const { data: beforeQ } = await supabase.from("questions").select("*").eq("id", id).single();

        const safeFields = {};
        const allowed = ["question_en", "question_hi", "options_en", "options_hi", "correct_index", "subject", "difficulty", "exam", "board", "topic", "year", "source", "marks"];
        for (const key of allowed) { if (updates[key] !== undefined) safeFields[key] = updates[key]; }

        // Rehash if question text or options changed
        if (safeFields.question_en || safeFields.options_en) {
          safeFields.question_hash = generateQuestionHash(
            safeFields.question_en || beforeQ?.question_en || "",
            safeFields.options_en || beforeQ?.options_en || []
          );
        }

        const { data, error } = await supabase.from("questions").update(safeFields).eq("id", id).select();
        if (error) {
          if (error.code === "23505" && error.message.includes("question_hash")) {
            return res.status(409).json({ error: "Duplicate question detected" });
          }
          return res.status(500).json({ error: error.message });
        }
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "question", entityId: String(id), action: "update", beforeState: beforeQ, afterState: safeFields, req });
        return res.json({ success: true, question: data?.[0] });
      }

      case "delete-question": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { id: delId } = req.body || {};
        if (!delId) return res.status(400).json({ error: "Question ID required" });

        const { data: beforeDel } = await supabase.from("questions").select("question_en, subject, board").eq("id", delId).single();
        const { error } = await supabase.from("questions").delete().eq("id", delId);
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "question", entityId: String(delId), action: "delete", beforeState: beforeDel, req });
        return res.json({ success: true });
      }

      case "bulk-import": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { questions: bulkQ } = req.body || {};
        if (!Array.isArray(bulkQ) || bulkQ.length === 0) return res.status(400).json({ error: "questions[] array required" });
        if (bulkQ.length > 500) return res.status(400).json({ error: "Max 500 questions per import" });

        const rows = []; const rejected = []; const duplicates = [];
        for (const q of bulkQ) {
          const qen = (q.question_en || "").trim();
          const opts = q.options_en || [];
          if (!qen || opts.length < 2) { rejected.push(qen || "(empty)"); continue; }
          const hash = generateQuestionHash(qen, opts);
          rows.push({
            question_en: qen, question_hi: (q.question_hi || "").trim() || null,
            options_en: opts, options_hi: Array.isArray(q.options_hi) ? q.options_hi : null,
            correct_index: q.correct_index ?? 0, subject: (q.subject || "general").toLowerCase(),
            difficulty: (q.difficulty || "medium").toLowerCase(), exam: q.exam || null,
            board: q.board || null, topic: q.topic || null, year: q.year || null, source: q.source || null, marks: q.marks || null,
            question_hash: hash, moderation_status: "approved"
          });
        }

        // ★ Shuffle all options before DB insert (double defence)
        const shuffledRows = shuffleAllRows(rows);

        // Insert in batches to catch duplicates gracefully
        let imported = 0;
        for (const row of shuffledRows) {
          const { error: iErr } = await supabase.from("questions").insert([row]);
          if (iErr) {
            if (iErr.code === "23505") { duplicates.push(row.question_en.substring(0, 60)); }
            else { rejected.push(row.question_en.substring(0, 60)); }
          } else { imported++; }
        }

        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "import", entityId: "bulk", action: "import", metadata: { total: bulkQ.length, imported, rejected: rejected.length, duplicates: duplicates.length }, req });
        return res.json({ success: true, imported, rejected: rejected.length, duplicates: duplicates.length, rejectedItems: rejected.slice(0, 10), duplicateItems: duplicates.slice(0, 10) });
      }

      case "create-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const ex = req.body || {};
        const createValidation = validateExamConfig(ex, false);
        if (!createValidation.valid) return res.status(400).json({ error: "Validation failed", errors: createValidation.errors });

        const examRow = {
          slug: ex.slug.toLowerCase().trim(), board: ex.board || "SSC", exam_name: ex.exam_name.trim(),
          full_name: ex.full_name || null, renderer_type: ex.renderer_type || "ssc", icon: ex.icon || "📝",
          duration_minutes: ex.duration_minutes || 60, total_questions: ex.total_questions || 100,
          marks_per_question: ex.marks_per_question || 1, negative_marking: ex.negative_marking || 0,
          category: ex.category || ex.board || "SSC", sections: ex.sections || [],
          section_locking: !!ex.section_locking, section_timers: !!ex.section_timers,
          calculator_allowed: !!ex.calculator_allowed, palette_type: ex.palette_type || "default",
          keyboard_nav: !!ex.keyboard_nav, description: ex.description || null,
          sort_order: ex.sort_order || 0, is_active: true,
          status: "draft", schema_version: 1, created_by: session.admin.username
        };

        const { data, error } = await supabase.from("exam_configs").insert([examRow]).select();
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: examRow.slug, action: "create", afterState: examRow, req });
        return res.json({ success: true, exam: data?.[0] });
      }

      case "update-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const ux = req.body || {};
        if (!ux.slug) return res.status(400).json({ error: "slug required" });
        const updateValidation = validateExamConfig(ux, true);
        if (!updateValidation.valid) return res.status(400).json({ error: "Validation failed", errors: updateValidation.errors });

        const { data: beforeExam } = await supabase.from("exam_configs").select("*").eq("slug", ux.slug).single();

        const updates = {};
        const allowedExam = ["board", "exam_name", "full_name", "renderer_type", "icon", "duration_minutes", "total_questions", "marks_per_question", "negative_marking", "category", "sections", "section_locking", "section_timers", "calculator_allowed", "palette_type", "keyboard_nav", "description", "sort_order", "is_active"];
        for (const key of allowedExam) { if (ux[key] !== undefined) updates[key] = ux[key]; }
        updates.updated_at = new Date().toISOString();
        // Editing a published exam → revert to draft (must re-publish)
        if (beforeExam?.status === "published") updates.status = "draft";

        const { data, error } = await supabase.from("exam_configs").update(updates).eq("slug", ux.slug).select();
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: ux.slug, action: "update", beforeState: beforeExam, afterState: updates, req });
        return res.json({ success: true, exam: data?.[0] });
      }

      case "delete-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { id: examId } = req.body || {};
        if (!examId) return res.status(400).json({ error: "Exam ID required" });
        const { data: beforeDelExam } = await supabase.from("exam_configs").select("slug, exam_name, status").eq("id", examId).single();
        if (beforeDelExam?.status === "published") return res.status(400).json({ error: "Cannot delete a published exam. Unpublish or archive first." });
        const { error } = await supabase.from("exam_configs").delete().eq("id", examId);
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: String(examId), action: "delete", beforeState: beforeDelExam, req });
        return res.json({ success: true });
      }

      // ── GOVERNANCE ACTIONS ──

      case "publish-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { slug: pubSlug } = req.body || {};
        if (!pubSlug) return res.status(400).json({ error: "slug required" });

        const { data: exam } = await supabase.from("exam_configs").select("*").eq("slug", pubSlug).single();
        if (!exam) return res.status(404).json({ error: "Exam not found" });
        if (exam.status === "published") return res.status(400).json({ error: "Already published" });

        // Validate before publish
        const pubVal = validateExamConfig(exam, false);
        if (!pubVal.valid) return res.status(400).json({ error: "Cannot publish — validation failed", errors: pubVal.errors });

        const newVersion = (exam.schema_version || 0) + 1;

        // Snapshot to version history
        await supabase.from("exam_config_versions").insert([{
          exam_config_id: exam.id, exam_slug: pubSlug,
          config_snapshot: exam, version_number: newVersion,
          change_summary: `Published v${newVersion}`, created_by: session.admin.username
        }]);

        // Update status
        const { data: pub, error } = await supabase.from("exam_configs").update({
          status: "published", published_at: new Date().toISOString(),
          schema_version: newVersion, updated_at: new Date().toISOString()
        }).eq("slug", pubSlug).select();
        if (error) return res.status(500).json({ error: error.message });

        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: pubSlug, action: "publish", metadata: { version: newVersion }, req });
        return res.json({ success: true, exam: pub?.[0], version: newVersion });
      }

      case "unpublish-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { slug: unpubSlug } = req.body || {};
        if (!unpubSlug) return res.status(400).json({ error: "slug required" });
        const { data: up, error } = await supabase.from("exam_configs").update({ status: "draft", updated_at: new Date().toISOString() }).eq("slug", unpubSlug).select();
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: unpubSlug, action: "unpublish", req });
        return res.json({ success: true, exam: up?.[0] });
      }

      case "archive-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { slug: archSlug } = req.body || {};
        if (!archSlug) return res.status(400).json({ error: "slug required" });
        const { data: ar, error } = await supabase.from("exam_configs").update({ status: "archived", updated_at: new Date().toISOString() }).eq("slug", archSlug).select();
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: archSlug, action: "archive", req });
        return res.json({ success: true, exam: ar?.[0] });
      }

      case "duplicate-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { slug: dupSlug } = req.body || {};
        if (!dupSlug) return res.status(400).json({ error: "slug required" });
        const { data: src } = await supabase.from("exam_configs").select("*").eq("slug", dupSlug).single();
        if (!src) return res.status(404).json({ error: "Source exam not found" });

        const newSlug = `${dupSlug}-copy-${Date.now().toString(36)}`;
        const { id: _id, slug: _slug, published_at: _pa, ...rest } = src;
        const { data: dup, error } = await supabase.from("exam_configs").insert([{
          ...rest, slug: newSlug, status: "draft", schema_version: 1,
          exam_name: `${src.exam_name} (Copy)`, created_by: session.admin.username
        }]).select();
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: newSlug, action: "duplicate", metadata: { source: dupSlug }, req });
        return res.json({ success: true, exam: dup?.[0] });
      }

      case "exam-versions": {
        const vSlug = url.searchParams.get("slug");
        if (!vSlug) return res.status(400).json({ error: "slug required" });
        const { data: versions } = await supabase.from("exam_config_versions").select("*").eq("exam_slug", vSlug).order("version_number", { ascending: false }).limit(20);
        return res.json({ success: true, versions: versions || [] });
      }

      case "rollback-exam": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const { slug: rbSlug, version: rbVersion } = req.body || {};
        if (!rbSlug || !rbVersion) return res.status(400).json({ error: "slug and version required" });
        const { data: ver } = await supabase.from("exam_config_versions").select("config_snapshot").eq("exam_slug", rbSlug).eq("version_number", rbVersion).single();
        if (!ver) return res.status(404).json({ error: "Version not found" });
        const snap = ver.config_snapshot;
        const { id: _rid, ...restoreFields } = snap;
        restoreFields.status = "draft";
        restoreFields.updated_at = new Date().toISOString();
        const { data: rb, error } = await supabase.from("exam_configs").update(restoreFields).eq("slug", rbSlug).select();
        if (error) return res.status(500).json({ error: error.message });
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "exam_config", entityId: rbSlug, action: "rollback", metadata: { restoredVersion: rbVersion }, req });
        return res.json({ success: true, exam: rb?.[0] });
      }

      case "audit-logs": {
        const entityType = url.searchParams.get("entity") || undefined;
        const logAction = url.searchParams.get("logAction") || undefined;
        const logs = await getAuditLogs(supabase, { entityType, action: logAction, limit: 100 });
        return res.json({ success: true, logs });
      }

      case "backfill-hashes": {
        if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
        const result = await backfillQuestionHashes(supabase);
        await auditLog(supabase, { adminUsername: session.admin.username, entityType: "question", entityId: "backfill", action: "update", metadata: result, req });
        return res.json({ success: true, ...result });
      }

      // Admin exams list (includes ALL statuses for admin)
      case "all-exams": {
        const { data: allExams, error: aeErr } = await supabase.from("exam_configs").select("*").order("sort_order", { ascending: true });
        if (aeErr) return res.status(500).json({ error: aeErr.message });
        return res.json({ success: true, exams: allExams || [] });
      }

      default:
        return res.status(400).json({ error: "Unknown action: " + action });
    }
  } catch (err) {
    console.error("[ADMIN DATA] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Emergency TOTP Reset — protected by ADMIN_RESET_SECRET env var.
 * POST /api/admin-reset-totp { resetSecret: "..." }
 */
export async function handleAdminResetTOTP(supabase, req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { resetSecret } = req.body || {};
    if (!resetSecret) return res.status(400).json({ error: "resetSecret required" });

    const result = await resetTOTP(supabase, resetSecret);
    const status = result.success ? 200 : 403;
    return res.status(status).json(result);
  } catch (err) {
    console.error("[ADMIN RESET TOTP] Crash:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
