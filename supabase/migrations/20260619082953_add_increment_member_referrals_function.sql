/*
# Add increment_member_referrals RPC function

1. New Function
- `increment_member_referrals(member_id uuid)` — atomically increments total_referrals for a given member.

2. Security
- Executed with security definer so it can update member counts regardless of RLS.
*/

CREATE OR REPLACE FUNCTION increment_member_referrals(member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE members
  SET total_referrals = total_referrals + 1
  WHERE id = member_id;
END;
$$;
