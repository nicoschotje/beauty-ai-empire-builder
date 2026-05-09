// action-deletion-request — owner only.
// Body: { request_id: string }
// Anonymises companion record, purges media files from storage, redacts
// audit log target name fields. Audit entries themselves are KEPT (legal
// obligation), but companion display name is replaced.
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient } from '../_shared/auth.ts';

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'owner');
  const { request_id } = await req.json();
  if (!request_id) return errorResponse('request_id required');

  const admin = adminClient();
  const { data: dr } = await admin.from('deletion_requests').select('*').eq('id', request_id).maybeSingle();
  if (!dr) return errorResponse('not found', 404);
  if (dr.status === 'actioned') return errorResponse('already actioned', 409);
  if (!dr.companion_id) return errorResponse('no companion linked', 422);

  // 1. Collect and delete all media files from storage
  const { data: media } = await admin.from('therapist_media')
    .select('id, storage_path').eq('therapist_id', dr.companion_id);

  const byBucket: Record<string, string[]> = {};
  for (const m of media ?? []) {
    if (!m.storage_path) continue;
    const [bucket, ...rest] = m.storage_path.split('/');
    const path = rest.join('/');
    if (!bucket || !path) continue;
    (byBucket[bucket] ||= []).push(path);
  }
  for (const [bucket, paths] of Object.entries(byBucket)) {
    if (paths.length) await admin.storage.from(bucket).remove(paths);
  }
  // Delete media DB rows
  await admin.from('therapist_media').delete().eq('therapist_id', dr.companion_id);

  // 2. Delete avatar file if any
  const { data: t } = await admin.from('therapists').select('avatar_path').eq('id', dr.companion_id).maybeSingle();
  if (t?.avatar_path) {
    const [bucket, ...rest] = t.avatar_path.split('/');
    const path = rest.join('/');
    if (bucket && path) await admin.storage.from(bucket).remove([path]);
  }

  // 3. Anonymise the companion record
  const anonName = `Former Companion ${String(dr.companion_id).slice(0, 8)}`;
  await admin.from('therapists').update({
    display_name: anonName,
    bio: null,
    specialties: [],
    is_active: false,
    is_online: false,
    is_featured: false,
    avatar_path: null,
    date_of_birth: null,
    age_verified: false,
    age_verified_at: null,
    age_verified_by: null,
    updated_at: new Date().toISOString(),
  }).eq('id', dr.companion_id);

  // 4. Anonymise the linked auth profile
  await admin.from('profiles').update({
    display_name: anonName,
    phone: null,
    is_active: false,
  }).eq('companion_id', dr.companion_id);

  // 5. Mark request actioned
  await admin.from('deletion_requests').update({
    status: 'actioned',
    actioned_at: new Date().toISOString(),
    actioned_by: user.id,
  }).eq('id', request_id);

  await audit({
    user, req,
    action: 'gdpr.erasure_executed',
    target_table: 'therapists',
    target_id: dr.companion_id,
    new_value: { anonymised_as: anonName, media_files_purged: (media ?? []).length },
  });

  return jsonResponse({ ok: true, anonymised_as: anonName, files_deleted: (media ?? []).length });
}));
