# Pink Rabbits CMS — Amsterdam Edition

White-label CMS for licensed Dutch adult-services operators. Two isolated
applications on a single Supabase backend.

```
admin.html   Owner Admin Panel    (10 screens, desktop)
portal.html  Companion Portal     (6 screens,  mobile)
```

## Files

```
phase0-migration.sql              Schema, RLS policies, helpers, seed data
admin.html                        Owner SPA
portal.html                       Companion SPA
netlify.toml                      Strict security headers + path blocks
supabase/functions/
  _shared/auth.ts                 Auth, audit, error helpers
  approve-media/
  reject-media/
  publish-companion/
  update-booking-status/
  serve-exclusive-content/
  companion-update-self/
  update-session-rate/
  process-payment-proof/
  action-deletion-request/
```

## Go-live checklist

1. Replace `YOUR_ANON_KEY` in both HTML files with the Supabase anon key.
2. Run `phase0-migration.sql` in the Supabase SQL editor.
3. Verify RLS is on every table:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
   ```
   Every row must show `rowsecurity = true`.
4. Create the following storage buckets, all **private** (no public access):
   `companion-avatars`, `exclusive-content`, `payment-proofs`,
   `media-pending-review`, `age-verification-docs`.
5. Deploy Edge Functions:
   ```sh
   supabase functions deploy --no-verify-jwt approve-media reject-media \
     publish-companion update-booking-status serve-exclusive-content \
     companion-update-self update-session-rate process-payment-proof \
     action-deletion-request
   ```
   (We do JWT verification inside each function via `requireAuth` so we have
   uniform error responses; remove `--no-verify-jwt` if you prefer the
   gateway to enforce it instead.)
6. Promote the operator account:
   ```sql
   UPDATE profiles SET role='owner' WHERE id='[uuid]';
   ```
7. Onboard a companion:
   - Create the auth user (via Supabase dashboard or invitation email).
   - Insert a row in `therapists`.
   - Link them: `UPDATE profiles SET role='companion', companion_id='[therapist uuid]' WHERE id='[user uuid]';`
   - In the admin panel, set their date of birth and click **Verify age**
     after personally inspecting government-issued ID.
8. Run through every gate in the Security Quality Gates section before
   accepting the first client booking.

## Security model

- **Service-role key never appears in any HTML file.** It is only used inside
  Edge Functions, which all start with `requireAuth` + `requireRole`.
- **All tables have RLS enabled.** Helper SQL functions `get_my_role()` and
  `get_my_companion_id()` are used in policies.
- **Audit log is append-only:** there are no UPDATE or DELETE policies on
  `audit_log`. Sensitive fields are redacted via `redact()` in
  `_shared/auth.ts` before logging.
- **Companions cannot see payments.** No payments policy admits the
  `companion` role.
- **Companions cannot escalate role.** `profiles_own_update` enforces that
  the new `role` value equals the current one.
- **Booking transitions are server-validated** in
  `update-booking-status/index.ts` against an allow-list.
- **Age verification is a hard gate** in `publish-companion` and
  `companion-update-self` (412 Precondition Failed when missing).
- **Consent is required server-side** to insert a media row
  (`media_companion_submit` policy enforces `consent_confirmed = true`).
- **Exclusive content is served via 15-minute signed URLs only**, with each
  access logged to `media_access_log`. The signed URL carries a `wm=<client>`
  marker for downstream watermarking.
- **GDPR Art. 17 erasure** purges media files from storage, deletes media
  rows, and anonymises the companion record while retaining audit entries.

## Localisation

All currency uses `Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })`.
Demo seed data covers Amsterdam transport zones and Dutch payment methods
(iDEAL, Tikkie, Bank Transfer, Cash).
