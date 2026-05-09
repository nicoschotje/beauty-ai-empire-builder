// process-payment-proof — auth required.
// multipart/form-data: { booking_id, file }
// Server-side validates file type/size and uploads to private bucket.
import { handle, requireAuth, jsonResponse, audit, errorResponse, adminClient } from '../_shared/auth.ts';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'application/pdf']);

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  // Companions are not allowed near payment proofs.
  if (user.role === 'companion') return errorResponse('forbidden', 403);

  const form = await req.formData();
  const booking_id = String(form.get('booking_id') ?? '');
  const file = form.get('file');
  if (!booking_id || !(file instanceof File)) return errorResponse('booking_id and file required');

  if (file.size > MAX_BYTES) return errorResponse('file too large (max 10MB)', 413);
  if (!ALLOWED.has(file.type)) return errorResponse('unsupported mime type', 415);

  const admin = adminClient();
  const { data: booking } = await admin.from('bookings').select('id, client_id').eq('id', booking_id).maybeSingle();
  if (!booking) return errorResponse('booking not found', 404);
  if (user.role === 'client' && booking.client_id !== user.id) return errorResponse('forbidden', 403);

  const ext = file.name.split('.').pop() || 'bin';
  const path = `${booking_id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from('payment-proofs')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return errorResponse(upErr.message, 500);

  const { data: payment, error: insErr } = await admin.from('payments').insert({
    booking_id,
    amount: 0, // owner sets/edits in admin panel
    method: 'unspecified',
    proof_path: `payment-proofs/${path}`,
    status: 'pending',
  }).select().single();
  if (insErr) return errorResponse(insErr.message, 500);

  await audit({
    user, req,
    action: 'payment.proof_submitted',
    target_table: 'payments',
    target_id: payment.id,
    new_value: { booking_id }, // proof_path intentionally not logged
  });
  return jsonResponse({ ok: true, payment_id: payment.id });
}));
