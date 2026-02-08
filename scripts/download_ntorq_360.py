import os
import urllib.request
import time

def download_set(variant_name, base_url_dir, target_dir, filename_options):
    os.makedirs(target_dir, exist_ok=True)
    print(f"Downloading 36-set {variant_name} to {target_dir}...")
    
    for i in range(1, 37):
        target_path = os.path.join(target_dir, f"image{i}.webp")
        success = False
        
        for opt in filename_options:
            for n in [f"0{i}", str(i)]:
                url_filename = opt.replace("{i}", n)
                url = f"{base_url_dir}/{url_filename}"
                try:
                    with urllib.request.urlopen(url, timeout=5) as response:
                        content = response.read()
                        if len(content) > 10000 and len(content) != 93297:
                            with open(target_path, "wb") as f:
                                f.write(content)
                            print(f"  [OK] Saved {i} using {url_filename}")
                            success = True
                            break
                except:
                    pass
            if success: break
        
        time.sleep(0.1)

def download_4_angle(variant_name, base_url, target_dir):
    os.makedirs(target_dir, exist_ok=True)
    print(f"Downloading 4-angle {variant_name} to {target_dir}...")
    angles = ["left", "front", "right", "back"]
    for i, angle in enumerate(angles):
        url = f"{base_url}/{angle}.png"
        target_path = os.path.join(target_dir, f"image{i+1}.webp")
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                content = response.read()
                if len(content) > 1000:
                    with open(target_path, "wb") as f:
                        f.write(content)
                    print(f"  [OK] Saved {angle} as image{i+1}")
        except Exception as e:
            print(f"  [ERROR] {e} for {angle}")

# Base URL Directories
base_125_base = "https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360"
base_xt = "https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT/360-Variants/XT"
base_online = "https://www.tvsmotor.com/-/media/BookOnline-V2/Scooter/TVS-NTORQ-125/Disc"

# Run downloads
print("Starting Ntorq localization...")

# Nardo Grey (36 images worked)
download_set("Nardo Grey", f"{base_125_base}/nardo-grey", "public/media/tvs/ntorq-125/disc/nardo-grey/360", 
             ["Nardo-Grey_W897x504px-{i}N.webp", "Nardo-Grey_W897x504px-{i}n.webp"])

# Metallic Blue (Fallback to 4 angles)
download_4_angle("Metallic Blue", f"{base_online}/Metallic-Blue", "public/media/tvs/ntorq-125/disc/metallic-blue/360")

# Metallic Red (Fallback to 4 angles)
download_4_angle("Metallic Red", f"{base_online}/Metallic-Red", "public/media/tvs/ntorq-125/disc/metallic-red/360")

# XT Neon (8 images worked)
download_set("XT Neon", base_xt, "public/media/tvs/ntorq-125/xt/xt-neon/360", 
             ["XT_Neon-{i}.webp", "XT_W897x504px-N{i}.webp"])

print("\nFinal Localization Step Complete.")
