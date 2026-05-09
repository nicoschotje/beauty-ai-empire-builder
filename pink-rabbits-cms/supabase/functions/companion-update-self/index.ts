// companion-update-self — companion only.
// Whitelisted fields: bio, specialties, is_online.
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient, redact } from '../_shared/auth.ts';

const ALLOWED_FIELDS = new Set(['bio', 'specialties', 'is_online']);

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'companion');
  if (!user.companion_id) return errorResponse('no companion linked', 422);

  const body = await req.json();
  if (!body || typeof body !== 'object') return errorResponse('body required');

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(k)) return errorResponse(`field not allowed: ${k}`, 422);
    update[k] = v;
  }
  if (Object.keys(update).length === 0) return errorResponse('no allowed fields supplied');

  if ('bio' in update && typeof update.bio !== 'string') return errorResponse('bio must be string');
  if ('bio' in update && (update.bio as string).length > 2000) return errorResponse('bio too long');
  if ('specialties' in update && !Array.isArray(update.specialties)) return errorResponse('specialties must be array');
  if ('is_online' in update && typeof update.is_online !== 'boolean') return errorResponse('is_online must be bool');

  const admin = adminClient();
  const { data: prev } = await admin.from('therapists').select('*').eq('id', user.companion_id).maybeSingle();
  if (!prev) return errorResponse('companion not found', 404);

  // Hard gate: companion cannot mark themselves available unless age verified.
  if (update.is_online === true && !prev.age_verified)
    return errorResponse('age_verification_required', 412);

  update.updated_at = new Date().toISOString();
  const { data: updated, error } = await admin
    .from('therapists').update(update).eq('id', user.companion_id).select().single();
  if (error) return errorResponse(error.message, 500);

  await audit({
    user, req,
    action: 'companion.self_update',
    target_table: 'therapists',
    target_id: user.companion_id,
    old_value: redact(prev),
    new_value: redact(updated),
  });
  return jsonResponse({ ok: true, companion: updated });
}));
