// update-session-rate — owner only.
// Body: { companion_id: string, hourly_rate: number }  // €50–€2,000
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient } from '../_shared/auth.ts';

const MIN = 50, MAX = 2000;

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'owner');
  const { companion_id, hourly_rate } = await req.json();
  if (!companion_id || typeof hourly_rate !== 'number')
    return errorResponse('companion_id and hourly_rate required');
  if (hourly_rate < MIN || hourly_rate > MAX)
    return errorResponse(`hourly_rate must be between ${MIN} and ${MAX}`, 422);

  const admin = adminClient();
  const { data: prev } = await admin.from('therapists').select('hourly_rate').eq('id', companion_id).maybeSingle();
  if (!prev) return errorResponse('companion not found', 404);

  const { data: updated, error } = await admin.from('therapists')
    .update({ hourly_rate, updated_at: new Date().toISOString() })
    .eq('id', companion_id).select('id, hourly_rate').single();
  if (error) return errorResponse(error.message, 500);

  await audit({
    user, req,
    action: 'companion.rate_change',
    target_table: 'therapists',
    target_id: companion_id,
    old_value: { hourly_rate: prev.hourly_rate },
    new_value: { hourly_rate: updated.hourly_rate },
  });
  return jsonResponse({ ok: true, companion: updated });
}));
