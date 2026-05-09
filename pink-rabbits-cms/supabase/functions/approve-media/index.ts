// approve-media — owner only.
// Body: { media_id: string, visibility?: 'public'|'for_sale', price?: number }
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient, redact } from '../_shared/auth.ts';

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'owner');
  const { media_id, visibility, price } = await req.json();
  if (!media_id) return errorResponse('media_id required');
  const target_visibility = visibility ?? 'public';
  if (!['public', 'for_sale'].includes(target_visibility))
    return errorResponse('invalid visibility');
  if (target_visibility === 'for_sale' && (typeof price !== 'number' || price <= 0))
    return errorResponse('for_sale requires positive price');

  const admin = adminClient();
  const { data: prev } = await admin.from('therapist_media').select('*').eq('id', media_id).maybeSingle();
  if (!prev) return errorResponse('media not found', 404);

  const { data: updated, error } = await admin.from('therapist_media').update({
    approved: true,
    visibility: target_visibility,
    price: target_visibility === 'for_sale' ? price : 0,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    rejection_reason: null,
  }).eq('id', media_id).select().single();
  if (error) return errorResponse(error.message, 500);

  await audit({
    user, req,
    action: 'media.approve',
    target_table: 'therapist_media',
    target_id: media_id,
    old_value: redact(prev),
    new_value: redact(updated),
  });
  return jsonResponse({ ok: true, media: updated });
}));
