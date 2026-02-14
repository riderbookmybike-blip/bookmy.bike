-- Backfill: ensure wallet for all existing members
INSERT INTO public.oclub_wallets(member_id)
SELECT id FROM public.id_members
ON CONFLICT (member_id) DO NOTHING;
