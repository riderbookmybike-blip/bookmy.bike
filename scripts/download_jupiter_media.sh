#!/bin/bash

BASE_DIR="public/media/tvs"
TV_URL="https://www.tvsmotor.com"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# JUPITER 110
declarations_jup=(
    "jupiter/smartxonnect-disc/dawn-blue-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/SXC-Disc/Colors/360/sxcdisc/Dawn-Blue-Matte/image1.webp"
    "jupiter/smartxonnect-disc/galactic-copper-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/SXC-Disc/Colors/360/sxcdisc/Galactic-Copper-Matte/image1.webp"
    "jupiter/smartxonnect-disc/starlight-blue-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/SXC-Disc/Colors/360/sxcdisc/Starlight-Blue-Gloss/image1.webp"
    
    "jupiter/smartxonnect-drum/dawn-blue-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Dawn-Blue-Matte/image1.webp"
    "jupiter/smartxonnect-drum/galactic-copper-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Galactic-Copper-Matte/image1.webp"
    "jupiter/smartxonnect-drum/starlight-blue-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Starlight-Blue-Gloss/image1.webp"
    
    "jupiter/drum-alloy/dawn-blue-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Dawn-Blue-Matte/image1.webp"
    "jupiter/drum-alloy/galactic-copper-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Galactic-Copper-Matte/image1.webp"
    "jupiter/drum-alloy/lunar-white-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Lunar-White-Gloss/image1.webp"
    "jupiter/drum-alloy/meteor-red-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Meteor-Red-Gloss/image1.webp"
    "jupiter/drum-alloy/starlight-blue-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Starlight-Blue-Gloss/image1.webp"
    "jupiter/drum-alloy/titanium-grey-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Titanium-Grey-Matte/image1.webp"
    "jupiter/drum-alloy/twilight-purple-new|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Twilight-purple-new/image1.webp"
    
    "jupiter/drum/grey|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/Drum/Grey/image1.webp"
    "jupiter/drum/red|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/Drum/Red/image1.webp"
    "jupiter/drum/white|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/Drum/White/image1.webp"
)

# JUPITER 125
declarations_jup125=(
    "jupiter-125/smartxonnect/elite-green|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/sxc/Elite-Green-New/image1.webp"
    "jupiter-125/smartxonnect/copper-bronze|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/sxc/copper-bronze/image1.webp"
    "jupiter-125/smartxonnect/elegant-red|/tvs-jupiter-125/-/media/TVS-Jupiter-125/Jupitersmartxonnect_360_dimension/360-Images---125-Elegant-Red---800x533/image1.webp"
    
    "jupiter-125/disc/grey|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/Grey/Grey/800x533/image1.webp"
    "jupiter-125/disc/indiblue|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/Indiblue/Indiblue/800x533/image1.webp"
    "jupiter-125/disc/orange|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/Orange/Orange/800x533/image1.webp"
    "jupiter-125/disc/white|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/White/White/800x533/image1.webp"
    "jupiter-125/disc/sparkling-black|/tvs-jupiter-125/-/media/TVS-Jupiter-125/Disc/jupiter125discsparklingblack/Jupiter_125_Black_800x533_360/image1.webp"
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

echo "--- Downloading Jupiter 110 Assets ---"
download_items "${declarations_jup[@]}"

echo "--- Downloading Jupiter 125 Assets ---"
download_items "${declarations_jup125[@]}"

echo "--- All Downloads Complete ---"
