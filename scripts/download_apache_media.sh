#!/bin/bash

BASE_DIR="public/media/tvs/apache-160-4v"
TV_URL="https://www.tvsmotor.com"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Primary Images mapping
# Format: variant/color|url_path
primary_declarations=(
    "rm-disc-black-edition/black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Black-Edition.webp"
    "drum/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Racing-red.webp"
    "drum/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Knight-black.webp"
    "drum/metallic-blue|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Metallic-blue.webp"
    "disc/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Racing-red.webp"
    "disc/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Knight-black.webp"
    "disc/metallic-blue|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Metallic-blue.webp"
    "bt-disc/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Racing-red.webp"
    "bt-disc/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Knight-black.webp"
    "bt-disc/metallic-blue|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Metallic-blue.webp"
    "bt-disc/lightning-blue|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Lightning-blue.webp"
    "special-edition/matte-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Matte-black.webp"
    "dual-channel-abs/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Racing-red.webp"
    "dual-channel-abs/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Knight-black.webp"
    "dual-channel-abs/matte-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Matte-black.webp"
    "dual-channel-abs-usd/granite-grey|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Granite-Grey.webp"
    "dual-channel-abs-usd/matte-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Matte-black.webp"
    "dual-channel-abs-usd/pearl-white|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Pearl-white.webp"
    "tft/granite-grey|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Granite-Grey.webp"
    "tft/matte-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Matte-black.webp"
    "tft/pearl-white|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Pearl-white.webp"
)

# 360 Sets mapping (Best guess patterns based on other Apache models)
# Format: variant/color|url_template|count
three_sixty_declarations=(
    "disc/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/Racing-Red/{i}.webp|36"
    "disc/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/Knight-Black/{i}.webp|36"
    "special-edition/matte-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/Special-Edition-Matte-Black/{i}.webp|36"
    "dual-channel-abs-usd/granite-grey|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/USD-Granite-Grey/{i}.webp|36"
)

function download_primaries() {
    echo "--- Downloading Primary Images ---"
    for entry in "${primary_declarations[@]}"; do
        path="${entry%%|*}"
        url_path="${entry##*|}"
        full_url="$TV_URL$url_path"
        
        dir="$BASE_DIR/$path"
        mkdir -p "$dir"
        
        echo "Downloading primary for $path..."
        curl -L -s -A "$USER_AGENT" -o "$dir/primary.webp" "$full_url"
        
        # Check if file is small (likely 404)
        filesize=$(stat -f%z "$dir/primary.webp" 2>/dev/null || stat -c%s "$dir/primary.webp" 2>/dev/null)
        if [ "$filesize" -lt 1000 ]; then
            echo "  [FAIL] $path (File too small: $filesize bytes)"
            rm "$dir/primary.webp"
        else
            echo "  [DONE] $path ($filesize bytes)"
        fi
    done
}

function download_360() {
    echo "--- Downloading 360 Sets (Experimental) ---"
    for entry in "${three_sixty_declarations[@]}"; do
        path="${entry%%|*}"
        template_middle="${entry%|*}"
        template="${template_middle##*|}"
        count="${entry##*|}"
        
        dir="$BASE_DIR/$path/360"
        mkdir -p "$dir"
        
        echo "Attempting 360 set for $path..."
        set_ok=0
        for i in $(seq 1 "$count"); do
            url_path="${template//\{i\}/$i}"
            full_url="$TV_URL$url_path"
            target="$dir/image$i.webp"
            
            curl -L -s -A "$USER_AGENT" -o "$target" "$full_url"
            
            filesize=$(stat -f%z "$target" 2>/dev/null || stat -c%s "$target" 2>/dev/null)
            if [ "$filesize" -lt 1000 ]; then
                rm "$target"
                break
            fi
            set_ok=$((set_ok + 1))
        done
        
        if [ "$set_ok" -lt "$count" ]; then
            echo "  [MISSING] 360 set for $path (only $set_ok images found)"
            # Clean up partial sets
            find "$dir" -name "*.webp" -delete 2>/dev/null
        else
            echo "  [DONE] 360 set for $path ($count images)"
        fi
    done
}

download_primaries
download_360
echo "--- Apache 160 4V Meta-Download Complete ---"
