#!/bin/bash

# Configuration
BASE_DIR="public/media/tvs/apache-rr-310"
TV_URL="https://www.tvsmotor.com"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Create directories
mkdir -p "$BASE_DIR/red/gallery"
mkdir -p "$BASE_DIR/bomber-grey/gallery"

echo "--- Starting Apache RR 310 Media Download ---"

# 1. Racing Red
echo "[1/2] Downloading Racing Red Media..."

# Gallery Images
red_gallery=(
    "/-/media/rr310_new_images/13052025/Webp/TVS-Apache-RR310-Website-Images-adapt-700x500-06.webp"
    "/-/media/rr310_new_images/13052025/Webp/TVS-Apache-RR310-Website-Images-adapt-700x500-07.webp"
    "/-/media/rr310_new_images/13052025/Webp/TVS-Apache-RR310-Website-Images-adapt-700x500-10.webp"
)

i=1
for url in "${red_gallery[@]}"; do
    target="$BASE_DIR/red/gallery/$i.webp"
    echo "  -> Downloading $url as $target"
    curl -L -s -A "$USER_AGENT" -o "$target" "$TV_URL$url"
    
    filesize=$(stat -f%z "$target" 2>/dev/null || stat -c%s "$target" 2>/dev/null)
    if [ "$filesize" -lt 1000 ]; then
        echo "  [FAIL] $url (File too small: $filesize bytes)"
        rm "$target"
    else
        echo "  [DONE] $target ($filesize bytes)"
        if [ $i -eq 1 ]; then
            cp "$target" "$BASE_DIR/red/primary.webp"
            echo "  [COPIED] primary.webp"
        fi
        i=$((i+1))
    fi
done

# 2. Bomber Grey
echo "[2/2] Downloading Bomber Grey Media..."

grey_gallery=(
    "/-/media/rr310_new_images/13052025/Webp/TVS-Apache-RR310-Website-Requirement-2_Book-Online-700X-500-01.webp"
)

i=1
for url in "${grey_gallery[@]}"; do
    target="$BASE_DIR/bomber-grey/gallery/$i.webp"
    echo "  -> Downloading $url as $target"
    curl -L -s -A "$USER_AGENT" -o "$target" "$TV_URL$url"
    
    filesize=$(stat -f%z "$target" 2>/dev/null || stat -c%s "$target" 2>/dev/null)
    if [ "$filesize" -lt 1000 ]; then
        echo "  [FAIL] $url (File too small: $filesize bytes)"
        rm "$target"
    else
        echo "  [DONE] $target ($filesize bytes)"
        if [ $i -eq 1 ]; then
            cp "$target" "$BASE_DIR/bomber-grey/primary.webp"
            echo "  [COPIED] primary.webp"
        fi
        i=$((i+1))
    fi
done

echo "--- Apache RR 310 Media Download Complete ---"
