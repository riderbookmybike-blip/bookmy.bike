import json
import re

html_content = """<USER_PROVIDED_HTML_HERE>""" # I will read this from the prompt or a file if I saved it

# Extract JSS_STATE
match = re.search(r'id="__JSS_STATE__">(.*?)</script>', html_content, re.DOTALL)
if not match:
    print("JSS_STATE not found")
    exit()

jss_data = json.loads(match.group(1))

vehicles = jss_data.get('sitecore', {}).get('route', {}).get('fields', {}).get('Vehicles', [])
if not vehicles:
    # Try different path
    placeholders = jss_data.get('sitecore', {}).get('route', {}).get('placeholders', {})
    for p in placeholders.get('jss-main', []):
        if 'fields' in p and 'Vehicles' in p['fields']:
            vehicles = p['fields']['Vehicles']
            break

sql_statements = []

for vehicle_type in vehicles:
    v_type_name = vehicle_type.get('fields', {}).get('VehicleTypeName', {}).get('value')
    active_vehicles = vehicle_type.get('fields', {}).get('ActiveVehicles', [])
    
    for v in active_vehicles:
        v_name = v.get('fields', {}).get('VehicleName', {}).get('value')
        v_id = v.get('id')
        
        # We'll use the IDs from the source to avoid collisions or to update existing
        active_variants = v.get('fields', {}).get('ActiveVariants', [])
        for var in active_variants:
            var_name = var.get('fields', {}).get('VariantName', {}).get('value')
            var_id = var.get('id')
            
            active_colors = var.get('fields', {}).get('ActiveColours', [])
            for col in active_colors:
                col_name = col.get('fields', {}).get('VehicleColor', {}).get('name')
                col_id = col.get('id')
                col_hex = col.get('fields', {}).get('ColorHexCode', {}).get('value')
                
                # Multiple Images
                images = col.get('fields', {}).get('VariantColorImages', [])
                media_urls = []
                for img in images:
                    url = img.get('url')
                    if url:
                        full_url = "https://www.tvsmotor.com" + url + "?smart_crop=1&scale=1"
                        media_urls.append(full_url)
                
                primary_image = media_urls[0] if media_urls else None
                
                # Generate SQL for SKU (assuming SKU maps to color level in this source)
                # We'll need to relate these to our hierarchy
                specs = {
                    "hex": col_hex,
                    "primary_image": primary_image,
                    "media": media_urls
                }
                
                # Simplified SQL generation
                sql = f"-- Model: {v_name}, Variant: {var_name}, Color: {col_name}\n"
                sql += f"UPDATE cat_items SET specs = specs || '{json.dumps(specs)}'::jsonb WHERE id = '{col_id}';\n"
                sql_statements.append(sql)

with open('ingest_media.sql', 'w') as f:
    f.writelines(sql_statements)
