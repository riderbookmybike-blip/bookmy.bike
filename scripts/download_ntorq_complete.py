#!/usr/bin/env python3
"""
NTORQ 125 — Complete Media Downloader
Downloads all missing 360 frame sets and derives primary.webp from frame 1.

Run from project root:
  python3 scripts/download_ntorq_complete.py
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
            if len(data) > 5000:
                return data
    except Exception:
        pass
    return None


def download_36_set(label, target_dir, url_patterns):
    """Download a 36-frame 360 set, trying multiple URL patterns."""
    os.makedirs(target_dir, exist_ok=True)
    print(f"\n{'='*55}")
    print(f"  {label}")
    print(f"  → {target_dir}")
    print(f"{'='*55}")

    downloaded = 0
    for i in range(1, 37):
        target_path = os.path.join(target_dir, f"image{i}.webp")
        if os.path.exists(target_path) and os.path.getsize(target_path) > 5000:
            print(f"  [SKIP] frame {i:02d} already exists")
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
                    print(f"  [OK]   frame {i:02d} ← {url}")
                    downloaded += 1
                    success = True
                    break
            if success:
                break

        if not success:
            print(f"  [MISS] frame {i:02d}")

        time.sleep(0.12)

    print(f"  ⇒ {downloaded}/36 frames")

    # Derive primary.webp from frame 1 if missing
    frame1 = os.path.join(target_dir, "image1.webp")
    primary_dir = os.path.dirname(target_dir)  # parent of /360
    primary_path = os.path.join(primary_dir, "primary.webp")
    if os.path.exists(frame1) and not os.path.exists(primary_path):
        with open(frame1, 'rb') as src, open(primary_path, 'wb') as dst:
            dst.write(src.read())
        print(f"  [PRIMARY] created from frame 1")

    return downloaded


# ─────────────────────────────────────────────────────────────
# DISC — Base Variant (3 colours)
# ─────────────────────────────────────────────────────────────

download_36_set(
    "Disc — Nardo Grey",
    "public/media/tvs/ntorq-125/disc/nardo-grey/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/nardo-grey/Nardo-Grey_W897x504px-{n}N.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/nardo-grey/TVS-Ntorq-nardo-grey-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/Nardo-Grey/TVS_Ntorq_NardoGrey_360_{n}.webp",
    ]
)

download_36_set(
    "Disc — Harlequin Blue",
    "public/media/tvs/ntorq-125/disc/harlequin-blue/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/harlequin-blue/TVS-Ntorq-harlequin-blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/Harlequin-Blue/TVS_Ntorq_HarlequinBlue_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/harlequin-blue/Harlequin-Blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/Harlequin-Blue/TVS_HarlequinBlue_360_{n}.webp",
    ]
)

download_36_set(
    "Disc — Turquoise Blue",
    "public/media/tvs/ntorq-125/disc/turquoise-blue/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/turquoise-blue/TVS-Ntorq-turquoise-blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/Turquoise-Blue/TVS_Ntorq_TurquoiseBlue_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/turquoise-blue/Turquoise-Blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/Turquoise-Blue/TVS_TurquoiseBlue_360_{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# RACE EDITION — 2 colours
# ─────────────────────────────────────────────────────────────

download_36_set(
    "Race Edition — Race Edition Blue",
    "public/media/tvs/ntorq-125/race-edition/race-edition-blue/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-edition-blue/TVS_Ntorq_Race_Edition_Blue_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-Edition-Blue/TVS_Ntorq_Race_Edition_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-Edition/Variant360/Race-Edition-Blue/Race-Edition-Blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-Edition/Variant360/Race-Edition-Blue/TVS_RaceEditionBlue_360_{n}.webp",
    ]
)

download_36_set(
    "Race Edition — Race Edition Red",
    "public/media/tvs/ntorq-125/race-edition/race-edition-red/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-edition-red/TVS_Ntorq_Race_Edition_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-Edition/Variant360/Race-Edition-Red/Race-Edition-Red-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-Edition/Variant360/Race-Edition-Red/TVS_RaceEditionRed_360_{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# SUPER SQUAD — 4 colours
# ─────────────────────────────────────────────────────────────

download_36_set(
    "Super Squad — Super Soldier",
    "public/media/tvs/ntorq-125/super-squad/super-soldier/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Super-Soldier/Super-Soldier-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Super-Soldier/TVS_SuperSoldier_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Super-Soldier/TVS_Ntorq_SSE_SuperSoldier_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Super-Squad/360-color/Super-Soldier/TVS_Ntorq_SuperSquad_SuperSoldier_360_{n}.webp",
    ]
)

download_36_set(
    "Super Squad — Stealth Black",
    "public/media/tvs/ntorq-125/super-squad/stealth-black/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Stealth-black/TVS_StealthBlack_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Stealth-Black/Stealth-Black-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Stealth-Black/TVS_Ntorq_SSE_StealthBlack_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Super-Squad/360-color/Stealth-Black/TVS_Ntorq_SuperSquad_StealthBlack_360_{n}.webp",
    ]
)

download_36_set(
    "Super Squad — Lightning Gray",
    "public/media/tvs/ntorq-125/super-squad/lightning-gray/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Lightning-Gray/Lightning-Gray-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Lightning-Gray/TVS_LightningGray_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Lightning-Gray/TVS_Ntorq_SSE_LightningGray_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Super-Squad/360-color/Lightning-Gray/TVS_Ntorq_SuperSquad_LightningGray_360_{n}.webp",
    ]
)

download_36_set(
    "Super Squad — Amazing Red",
    "public/media/tvs/ntorq-125/super-squad/amazing-red/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Amazing-Red/Amazing-Red-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Amazing-Red/TVS_AmazingRed_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Amazing-Red/TVS_Ntorq_SSE_AmazingRed_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Super-Squad/360-color/Amazing-Red/TVS_Ntorq_SuperSquad_AmazingRed_360_{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# RACE XP — 3 colours
# ─────────────────────────────────────────────────────────────

download_36_set(
    "Race XP — Blaze Blue",
    "public/media/tvs/ntorq-125/race-xp/blaze-blue/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Blaze-Blue/TVS_Ntorq_RaceXP_BlazBlue_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Blaze-Blue/TVS_Ntorq_RaceXP_BlazeBlue_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Blaze-Blue/Blaze-Blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Blaze-Blue/TVS_BlazeBlue_360_{n}.webp",
    ]
)

download_36_set(
    "Race XP — Race Red",
    "public/media/tvs/ntorq-125/race-xp/race-red/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Race-Red/TVS_Ntorq_RaceXP_RaceRed_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Race-XP/TVS_Ntorq_RaceXP_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Race-Red/Race-Red-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Race-Red/TVS_RaceRed_360_{n}.webp",
    ]
)

download_36_set(
    "Race XP — Dark Black",
    "public/media/tvs/ntorq-125/race-xp/dark-black/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Dark-Black/TVS_Ntorq_RaceXP_DarkBlack_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Dark-Black/Dark-Black-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Dark-Black/TVS_DarkBlack_360_{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# XT — 1 colour
# ─────────────────────────────────────────────────────────────

download_36_set(
    "XT — Neon",
    "public/media/tvs/ntorq-125/xt/xt-neon/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT/360-Variants/XT/XT_Neon-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/XT/360-color/Neon/TVS_Ntorq_XT_Neon_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT/Variant360/Neon/Neon-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT/Variant360/XT-Neon/XT-Neon-{n}.webp",
    ]
)

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────

print("\n\n" + "="*55)
print("  NTORQ 125 Media Download Complete")
print("="*55)

import subprocess
result = subprocess.run(
    ["find", "public/media/tvs/ntorq-125", "-mindepth", "2", "-maxdepth", "2", "-type", "d"],
    capture_output=True, text=True
)
for line in sorted(result.stdout.strip().split('\n')):
    if not line:
        continue
    try:
        frames_dir = os.path.join(line, "360")
        frame_count = len([f for f in os.listdir(frames_dir) if f.endswith('.webp')]) if os.path.isdir(frames_dir) else 0
        has_primary = "✅" if os.path.exists(os.path.join(line, "primary.webp")) else "❌"
        print(f"  {has_primary} {line.split('ntorq-125/')[-1]:35s} {frame_count:2d}/36 frames")
    except Exception:
        pass
