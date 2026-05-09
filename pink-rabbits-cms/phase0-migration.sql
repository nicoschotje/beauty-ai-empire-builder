-- =====================================================================
-- PINK RABBITS CMS — AMSTERDAM EDITION
-- Phase 0 Migration: Security Baseline
-- =====================================================================
-- Apply this BEFORE deploying any HTML or Edge Function.
-- After running, verify with:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
-- Every row must show rowsecurity = true.
-- =====================================================================

-- ---------- EXTENSIONS ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- CORE TABLES ----------

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  phone        TEXT,
  role         TEXT DEFAULT 'client'
                 CHECK (role IN ('owner','companion','client')),
  companion_id UUID,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  terms_accepted     BOOLEAN     DEFAULT false,
  terms_accepted_at  TIMESTAMPTZ,
  terms_version      TEXT,
  is_active    BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS therapists (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name    TEXT NOT NULL,
  bio             TEXT,
  specialties     TEXT[] DEFAULT '{}',
  hourly_rate     NUMERIC(10,2) NOT NULL CHECK (hourly_rate BETWEEN 50 AND 2000),
  rating          NUMERIC(2,1) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  is_featured     BOOLEAN DEFAULT false,
  is_online       BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  avatar_path     TEXT,
  date_of_birth   DATE,
  age_verified    BOOLEAN DEFAULT false,
  age_verified_at TIMESTAMPTZ,
  age_verified_by UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_companion_id_fkey,
  ADD CONSTRAINT profiles_companion_id_fkey
    FOREIGN KEY (companion_id) REFERENCES therapists(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS therapist_schedules (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id  UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  slot_start    TIMESTAMPTZ NOT NULL,
  slot_end      TIMESTAMPTZ NOT NULL,
  is_available  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS therapist_media (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id          UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  storage_path          TEXT NOT NULL,
  media_type            TEXT NOT NULL CHECK (media_type IN ('image','video')),
  visibility            TEXT NOT NULL DEFAULT 'pending_review'
                          CHECK (visibility IN ('pending_review','public','for_sale','archived')),
  price                 NUMERIC(10,2) DEFAULT 0,
  approved              BOOLEAN DEFAULT false,
  submitted_at          TIMESTAMPTZ DEFAULT now(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES auth.users(id),
  rejection_reason      TEXT,
  consent_confirmed     BOOLEAN DEFAULT false,
  consent_confirmed_at  TIMESTAMPTZ,
  consent_ip_address    INET,
  caption               TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     UUID REFERENCES auth.users(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_min  INTEGER NOT NULL DEFAULT 60,
  zone_id       UUID,
  transport_fee NUMERIC(10,2) DEFAULT 0,
  session_total NUMERIC(10,2) DEFAULT 0,
  total_amount  NUMERIC(10,2) DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','en_route','in_session','completed','cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_companions (
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  therapist_id  UUID NOT NULL REFERENCES therapists(id),
  PRIMARY KEY (booking_id, therapist_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  amount          NUMERIC(10,2) NOT NULL,
  method          TEXT NOT NULL,
  reference       TEXT,
  proof_path      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','rejected')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id    UUID NOT NULL REFERENCES bookings(id),
  therapist_id  UUID NOT NULL REFERENCES therapists(id),
  client_id     UUID NOT NULL REFERENCES auth.users(id),
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transport_tiers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_label  TEXT NOT NULL,
  zone_name   TEXT NOT NULL,
  areas       TEXT,
  fare        NUMERIC(10,2) NOT NULL,
  sort_order  INTEGER DEFAULT 0
);

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_zone_id_fkey,
  ADD CONSTRAINT bookings_zone_id_fkey
    FOREIGN KEY (zone_id) REFERENCES transport_tiers(id);

CREATE TABLE IF NOT EXISTS payment_methods (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content_purchases (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id    UUID NOT NULL REFERENCES auth.users(id),
  media_id     UUID NOT NULL REFERENCES therapist_media(id),
  amount       NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_access (
  client_id    UUID NOT NULL REFERENCES auth.users(id),
  media_id     UUID NOT NULL REFERENCES therapist_media(id) ON DELETE CASCADE,
  granted_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (client_id, media_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  performed_by  UUID REFERENCES auth.users(id),
  role          TEXT,
  action        TEXT NOT NULL,
  target_table  TEXT,
  target_id     UUID,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_access_log (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id          UUID REFERENCES therapist_media(id),
  client_id         UUID REFERENCES auth.users(id),
  accessed_at       TIMESTAMPTZ DEFAULT now(),
  ip_address        INET,
  user_agent        TEXT,
  signed_url_expiry TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT NOT NULL,
  ip_address    INET,
  success       BOOLEAN NOT NULL,
  attempted_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deletion_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  companion_id  UUID REFERENCES therapists(id),
  requested_by  UUID REFERENCES auth.users(id),
  requested_at  TIMESTAMPTZ DEFAULT now(),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','actioned')),
  reason        TEXT,
  actioned_at   TIMESTAMPTZ,
  actioned_by   UUID REFERENCES auth.users(id)
);

-- ---------- INDEXES ----------
CREATE INDEX IF NOT EXISTS idx_bookings_client       ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled    ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_media_therapist       ON therapist_media(therapist_id);
CREATE INDEX IF NOT EXISTS idx_media_visibility      ON therapist_media(visibility, approved);
CREATE INDEX IF NOT EXISTS idx_audit_created         ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email   ON auth_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_status       ON deletion_requests(status, requested_at DESC);

-- ---------- HELPER FUNCTIONS ----------

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_companion_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT companion_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_account_locked(target_email TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COUNT(*) >= 5
  FROM auth_attempts
  WHERE email = target_email
    AND success = false
    AND attempted_at > now() - INTERVAL '10 minutes'
$$;

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------- ENABLE RLS ----------
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_companions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_tiers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_purchases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_access_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests   ENABLE ROW LEVEL SECURITY;

-- ---------- POLICIES ----------

-- profiles
DROP POLICY IF EXISTS profiles_own           ON profiles;
DROP POLICY IF EXISTS profiles_owner_write   ON profiles;
DROP POLICY IF EXISTS profiles_own_update    ON profiles;
CREATE POLICY profiles_own ON profiles
  FOR SELECT USING (id = auth.uid() OR get_my_role() = 'owner');
CREATE POLICY profiles_owner_write ON profiles
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');
CREATE POLICY profiles_own_update ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- therapists
DROP POLICY IF EXISTS therapists_read                   ON therapists;
DROP POLICY IF EXISTS therapists_companion_self_update  ON therapists;
DROP POLICY IF EXISTS therapists_owner_all              ON therapists;
CREATE POLICY therapists_read ON therapists
  FOR SELECT USING (
    get_my_role() = 'owner'
    OR id = get_my_companion_id()
    OR (get_my_role() = 'client' AND is_active = true)
  );
CREATE POLICY therapists_companion_self_update ON therapists
  FOR UPDATE USING (id = get_my_companion_id())
  WITH CHECK (id = get_my_companion_id());
CREATE POLICY therapists_owner_all ON therapists
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- therapist_schedules
DROP POLICY IF EXISTS schedules_read       ON therapist_schedules;
DROP POLICY IF EXISTS schedules_owner_all  ON therapist_schedules;
CREATE POLICY schedules_read ON therapist_schedules
  FOR SELECT USING (
    get_my_role() = 'owner'
    OR therapist_id = get_my_companion_id()
    OR get_my_role() = 'client'
  );
CREATE POLICY schedules_owner_all ON therapist_schedules
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- therapist_media
DROP POLICY IF EXISTS media_client_approved  ON therapist_media;
DROP POLICY IF EXISTS media_purchased        ON therapist_media;
DROP POLICY IF EXISTS media_companion_submit ON therapist_media;
DROP POLICY IF EXISTS media_companion_read   ON therapist_media;
DROP POLICY IF EXISTS media_owner_all        ON therapist_media;

CREATE POLICY media_client_approved ON therapist_media
  FOR SELECT USING (
    get_my_role() = 'owner'
    OR (get_my_role() = 'companion' AND therapist_id = get_my_companion_id())
    OR (get_my_role() = 'client' AND visibility = 'public' AND approved = true)
  );
CREATE POLICY media_purchased ON therapist_media
  FOR SELECT USING (
    get_my_role() = 'client'
    AND visibility = 'for_sale'
    AND approved = true
    AND EXISTS (
      SELECT 1 FROM content_access
      WHERE client_id = auth.uid() AND media_id = therapist_media.id
    )
  );
CREATE POLICY media_companion_submit ON therapist_media
  FOR INSERT WITH CHECK (
    get_my_role() = 'companion'
    AND therapist_id = get_my_companion_id()
    AND approved = false
    AND consent_confirmed = true
    AND visibility = 'pending_review'
  );
CREATE POLICY media_owner_all ON therapist_media
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- bookings
DROP POLICY IF EXISTS bookings_client_own     ON bookings;
DROP POLICY IF EXISTS bookings_companion_view ON bookings;
DROP POLICY IF EXISTS bookings_owner_all      ON bookings;
DROP POLICY IF EXISTS bookings_client_insert  ON bookings;

CREATE POLICY bookings_client_own ON bookings
  FOR SELECT USING (client_id = auth.uid() OR get_my_role() = 'owner');
CREATE POLICY bookings_companion_view ON bookings
  FOR SELECT USING (
    get_my_role() = 'companion'
    AND EXISTS (
      SELECT 1 FROM booking_companions bc
      WHERE bc.booking_id = bookings.id
      AND bc.therapist_id = get_my_companion_id()
    )
  );
CREATE POLICY bookings_client_insert ON bookings
  FOR INSERT WITH CHECK (client_id = auth.uid() AND get_my_role() = 'client');
CREATE POLICY bookings_owner_all ON bookings
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- booking_companions
DROP POLICY IF EXISTS bc_read       ON booking_companions;
DROP POLICY IF EXISTS bc_owner_all  ON booking_companions;
CREATE POLICY bc_read ON booking_companions
  FOR SELECT USING (
    get_my_role() = 'owner'
    OR therapist_id = get_my_companion_id()
    OR EXISTS (SELECT 1 FROM bookings WHERE id = booking_companions.booking_id AND client_id = auth.uid())
  );
CREATE POLICY bc_owner_all ON booking_companions
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- payments (companions see NOTHING)
DROP POLICY IF EXISTS payments_client_own  ON payments;
DROP POLICY IF EXISTS payments_owner_all   ON payments;
CREATE POLICY payments_client_own ON payments
  FOR SELECT USING (
    get_my_role() = 'owner'
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE id = payments.booking_id AND client_id = auth.uid()
    )
  );
CREATE POLICY payments_owner_all ON payments
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- reviews
DROP POLICY IF EXISTS reviews_read         ON reviews;
DROP POLICY IF EXISTS reviews_client_write ON reviews;
DROP POLICY IF EXISTS reviews_owner_all    ON reviews;
CREATE POLICY reviews_read ON reviews
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY reviews_client_write ON reviews
  FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY reviews_owner_all ON reviews
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- transport_tiers
DROP POLICY IF EXISTS tiers_authed_read ON transport_tiers;
DROP POLICY IF EXISTS tiers_owner_write ON transport_tiers;
CREATE POLICY tiers_authed_read ON transport_tiers
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY tiers_owner_write ON transport_tiers
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- payment_methods
DROP POLICY IF EXISTS methods_authed_read ON payment_methods;
DROP POLICY IF EXISTS methods_owner_all   ON payment_methods;
CREATE POLICY methods_authed_read ON payment_methods
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY methods_owner_all ON payment_methods
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- content_purchases
DROP POLICY IF EXISTS purchases_client_own ON content_purchases;
DROP POLICY IF EXISTS purchases_owner_all  ON content_purchases;
CREATE POLICY purchases_client_own ON content_purchases
  FOR SELECT USING (client_id = auth.uid() OR get_my_role() = 'owner');
CREATE POLICY purchases_owner_all ON content_purchases
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- content_access
DROP POLICY IF EXISTS access_client_own ON content_access;
DROP POLICY IF EXISTS access_owner_all  ON content_access;
CREATE POLICY access_client_own ON content_access
  FOR SELECT USING (client_id = auth.uid() OR get_my_role() = 'owner');
CREATE POLICY access_owner_all ON content_access
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- audit_log: append-only, owner reads
DROP POLICY IF EXISTS audit_insert      ON audit_log;
DROP POLICY IF EXISTS audit_owner_read  ON audit_log;
CREATE POLICY audit_insert ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY audit_owner_read ON audit_log
  FOR SELECT USING (get_my_role() = 'owner');
-- Note: NO update/delete policies. Append-only.

-- media_access_log
DROP POLICY IF EXISTS mal_insert     ON media_access_log;
DROP POLICY IF EXISTS mal_owner_read ON media_access_log;
CREATE POLICY mal_insert ON media_access_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY mal_owner_read ON media_access_log
  FOR SELECT USING (get_my_role() = 'owner');

-- auth_attempts
DROP POLICY IF EXISTS attempts_insert    ON auth_attempts;
DROP POLICY IF EXISTS attempts_owner_read ON auth_attempts;
CREATE POLICY attempts_insert ON auth_attempts
  FOR INSERT WITH CHECK (true);
CREATE POLICY attempts_owner_read ON auth_attempts
  FOR SELECT USING (get_my_role() = 'owner');

-- deletion_requests
DROP POLICY IF EXISTS deletion_own        ON deletion_requests;
DROP POLICY IF EXISTS deletion_companion_read ON deletion_requests;
DROP POLICY IF EXISTS deletion_owner_all  ON deletion_requests;
CREATE POLICY deletion_own ON deletion_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND get_my_role() = 'companion'
    AND companion_id = get_my_companion_id()
  );
CREATE POLICY deletion_companion_read ON deletion_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR get_my_role() = 'owner'
  );
CREATE POLICY deletion_owner_all ON deletion_requests
  FOR ALL USING (get_my_role() = 'owner') WITH CHECK (get_my_role() = 'owner');

-- =====================================================================
-- DEMO SEED DATA (Amsterdam)
-- =====================================================================
-- Transport zones
INSERT INTO transport_tiers (zone_label, zone_name, areas, fare, sort_order) VALUES
  ('Zone 1','Centrum',     'Amsterdam Centrum, De Wallen',          25, 1),
  ('Zone 2','Canal Ring',  'Jordaan, Oud-West, De Pijp',            35, 2),
  ('Zone 3','Greater AMS', 'Oost, Noord, Nieuw-West, Zuid',         50, 3),
  ('Zone 4','Metro Area',  'Amstelveen, Diemen, Zaandam',           75, 4),
  ('Zone 5','Extended',    'Haarlem, Utrecht, Leiden',             120, 5)
ON CONFLICT DO NOTHING;

-- Payment methods
INSERT INTO payment_methods (name, description, is_active, sort_order) VALUES
  ('iDEAL',         'Bank transfer via iDEAL — standard Dutch payment',  true, 1),
  ('Tikkie',        'Tikkie payment request — send to client',           true, 2),
  ('Bank Transfer', 'IBAN transfer — include booking reference',         true, 3),
  ('Cash',          'Exact amount on arrival — envelope please',         true, 4)
ON CONFLICT DO NOTHING;

-- Companions (demo data — operator must run age verification before publishing)
INSERT INTO therapists (display_name, bio, specialties, hourly_rate, rating, review_count, is_featured, is_online, is_active) VALUES
  ('Lucas',  'Experienced Swedish and deep tissue specialist.',           ARRAY['Swedish Massage','Deep Tissue'],     200, 4.9, 124, true,  true,  true),
  ('Thomas', 'Tantric and relaxation focused sessions.',                  ARRAY['Tantric Massage','Relaxation'],      250, 5.0,  87, false, true,  true),
  ('Daan',   'Sports recovery, mobility and stretching.',                 ARRAY['Sports Massage','Stretching'],       180, 4.8, 156, false, true,  true),
  ('Finn',   'Sensual and GFE companion.',                                ARRAY['Sensual Massage','GFE'],             300, 4.7,  64, false, true,  true),
  ('Sven',   'Deep tissue and hot stone.',                                ARRAY['Deep Tissue','Hot Stone'],           160, 4.6,  92, false, false, true),
  ('Niels',  'Couples and relaxation.',                                   ARRAY['Relaxation','Couples Massage'],      190, 4.5,  41, false, false, true)
ON CONFLICT DO NOTHING;
