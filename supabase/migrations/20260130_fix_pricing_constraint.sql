-- 1. Drop existing constraint that limits one price per state
ALTER TABLE cat_prices 
DROP CONSTRAINT IF EXISTS vehicle_prices_vehicle_color_id_state_code_key;

-- 2. Add new constraint ensuring uniqueness on SKU + State + District
ALTER TABLE cat_prices 
ADD CONSTRAINT cat_prices_sku_state_district_unique 
UNIQUE (vehicle_color_id, state_code, district);
