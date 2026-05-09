// reject-media — owner only.
// Body: { media_id: string, reason: string }
// Deletes file from storage and audits.
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient, redact } from '../_shared/auth.ts';

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'owner');
  const { media_id, reason } = await req.json();
  if (!media_id || !reason) return errorResponse('media_id and reason required');

  const admin = adminClient();
  const { data: prev } = await admin.from('therapist_media').select('*').eq('id', media_id).maybeSingle();
  if (!prev) return errorResponse('media not found', 404);

  // Try to delete from storage (best-effort: bucket inferred from path prefix)
  if (prev.storage_path) {
    const [bucket, ...rest] = prev.storage_path.split('/');
    const path = rest.join('/');
    if (bucket && path) {
      await admin.storage.from(bucket).remove([path]);
    }
  }

  const { error } = await admin.from('therapist_media').delete().eq('id', media_id);
  if (error) return errorResponse(error.message, 500);

  await audit({
    user, req,
    action: 'media.reject',
    target_table: 'therapist_media',
    target_id: media_id,
    old_value: redact(prev),
    new_value: { rejection_reason: reason },
  });
  return jsonResponse({ ok: true });
}));
