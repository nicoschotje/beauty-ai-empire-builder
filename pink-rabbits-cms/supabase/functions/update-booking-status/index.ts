// update-booking-status — owner only.
// Body: { booking_id: string, status: string }
// Validates legal status transitions.
import { handle, requireAuth, requireRole, jsonResponse, audit, errorResponse, adminClient, redact } from '../_shared/auth.ts';

const ALLOWED: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['en_route', 'cancelled'],
  en_route:   ['in_session', 'cancelled'],
  in_session: ['completed'],
  completed:  [],
  cancelled:  [],
};

Deno.serve((req) => handle(req, async () => {
  const user = await requireAuth(req);
  requireRole(user, 'owner');
  const { booking_id, status } = await req.json();
  if (!booking_id || !status) return errorResponse('booking_id and status required');

  const admin = adminClient();
  const { data: prev } = await admin.from('bookings').select('*').eq('id', booking_id).maybeSingle();
  if (!prev) return errorResponse('booking not found', 404);

  const allowed = ALLOWED[prev.status] ?? [];
  if (!allowed.includes(status))
    return errorResponse(`illegal transition: ${prev.status} -> ${status}`, 422);

  const { data: updated, error } = await admin.from('bookings').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', booking_id).select().single();
  if (error) return errorResponse(error.message, 500);

  await audit({
    user, req,
    action: 'booking.status_change',
    target_table: 'bookings',
    target_id: booking_id,
    old_value: { status: prev.status },
    new_value: { status: updated.status },
  });
  return jsonResponse({ ok: true, booking: updated });
}));
