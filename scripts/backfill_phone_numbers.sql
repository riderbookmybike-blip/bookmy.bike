-- Backfill phone numbers to 10-digit storage format
-- Run in a safe window; validate counts before/after.

-- id_members.primary_phone
update id_members
set primary_phone = right(regexp_replace(primary_phone, '\\D', '', 'g'), 10)
where primary_phone is not null;

-- id_members.phone
update id_members
set phone = right(regexp_replace(phone, '\\D', '', 'g'), 10)
where phone is not null;

-- id_members.whatsapp
update id_members
set whatsapp = right(regexp_replace(whatsapp, '\\D', '', 'g'), 10)
where whatsapp is not null;

-- id_members.work_phone
update id_members
set work_phone = right(regexp_replace(work_phone, '\\D', '', 'g'), 10)
where work_phone is not null;

-- id_member_contacts (PHONE/WHATSAPP)
update id_member_contacts
set value = right(regexp_replace(value, '\\D', '', 'g'), 10)
where contact_type in ('PHONE', 'WHATSAPP') and value is not null;

-- crm_leads.customer_phone
update crm_leads
set customer_phone = right(regexp_replace(customer_phone, '\\D', '', 'g'), 10)
where customer_phone is not null;
