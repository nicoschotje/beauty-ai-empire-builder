// publish-companion — owner only.
// Body: { companion_id: string, publish: boolean }
// Refuses to publish a companion that is not age_verified.
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient, redact } from '../_shared/auth.ts';

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'owner');
  const { companion_id, publish } = await req.json();
  if (!companion_id || typeof publish !== 'boolean') return errorResponse('companion_id and publish required');

  const admin = adminClient();
  const { data: prev } = await admin.from('therapists').select('*').eq('id', companion_id).maybeSingle();
  if (!prev) return errorResponse('companion not found', 404);

  if (publish && !prev.age_verified)
    return errorResponse('age_verification_required', 412);

  const { data: updated, error } = await admin.from('therapists').update({
    is_active: publish,
    is_online: publish ? prev.is_online : false,
    updated_at: new Date().toISOString(),
  }).eq('id', companion_id).select().single();
  if (error) return errorResponse(error.message, 500);

  await audit({
    user, req,
    action: publish ? 'companion.publish' : 'companion.unpublish',
    target_table: 'therapists',
    target_id: companion_id,
    old_value: redact(prev),
    new_value: redact(updated),
  });
  return jsonResponse({ ok: true, companion: updated });
}));
