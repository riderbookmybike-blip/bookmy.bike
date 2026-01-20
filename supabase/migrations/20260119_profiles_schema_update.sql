
-- Add new columns to profiles table based on Aapli Users mapping
-- converting camelCase to snake_case for Postgres standards

alter table profiles 
add column if not exists rto text,
add column if not exists zone text,
add column if not exists religion text,
add column if not exists whatsapp text,
add column if not exists documents jsonb, -- Mapped from 'documents', likely structured data
add column if not exists father_name text, -- from fatherName
add column if not exists mother_name text, -- from motherName
add column if not exists pan_number text, -- from pan_number
add column if not exists zoho_book_id text, -- from zohoBookId
add column if not exists date_of_birth text, -- from dateOfBirth (keeping text for safety, can cast later)
add column if not exists aadhaar_front text, -- from aadhaarFront (URL?)
add column if not exists aadhaar_number text, -- from aadhaar_number
add column if not exists aadhaar_address_1 text, -- from aadhaarAddress1
add column if not exists aadhaar_address_2 text, -- from aadhaarAddress2
add column if not exists aadhaar_address_3 text, -- from aadhaarAddress3
add column if not exists aadhaar_pincode text, -- from aadhaar_pincode
add column if not exists current_address_1 text, -- from currentAddress1
add column if not exists current_address_2 text, -- from currentAddress2
add column if not exists current_address_3 text, -- from currentAddress3
add column if not exists aadhaar_linked_number text, -- from aadhaar_linked_number
add column if not exists last_updated_at_source text; -- from last_updated

-- Index for searching users by whatsapp/aadhaar if needed
create index if not exists idx_profiles_whatsapp on profiles(whatsapp);
create index if not exists idx_profiles_aadhaar_number on profiles(aadhaar_number);
