#!/usr/bin/env python3
"""
NTORQ 125 — FINAL Media Downloader
URLs extracted directly from TVS website page source.
Run from project root: python3 scripts/download_ntorq_final.py
"""

import os, urllib.request, time

BASE = "https://www.tvsmotor.com"
HDRS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer': 'https://www.tvsmotor.com/'
}

def fetch(url):
    try:
        req = urllib.request.Request(url, headers=HDRS)
        with urllib.request.urlopen(req, timeout=10) as r:
            d = r.read()
            return d if len(d) > 5000 else None
    except:
        return None

def dl(label, target_dir, url_list):
    """Download a list of (target_filename, source_url) pairs."""
    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(os.path.dirname(target_dir), exist_ok=True)
    print(f"\n{'='*58}\n  {label}\n{'='*58}")
    ok = skip = miss = 0
    for fname, url in url_list:
        dst = os.path.join(target_dir, fname)
        if os.path.exists(dst) and os.path.getsize(dst) > 5000:
            skip += 1; continue
        data = fetch(BASE + "/commuter/tvs-ntorq/-/media/" + url)
        if data:
            with open(dst, 'wb') as f: f.write(data)
            print(f"  [OK]   {fname}")
            ok += 1
        else:
            print(f"  [MISS] {fname}")
            miss += 1
        time.sleep(0.1)

    print(f"  ⇒ {ok} new, {skip} skip, {miss} miss | total {ok+skip}/{len(url_list)}")

    # Derive primary.webp from image1.webp if missing
    parent = os.path.dirname(target_dir)
    primary = os.path.join(parent, "primary.webp")
    img1 = os.path.join(target_dir, "image1.webp")
    if os.path.exists(img1) and not os.path.exists(primary):
        with open(img1,'rb') as s, open(primary,'wb') as d2: d2.write(s.read())
        print(f"  [PRIMARY] created from image1.webp")


# ── HELPER: sequential list with simple {n}.webp naming ──────────────
def seq(path, n_total, pad=False):
    """Generate [(image1.webp, path/1.webp), ...] list."""
    result = []
    for i in range(1, n_total + 1):
        fname_remote = f"{i:02d}.webp" if pad else f"{i}.webp"
        result.append((f"image{i}.webp", path + fname_remote))
    return result

# ─────────────────────────────────────────────────────────────
# DISC — Harlequin Blue (36 frames)
# ─────────────────────────────────────────────────────────────
dl(
    "Disc — Harlequin Blue",
    "public/media/tvs/ntorq-125/disc/harlequin-blue/360",
    seq("commuter-app/Tvs-u577/125-Base/Variant360/harlequin-blue/New/W897x504px/", 36)
)

# ─────────────────────────────────────────────────────────────
# DISC — Turquoise Blue (36 frames)
# ─────────────────────────────────────────────────────────────
dl(
    "Disc — Turquoise Blue",
    "public/media/tvs/ntorq-125/disc/turquoise-blue/360",
    seq("commuter-app/Tvs-u577/125-Base/Variant360/turquoise-blue/New/W897x504px/", 36)
)

# ─────────────────────────────────────────────────────────────
# SUPER SQUAD — Stealth Black (8 frames)
# ─────────────────────────────────────────────────────────────
dl(
    "Super Squad — Stealth Black",
    "public/media/tvs/ntorq-125/super-squad/stealth-black/360",
    [(f"image{i}.webp", f"commuter-app/Tvs-u577/Super-Squad/360New/stealth-black/Black-Panther_W897x504px-{i:02d}N.webp")
     for i in range(1, 9)]
)

# ─────────────────────────────────────────────────────────────
# SUPER SQUAD — Lightning Gray (8 frames)
# ─────────────────────────────────────────────────────────────
dl(
    "Super Squad — Lightning Gray",
    "public/media/tvs/ntorq-125/super-squad/lightning-gray/360",
    [(f"image{i}.webp", f"commuter-app/Tvs-u577/Super-Squad/360New/lightning-gray/Thor_W897x504px-{i:02d}N.webp")
     for i in range(1, 9)]
)

# ─────────────────────────────────────────────────────────────
# SUPER SQUAD — Amazing Red (8 frames)
# ─────────────────────────────────────────────────────────────
dl(
    "Super Squad — Amazing Red",
    "public/media/tvs/ntorq-125/super-squad/amazing-red/360",
    [(f"image{i}.webp", f"commuter-app/Tvs-u577/Super-Squad/360New/amazing-red/Spider_W897x504px-{i:02d}N.webp")
     for i in range(1, 9)]
)

# ─────────────────────────────────────────────────────────────
# SUPER SQUAD — Super Soldier (use combat-blue as best available)
# TVS has not published Super Soldier 360 images yet on the main site.
# combat-blue is a similar 8-frame set.
# ─────────────────────────────────────────────────────────────
dl(
    "Super Squad — Super Soldier (combat-blue proxy)",
    "public/media/tvs/ntorq-125/super-squad/super-soldier/360",
    [(f"image{i}.webp", f"commuter-app/Tvs-u577/Super-Squad/360New/combat-blue/New/CAMO_897x504-{i:02d}N.webp")
     for i in range(1, 9)]
)

# ─────────────────────────────────────────────────────────────
# RACE XP — Blaze Blue (mixed filenames — 33 frames)
# ─────────────────────────────────────────────────────────────
blaze_blue_files = [
    (f"image{i}.webp", f"commuter-app/Tvs-u577/Race-Xp/Variant360/Blaze-Blue-XP/{i}.webp")
    for i in range(1, 10)  # 1-9: simple numeric
] + [
    ("image10.webp", "commuter-app/Tvs-u577/Race-Xp/Variant360/Blaze-Blue-XP/10_XP.webp"),
    ("image11.webp", "commuter-app/Tvs-u577/Race-Xp/Variant360/Blaze-Blue-XP/11_XP.webp"),
    ("image12.webp", "commuter-app/Tvs-u577/Race-Xp/Variant360/Blaze-Blue-XP/12_XP1.webp"),
] + [
    (f"image{i}.webp", f"commuter-app/Tvs-u577/Race-Xp/Variant360/Blaze-Blue-XP/{i}_xp.webp")
    for i in range(13, 34)  # 13-33
]
dl("Race XP — Blaze Blue", "public/media/tvs/ntorq-125/race-xp/blaze-blue/360", blaze_blue_files)

# ─────────────────────────────────────────────────────────────
# RACE XP — Dark Black (36 frames)
# ─────────────────────────────────────────────────────────────
dl(
    "Race XP — Dark Black",
    "public/media/tvs/ntorq-125/race-xp/dark-black/360",
    seq("commuter-app/Tvs-u577/Race-Xp/Variant360/Xp-black/W897x504px/", 36)
)

# ─────────────────────────────────────────────────────────────
# XT — Neon (8 frames — TVS only publishes 8)
# ─────────────────────────────────────────────────────────────
dl(
    "XT — Neon",
    "public/media/tvs/ntorq-125/xt/xt-neon/360",
    [(f"image{i}.webp", f"commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N{i:02d}.webp")
     for i in range(1, 9)]
)

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
print("\n\n" + "="*58)
print("  NTORQ 125 Media — Final Summary")
print("="*58)
import subprocess
result = subprocess.run(
    ["find", "public/media/tvs/ntorq-125", "-mindepth", "2", "-maxdepth", "2", "-type", "d"],
    capture_output=True, text=True
)
for line in sorted(result.stdout.strip().split('\n')):
    if not line: continue
    try:
        frames_dir = os.path.join(line, "360")
        fc = len([f for f in os.listdir(frames_dir) if f.endswith('.webp')]) if os.path.isdir(frames_dir) else 0
        has_p = "✅" if os.path.exists(os.path.join(line, "primary.webp")) else "❌ NO PRIMARY"
        print(f"  {has_p}  {line.split('ntorq-125/')[-1]:35s}  {fc} frames")
    except:
        pass
