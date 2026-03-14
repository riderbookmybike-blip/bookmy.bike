"""
download_ntorq_150.py
Downloads 360-degree image sets for all TVS NTORQ 150 color variants.

Color directories on tvsmotor.com CDN:
  /commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/{Color}/New/{variant_folder}/XX.webp

Variants share colors — both base and TFT use same 360 images for
Turbo Blue and Racing Red. Nitro Green is TFT-only. Stealth Silver is base-only.

Media target: public/media/tvs/ntorq-150/{color-slug}/360/
"""

import os
import urllib.request
import time

BASE_TVS = "https://www.tvsmotor.com"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.tvsmotor.com/'
}

def try_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            if len(data) > 8000:
                return data
    except Exception as e:
        pass
    return None

def download_36_set(label, target_dir, url_patterns):
    """Try multiple URL patterns to download 36-frame 360 set."""
    os.makedirs(target_dir, exist_ok=True)
    print(f"\n{'='*55}")
    print(f"  {label}")
    print(f"  Target: {target_dir}")
    print(f"{'='*55}")

    downloaded = 0
    for i in range(1, 37):
        target_path = os.path.join(target_dir, f"image{i}.webp")
        if os.path.exists(target_path) and os.path.getsize(target_path) > 8000:
            print(f"  [SKIP] {i} already exists")
            downloaded += 1
            continue

        success = False
        for pattern in url_patterns:
            for num in [f"{i:02d}", str(i)]:
                url = BASE_TVS + pattern.format(n=num, i=i)
                data = try_url(url)
                if data:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    print(f"  [OK] {i:2d} <- {url}")
                    downloaded += 1
                    success = True
                    break
            if success:
                break

        if not success:
            print(f"  [MISS] {i:2d} - no working URL")

        time.sleep(0.15)

    print(f"  => {downloaded}/36 frames downloaded")
    return downloaded

# ─────────────────────────────────────────────────────────────
# NTORQ 150 — Nitro Green  (TFT primary color)
# ─────────────────────────────────────────────────────────────
download_36_set(
    "NTORQ 150 — Nitro Green",
    "public/media/tvs/ntorq-150/nitro-green/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Nitro-Green/New/green/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Nitro-Green/New/green/{i}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Nitro-Green/TVS_NtorQ150_NitroGreen_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Nitro-Green/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Nitro-Green/{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# NTORQ 150 — Racing Red  (both variants)
# ─────────────────────────────────────────────────────────────
download_36_set(
    "NTORQ 150 — Racing Red",
    "public/media/tvs/ntorq-150/racing-red/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Racing-Red/New/red/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Racing-Red/New/red/{i}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Racing-Red/TVS_NtorQ150_RacingRed_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Racing-Red/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Racing-Red/{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# NTORQ 150 — Stealth Silver  (base variant)
# ─────────────────────────────────────────────────────────────
download_36_set(
    "NTORQ 150 — Stealth Silver",
    "public/media/tvs/ntorq-150/stealth-silver/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Stealth-Silver/New/silver/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Stealth-Silver/New/silver/{i}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Stealth-Silver/TVS_NtorQ150_StealthSilver_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Stealth-Silver/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Stealth-Silver/{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# NTORQ 150 — Turbo Blue  (both variants)
# ─────────────────────────────────────────────────────────────
download_36_set(
    "NTORQ 150 — Turbo Blue",
    "public/media/tvs/ntorq-150/turbo-blue/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Turbo-Blue/New/blue/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Turbo-Blue/New/blue/{i}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Turbo-Blue/TVS_NtorQ150_TurboBlue_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/360/Turbo-Blue/{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium/Turbo-Blue/{n}.webp",
    ]
)

# Also grab the primary static images (1_n.webp) for each color
print("\n\n=== Downloading primary static hero images ===")
COLORS = {
    "Nitro-Green":    "public/media/tvs/ntorq-150/nitro-green",
    "Racing-Red":     "public/media/tvs/ntorq-150/racing-red",
    "Stealth-Silver": "public/media/tvs/ntorq-150/stealth-silver",
    "Turbo-Blue":     "public/media/tvs/ntorq-150/turbo-blue",
}
BASE_PATH = "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/U577-Premium/Variant-section/Premium"

for color_dir, local_dir in COLORS.items():
    os.makedirs(local_dir, exist_ok=True)
    for fname in ["1_n.webp", "1.webp"]:
        url = f"{BASE_TVS}{BASE_PATH}/{color_dir}/{fname}"
        target = os.path.join(local_dir, fname)
        if os.path.exists(target) and os.path.getsize(target) > 8000:
            print(f"  [SKIP] {target}")
            continue
        data = try_url(url)
        if data:
            with open(target, 'wb') as f:
                f.write(data)
            print(f"  [OK] {target} <- {url}")
        else:
            print(f"  [MISS] {color_dir}/{fname}")
        time.sleep(0.1)

# ─────────────────────────────────────────────────────────────
print("\n\n✅ NTORQ 150 download complete. Summary:")
import subprocess
for color in ["nitro-green", "racing-red", "stealth-silver", "turbo-blue"]:
    d = f"public/media/tvs/ntorq-150/{color}/360"
    if os.path.isdir(d):
        count = len([f for f in os.listdir(d) if f.endswith('.webp')])
        print(f"  {d}: {count}/36 frames")
