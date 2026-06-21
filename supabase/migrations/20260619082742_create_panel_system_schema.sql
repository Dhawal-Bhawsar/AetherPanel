/*
# Panel System Schema — Referral Bonus Ecosystem

## 1. New Tables
- `members` — existing panel members who can refer others
  - `id` (uuid, PK, default gen_random_uuid)
  - `name` (text, not null)
  - `email` (text, unique, not null)
  - `phone` (text)
  - `city` (text)
  - `category` (text) — operational cohort / industry segment
  - `referral_code` (text, unique) — unique shareable code
  - `total_referrals` (int, default 0)
  - `total_earnings` (numeric, default 0)
  - `status` (text, default 'active') — active, inactive
  - `created_at` (timestamptz, default now())

- `surveys` — available survey projects
  - `id` (uuid, PK)
  - `title` (text, not null)
  - `category` (text)
  - `description` (text)
  - `status` (text, default 'active')
  - `created_at` (timestamptz, default now())

- `respondents` — all panel respondents (baseline + new sign-ups)
  - `id` (uuid, PK)
  - `name` (text, not null)
  - `email` (text, unique, not null)
  - `phone` (text)
  - `city` (text)
  - `category` (text)
  - `source` (text, default 'baseline') — baseline, referral, direct
  - `status` (text, default 'pending') — active, pending, inactive, rejected
  - `notes` (text)
  - `created_at` (timestamptz, default now())

- `referrals` — referral lifecycle tracking (lead → fit → completion)
  - `id` (uuid, PK)
  - `referrer_id` (uuid → members.id)
  - `respondent_id` (uuid → respondents.id)
  - `survey_id` (uuid → surveys.id, nullable)
  - `referral_code` (text) — the code used to sign up
  - `status` (text, default 'lead') — lead, fit, completion, rejected
  - `lead_date` (timestamptz, default now()) — sign-up timestamp
  - `fit_date` (timestamptz, nullable) — ops approval timestamp
  - `completion_date` (timestamptz, nullable) — survey completion timestamp
  - `payout_amount` (numeric, default 0)
  - `created_at` (timestamptz, default now())

## 2. Security
- Enable RLS on all 4 tables.
- Single-tenant app: allow `anon` and `authenticated` full CRUD.
  (Data is intentionally shared/public for this admin tool prototype.)

## 3. Indexes
- Index on members.referral_code for fast lookups
- Index on respondents.email for fast lookups
- Index on referrals.referral_code and status for filtering
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  city text,
  category text,
  referral_code text UNIQUE NOT NULL,
  total_referrals int NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS respondents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  city text,
  category text,
  source text NOT NULL DEFAULT 'baseline',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  respondent_id uuid REFERENCES respondents(id) ON DELETE SET NULL,
  survey_id uuid REFERENCES surveys(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'lead',
  lead_date timestamptz DEFAULT now(),
  fit_date timestamptz,
  completion_date timestamptz,
  payout_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_referral_code ON members(referral_code);
CREATE INDEX IF NOT EXISTS idx_respondents_email ON respondents(email);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_surveys" ON surveys;
CREATE POLICY "anon_select_surveys" ON surveys FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_surveys" ON surveys;
CREATE POLICY "anon_insert_surveys" ON surveys FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_surveys" ON surveys;
CREATE POLICY "anon_update_surveys" ON surveys FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_surveys" ON surveys;
CREATE POLICY "anon_delete_surveys" ON surveys FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_respondents" ON respondents;
CREATE POLICY "anon_select_respondents" ON respondents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_respondents" ON respondents;
CREATE POLICY "anon_insert_respondents" ON respondents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_respondents" ON respondents;
CREATE POLICY "anon_update_respondents" ON respondents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_respondents" ON respondents;
CREATE POLICY "anon_delete_respondents" ON respondents FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_referrals" ON referrals;
CREATE POLICY "anon_select_referrals" ON referrals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_referrals" ON referrals;
CREATE POLICY "anon_insert_referrals" ON referrals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_referrals" ON referrals;
CREATE POLICY "anon_update_referrals" ON referrals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_referrals" ON referrals;
CREATE POLICY "anon_delete_referrals" ON referrals FOR DELETE TO anon, authenticated USING (true);
