-- Database Role Sync Migration
-- Purpose: Update existing records in profiles and memberships to match the new role hierarchy.
-- Safe for environments where legacy tables may not exist yet.

DO $$
BEGIN
    -- 1. Update Profiles Table (if present)
    IF to_regclass('public.profiles') IS NOT NULL THEN
        UPDATE public.profiles
        SET role = CASE
            WHEN role = 'SUPER_ADMIN' THEN 'OWNER'
            WHEN role = 'ADMIN' THEN 'OWNER'
            WHEN role = 'OWNER' THEN 'DEALERSHIP_ADMIN'
            WHEN role = 'STAFF' THEN 'DEALERSHIP_STAFF'
            WHEN role = 'USER' THEN 'BMB_USER'
            ELSE role
        END;
    END IF;

    -- 2. Update Memberships Table (if present)
    IF to_regclass('public.memberships') IS NOT NULL THEN
        UPDATE public.memberships
        SET role = CASE
            WHEN role = 'SUPER_ADMIN' THEN 'OWNER'
            WHEN role = 'ADMIN' THEN 'OWNER'
            WHEN role = 'OWNER' THEN 'DEALERSHIP_ADMIN'
            WHEN role = 'STAFF' THEN 'DEALERSHIP_STAFF'
            WHEN role = 'USER' THEN 'BMB_USER'
            ELSE role
        END;
    END IF;
END $$;
