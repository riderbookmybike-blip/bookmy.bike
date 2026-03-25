-- 1. Compatibility bootstrap for legacy bank accounts schema
ALTER TABLE public.id_bank_accounts
ADD COLUMN IF NOT EXISTS account_type text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 2. Add CHECK constraint to id_bank_accounts.account_type
ALTER TABLE public.id_bank_accounts
DROP CONSTRAINT IF EXISTS id_bank_accounts_type_check;
ALTER TABLE public.id_bank_accounts
ADD CONSTRAINT id_bank_accounts_type_check
CHECK (account_type IN ('SAVINGS', 'CURRENT', 'CASH', 'CREDIT_CARD', 'UPI', 'VIRTUAL'));

-- 3. Create a unique partial index for single primary account per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_primary_bank_account_per_tenant 
ON public.id_bank_accounts (tenant_id) 
WHERE is_primary = true AND status = 'ACTIVE';

-- 4. Supporting indexes for fast lookup by type and status
CREATE INDEX IF NOT EXISTS idx_id_bank_accounts_type_status 
ON public.id_bank_accounts (tenant_id, account_type, status);
