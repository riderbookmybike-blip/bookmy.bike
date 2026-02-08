import uuid

def gen_id():
    return str(uuid.uuid4())

family_id = gen_id()
brand_id = 'aff9a671-6e98-4d7e-8af1-b7823238a00e'
template_id = 'c49556f3-b89f-49d0-a191-b3277d6b5d04'

variants = [
    {
        "name": "RM Drum (Black Edition)",
        "price": 101890,
        "specs": {"kerb_weight": 137},
        "skus": [
            {"name": "Glossy Black", "hex": "#000000", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/black-edition/glossy-black/primary.webp"}
        ]
    },
    {
        "name": "RM Drum",
        "price": 112890,
        "specs": {"kerb_weight": 137},
        "skus": [
            {"name": "Gloss Black", "hex": "#000000", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-drum/gloss-black/primary.webp"},
            {"name": "Pearl White", "hex": "#F8F6F0", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-drum/pearl-white/primary.webp"}
        ]
    },
    {
        "name": "RM Disc",
        "price": 116090,
        "specs": {"kerb_weight": 138, "braking_rear": "Disc"},
        "skus": [
            {"name": "Gloss Black", "hex": "#000000", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc/gloss-black/primary.webp"},
            {"name": "Matte Blue", "hex": "#1366a8", "finish": "Matte", "img": "/media/tvs/apache-160-2v/rm-disc/matte-blue/primary.webp"},
            {"name": "Pearl White", "hex": "#F8F6F0", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc/pearl-white/primary.webp"},
            {"name": "Racing Red", "hex": "#FF0000", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc/racing-red/primary.webp"}
        ]
    },
    {
        "name": "RM Disc BT",
        "price": 119190,
        "specs": {"kerb_weight": 138, "braking_rear": "Disc", "bluetooth": "Yes"},
        "skus": [
            {"name": "Gloss Black", "hex": "#000000", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc-bt/gloss-black/primary.webp"},
            {"name": "Matte Blue", "hex": "#1366a8", "finish": "Matte", "img": "/media/tvs/apache-160-2v/rm-disc-bt/matte-blue/primary.webp"},
            {"name": "Pearl White", "hex": "#F8F6F0", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc-bt/pearl-white/primary.webp"},
            {"name": "Racing Red", "hex": "#FF0000", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc-bt/racing-red/primary.webp"},
            {"name": "T Grey", "hex": "#808080", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/rm-disc-bt/t-grey/primary.webp"}
        ]
    },
    {
        "name": "Racing Edition",
        "price": 120490,
        "specs": {"kerb_weight": 138, "braking_rear": "Disc"},
        "skus": [
            {"name": "Matte Black", "hex": "#4f4f53", "finish": "Matte", "img": "/media/tvs/apache-160-2v/racing-edition/matte-black/primary.webp"}
        ]
    },
    {
        "name": "Dual Channel ABS",
        "price": 123990,
        "specs": {"kerb_weight": 139, "braking_rear": "Disc", "abs_type": "Dual Channel ABS"},
        "skus": [
            {"name": "Matte Black", "hex": "#4f4f53", "finish": "Matte", "img": "/media/tvs/apache-160-2v/dual-channel-abs/matte-black/primary.webp"},
            {"name": "Pearl White", "hex": "#F8F6F0", "finish": "Gloss", "img": "/media/tvs/apache-160-2v/dual-channel-abs/pearl-white/primary.webp"}
        ]
    }
]

import json

sql = []
sql.append(f"-- FAMILY: Apache RTR 160 2V")
family_specs = {
    "engine_cc": 159.7,
    "max_power": "Sport: 16.04 PS @ 8750 rpm",
    "max_torque": "13.85 Nm @ 7000 rpm",
    "top_speed": 107,
    "fuel_capacity": 12,
    "gears": 5,
    "braking_front": "Disc",
    "braking_rear": "Drum",
    "abs_type": "Single Channel ABS",
    "tyre_type": "Tubeless",
    "console_type": "Digital",
    "bluetooth": "No",
    "seat_height": 790,
    "ground_clearance": 180
}

sql.append(f"INSERT INTO cat_items (id, brand_id, template_id, type, name, slug, status, specs) VALUES ('{family_id}', '{brand_id}', '{template_id}', 'FAMILY', 'Apache RTR 160 2V', 'tvs-apache-rtr-160-2v', 'ACTIVE', '{json.dumps(family_specs)}'::jsonb);")

for v in variants:
    v_id = gen_id()
    v_slug = 'tvs-apache-rtr-160-2v-' + v['name'].lower().replace(' ', '-').replace('(', '').replace(')', '')
    sql.append(f"\n-- VARIANT: {v['name']}")
    sql.append(f"INSERT INTO cat_items (id, parent_id, brand_id, template_id, type, name, slug, status, price_base, specs) VALUES ('{v_id}', '{family_id}', '{brand_id}', '{template_id}', 'VARIANT', '{v['name']}', '{v_slug}', 'ACTIVE', {v['price']}, '{json.dumps(v['specs'])}'::jsonb);")
    
    for s_idx, s in enumerate(v['skus']):
        col_id = gen_id()
        col_slug = v_slug + '-color-' + s['name'].lower().replace(' ', '-')
        col_specs = {"Color": s['name'], "Finish": s['finish'], "hex_primary": s['hex'], "primary_image": s['img']}
        sql.append(f"  -- COLOR_DEF: {s['name']}")
        sql.append(f"  INSERT INTO cat_items (id, parent_id, brand_id, template_id, type, name, slug, status, position, specs) VALUES ('{col_id}', '{v_id}', '{brand_id}', '{template_id}', 'COLOR_DEF', '{s['name']}', '{col_slug}', 'ACTIVE', {s_idx + 1}, '{json.dumps(col_specs)}'::jsonb);")

        s_id = gen_id()
        s_slug = col_slug + '-sku'
        # SKU name should be "{Variant} - {Color}"
        sku_name = f"{v['name']} - {s['name']}"
        sql.append(f"    -- SKU: {sku_name}")
        sql.append(f"    INSERT INTO cat_items (id, parent_id, brand_id, template_id, type, name, slug, status, price_base, image_url) VALUES ('{s_id}', '{col_id}', '{brand_id}', '{template_id}', 'SKU', '{sku_name}', '{s_slug}', 'ACTIVE', {v['price']}, '{s['img']}');")
        
        # Pricing for Maharashtra (MH) - apply ₹1 discount
        discounted_price = v['price'] - 1
        sql.append(f"    INSERT INTO cat_price_state (vehicle_color_id, state_code, ex_showroom_price, is_active, district, gst_rate, hsn_code, publish_stage) VALUES ('{s_id}', 'MH', '{discounted_price}', true, 'ALL', '18', '87112019', 'DRAFT');")

with open('apache_2v_seed_v2.sql', 'w') as f:
    f.write('\n'.join(sql))
