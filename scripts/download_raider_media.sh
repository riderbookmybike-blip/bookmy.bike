#!/bin/bash

BASE_DIR="public/media/tvs"
TV_URL="https://www.tvsmotor.com"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# RAIDER
declarations_raider=(
    "raider/smartxonnect/fiery-yellow|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-new/SX-Yellow/1.webp"
    "raider/smartxonnect/wicked-black|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-new/SX-Black/1.webp"
    
    "raider/igo/nardo-grey|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-new/iGO-Raider/iGO-Raider/1.webp"
    
    "raider/sse/deadpool|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/Deadpool/1.webp"
    "raider/sse/black-panther|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/SSE-Webpp/Black-Panther/1.webp"
    "raider/sse/iron-man|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/SSE-Webpp/Iron-Man/1.webp"
    "raider/sse/wolverine|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/Wolverine/1.webp"
    
    "raider/split-seat/striking-red|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DISC/RED/769x480/1.webp"
    "raider/split-seat/wicked-black|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DISC/BLACK/769x480/1.webp"
    "raider/split-seat/fiery-yellow|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Color-New-images/Split-Seat/OneDrive_1_21-3-2025/Yellow-Webp/1.webp"
    "raider/split-seat/blazing-blue|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Color-New-images/Split-Seat/OneDrive_1_21-3-2025/Blazing-blue/Blue/Webp/1.webp"
    
    "raider/single-seat/striking-red|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DRUM/RED/769x480/1.webp"
    "raider/single-seat/wicked-black|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DRUM/BLACK/769x480/1.webp"
)

function download_items() {
    local decls=("$@")
    for entry in "${decls[@]}"; do
        path="${entry%%|*}"
        url_path="${entry##*|}"
        full_url="$TV_URL$url_path"
        
        dir="$BASE_DIR/$path"
        mkdir -p "$dir"
        
        echo "Downloading $full_url to $dir/primary.webp"
        curl -L -A "$USER_AGENT" -o "$dir/primary.webp" "$full_url"
    done
}

echo "--- Downloading Raider Assets ---"
download_items "${declarations_raider[@]}"

echo "--- All Downloads Complete ---"
