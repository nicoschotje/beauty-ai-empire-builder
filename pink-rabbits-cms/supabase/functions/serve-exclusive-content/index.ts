// serve-exclusive-content — verifies content_access, returns short-lived signed URL.
// Body: { media_id: string }
// Note: true watermarking requires server-side image processing. We stamp
// the access into media_access_log and use a 15-minute signed URL with a
// query param embedding the client ID for downstream watermarking workers.
import { handle, requireAuth, jsonResponse, errorResponse, adminClient, clientIp, userAgent } from '../_shared/auth.ts';

const SIGN_TTL_SECONDS = 15 * 60;

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  const { media_id } = await req.json();
  if (!media_id) return errorResponse('media_id required');

  const admin = adminClient();
  const { data: media } = await admin
    .from('therapist_media')
    .select('id, storage_path, visibility, approved')
    .eq('id', media_id)
    .maybeSingle();
  if (!media) return errorResponse('not found', 404);
  if (!media.approved) return errorResponse('forbidden', 403);

  // Permission check: owner OR approved-public OR client with content_access for for_sale
  let allowed = false;
  if (user.role === 'owner') allowed = true;
  else if (media.visibility === 'public') allowed = true;
  else if (media.visibility === 'for_sale' && user.role === 'client') {
    const { data: access } = await admin
      .from('content_access')
      .select('client_id')
      .eq('client_id', user.id)
      .eq('media_id', media_id)
      .maybeSingle();
    allowed = !!access;
  }
  if (!allowed) return errorResponse('forbidden', 403);

  const [bucket, ...rest] = (media.storage_path ?? '').split('/');
  const path = rest.join('/');
  if (!bucket || !path) return errorResponse('bad storage path', 500);

  const { data: signed, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, SIGN_TTL_SECONDS, {
      // Hint for a downstream watermarking transformer
      transform: undefined,
    });
  if (error || !signed) return errorResponse(error?.message ?? 'sign failed', 500);

  const expiry = new Date(Date.now() + SIGN_TTL_SECONDS * 1000).toISOString();

  await admin.from('media_access_log').insert({
    media_id,
    client_id: user.id,
    ip_address: clientIp(req),
    user_agent: userAgent(req),
    signed_url_expiry: expiry,
  });

  // Append client id as a marker for any CDN watermarking layer
  const url = `${signed.signedUrl}&wm=${encodeURIComponent(user.id)}`;
  return jsonResponse({ url, expires_at: expiry });
}));
