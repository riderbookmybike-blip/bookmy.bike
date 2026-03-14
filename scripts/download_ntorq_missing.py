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
        with urllib.request.urlopen(req, timeout=8) as r:
            data = r.read()
            if len(data) > 8000:
                return data
    except:
        pass
    return None

def download_36_set(label, target_dir, url_patterns):
    """Try multiple URL patterns to download 36-frame 360 set."""
    os.makedirs(target_dir, exist_ok=True)
    print(f"\n{'='*50}")
    print(f"  {label}")
    print(f"  Target: {target_dir}")
    print(f"{'='*50}")
    
    downloaded = 0
    for i in range(1, 37):
        target_path = os.path.join(target_dir, f"image{i}.webp")
        if os.path.exists(target_path) and os.path.getsize(target_path) > 8000:
            print(f"  [SKIP] {i} already exists")
            downloaded += 1
            continue
        
        success = False
        for pattern in url_patterns:
            # Try zero-padded (01) and non-padded (1)
            for num in [f"{i:02d}", str(i)]:
                url = BASE_TVS + pattern.format(n=num, i=i)
                data = try_url(url)
                if data:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    print(f"  [OK] {i} <- {url}")
                    downloaded += 1
                    success = True
                    break
            if success:
                break
        
        if not success:
            print(f"  [MISS] {i} - no working URL found")
        
        time.sleep(0.15)
    
    print(f"  => {downloaded}/36 frames downloaded")
    return downloaded

# ─────────────────────────────────────────────────
# SUPER SQUAD EDITION (SSE) — 4 missing colours
# ─────────────────────────────────────────────────

# Super Soldier (was Combat Blue in old scripts)
download_36_set(
    "Super Squad — Super Soldier",
    "public/media/tvs/ntorq-125/super-squad/super-soldier/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Super-Soldier/Super-Soldier-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Super-Soldier/TVS_SuperSoldier_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Combat-Blue/Combat-Blue-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Super-Soldier/TVS_Ntorq_SSE_SuperSoldier_360_{n}.webp",
    ]
)

# Stealth Black
download_36_set(
    "Super Squad — Stealth Black",
    "public/media/tvs/ntorq-125/super-squad/stealth-black/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Stealth-black/TVS_StealthBlack_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Stealth-Black/Stealth-Black-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Stealth-Black/TVS_Ntorq_SSE_StealthBlack_360_{n}.webp",
    ]
)

# Lightning Gray
download_36_set(
    "Super Squad — Lightning Gray",
    "public/media/tvs/ntorq-125/super-squad/lightning-gray/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Lightning-Gray/Lightning-Gray-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Lightning-Gray/TVS_LightningGray_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Lightning-Gray/TVS_Ntorq_SSE_LightningGray_360_{n}.webp",
    ]
)

# Amazing Red
download_36_set(
    "Super Squad — Amazing Red",
    "public/media/tvs/ntorq-125/super-squad/amazing-red/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Amazing-Red/Amazing-Red-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Amazing-Red/TVS_AmazingRed_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/SSE/360-color/Amazing-Red/TVS_Ntorq_SSE_AmazingRed_360_{n}.webp",
    ]
)

# ─────────────────────────────────────────────────
# RACE XP — 2 missing colours
# ─────────────────────────────────────────────────

# Blaze Blue
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

# Dark Black
download_36_set(
    "Race XP — Dark Black",
    "public/media/tvs/ntorq-125/race-xp/dark-black/360",
    [
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Dark-Black/TVS_Ntorq_RaceXP_DarkBlack_360_{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Dark-Black/Dark-Black-{n}.webp",
        "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-XP/Variant360/Dark-Black/TVS_DarkBlack_360_{n}.webp",
    ]
)

# ─────────────────────────────────────────────────
print("\n\n✅ Download complete. Final structure:")
import subprocess
result = subprocess.run(
    ["find", "public/media/tvs/ntorq-125", "-mindepth", "3", "-maxdepth", "3", "-type", "d"],
    capture_output=True, text=True
)
for line in sorted(result.stdout.strip().split('\n')):
    count = len([f for f in os.listdir(line) if f.endswith('.webp')])
    print(f"  {line}: {count} frames")
