#!/bin/bash

BASE_DIR="public/media/tvs/ntorq-125"

# Declaring associations: variant/color|image_url
# We'll use a simple format for the bash script to iterate
declarations=(
    "race-edition/race-edition-red|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-edition-red/TVS_Ntorq_Race_Edition_360_01.webp"
    "race-edition/race-edition-yellow|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-Edition-Yellow/TVS_Ntorq_Race_Edition_Yellow_360_01.webp"
    "race-edition/marine-blue|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-Edition/Variant360/Marine-blue/Marine-Blue-01.webp"
    "disc/nardo-grey|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/nardo-grey/Nardo-Grey_W897x504px-01N.webp"
    "xt/xt-neon|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT/360-Variants/XT/XT_Neon-01.webp"
    "super-squad-edition/stealth-black|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Stealth-black/TVS_StealthBlack_360_01.webp"
    "super-squad-edition/combat-blue|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Combat-Blue/Combat-Blue-01.webp"
    "super-squad-edition/lightning-gray|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Lightning-Gray/Lightning-Gray-01.webp"
    "disc/metallic-blue|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/metallic-blue/TVS-Ntorq-metallic-blue-01.webp"
    "disc/metallic-red|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/metallic-red/TVS-Ntorq-metallic-red-01.webp"
    "race-xp/race-xp|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Race-XP/TVS_Ntorq_RaceXP_360_01.webp"
    "super-squad-edition/amazing-red|https://www.tvsmotor.com/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Amazing-Red/Amazing-Red-01.webp"
)

for entry in "${declarations[@]}"; do
    path="${entry%%|*}"
    url="${entry##*|}"
    
    dir="$BASE_DIR/$path"
    mkdir -p "$dir"
    
    echo "Downloading $url to $dir/primary.webp"
    curl -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -o "$dir/primary.webp" "$url"
done

