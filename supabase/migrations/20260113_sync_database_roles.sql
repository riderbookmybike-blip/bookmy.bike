-- Database Role Sync Migration
-- Purpose: Update existing records in profiles and memberships to match the new role hierarchy.

-- 1. Update Profiles Table
UPDATE profiles
SET role = CASE 
    WHEN role = 'SUPER_ADMIN' THEN 'OWNER'
    WHEN role = 'ADMIN' THEN 'OWNER'
    WHEN role = 'OWNER' THEN 'DEALERSHIP_ADMIN'
    WHEN role = 'STAFF' THEN 'DEALERSHIP_STAFF'
    WHEN role = 'USER' THEN 'BMB_USER'
    ELSE role
END;

-- 2. Update Memberships Table
UPDATE memberships
SET role = CASE 
    WHEN role = 'SUPER_ADMIN' THEN 'OWNER'
    WHEN role = 'ADMIN' THEN 'OWNER'
    WHEN role = 'OWNER' THEN 'DEALERSHIP_ADMIN'
    WHEN role = 'STAFF' THEN 'DEALERSHIP_STAFF'
    WHEN role = 'USER' THEN 'BMB_USER'
    ELSE role
END;

-- 3. Verify counts (Optional logging/comment)
-- SELECT role, count(*) FROM profiles GROUP BY role;
-- SELECT role, count(*) FROM memberships GROUP BY role;
