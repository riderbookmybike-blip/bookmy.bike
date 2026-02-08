import json
import os

def get_gallery(path_prefix, full_os_path):
    if not os.path.exists(full_os_path):
        return []
    # Count image files: image1.webp, image2.webp...
    files = [f for f in os.listdir(full_os_path) if f.startswith("image") and f.endswith(".webp") and not f.startswith("._")]
    # Extract numbers and sort
    numbers = []
    for f in files:
        try:
            num = int(f.replace("image", "").replace(".webp", ""))
            numbers.append(num)
        except:
            pass
    numbers.sort()
    return [f"{path_prefix}/image{n}.webp" for n in numbers]

base_dir = "/Users/rathoreajitmsingh/Project/bookmy.bike/public"

variant_configs = [
    {
        "name": "XT NEON",
        "path": "/media/tvs/ntorq-125/xt/xt-neon/360"
    },
    {
        "name": "NARDO GREY",
        "path": "/media/tvs/ntorq-125/disc/nardo-grey/360"
    },
    {
        "name": "METALLIC BLUE",
        "path": "/media/tvs/ntorq-125/disc/metallic-blue/360"
    },
    {
        "name": "METALLIC RED",
        "path": "/media/tvs/ntorq-125/disc/metallic-red/360"
    }
]

sql = ""
for cfg in variant_configs:
    full_path = base_dir + cfg['path']
    gallery_list = get_gallery(cfg['path'], full_path)
    if not gallery_list:
        print(f"Skipping {cfg['name']} (no images found in {full_path})")
        continue

    gallery = json.dumps(gallery_list)
    primary = gallery_list[0]
    
    query = f"""
-- Update {cfg['name']} ({len(gallery_list)} images)
UPDATE cat_items 
SET 
  gallery_urls = '{gallery}'::jsonb,
  image_url = '{primary}',
  specs = specs || jsonb_build_object(
    'gallery', '{gallery}'::jsonb,
    'primary_image', '{primary}'
  ) - 'media'
WHERE name = '{cfg['name']}' AND type = 'SKU';
"""
    sql += query

with open("ntorq_localization_update.sql", "w") as f:
    f.write(sql)

print(f"SQL script generated in ntorq_localization_update.sql")
