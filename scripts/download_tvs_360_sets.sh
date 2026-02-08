#!/bin/bash

BASE_DIR="public/media/tvs"
TV_URL="https://www.tvsmotor.com"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Association format: model/variant/color|url_template (use {i} for index)|count
declarations=(
    # JUPITER 110 (36 images)
    "jupiter/smartxonnect-disc/dawn-blue-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/SXC-Disc/Colors/360/sxcdisc/Dawn-Blue-Matte/image{i}.webp|36"
    "jupiter/smartxonnect-disc/galactic-copper-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/SXC-Disc/Colors/360/sxcdisc/Galactic-Copper-Matte/image{i}.webp|36"
    "jupiter/smartxonnect-disc/starlight-blue-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/SXC-Disc/Colors/360/sxcdisc/Starlight-Blue-Gloss/image{i}.webp|36"
    
    "jupiter/smartxonnect-drum/dawn-blue-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Dawn-Blue-Matte/image{i}.webp|36"
    "jupiter/smartxonnect-drum/galactic-copper-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Galactic-Copper-Matte/image{i}.webp|36"
    "jupiter/smartxonnect-drum/starlight-blue-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Starlight-Blue-Gloss/image{i}.webp|36"
    "jupiter/smartxonnect-drum/twilight-purple|/tvs-jupiter/-/media/TVS-Jupiter-110/110-SXC-Drum/Colors/360/sxcdrum/Twilight-Purple-Gloss/image{i}.webp|36"
    
    "jupiter/drum-alloy/dawn-blue-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Dawn-Blue-Matte/image{i}.webp|36"
    "jupiter/drum-alloy/galactic-copper-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Galactic-Copper-Matte/image{i}.webp|36"
    "jupiter/drum-alloy/lunar-white-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Lunar-White-Gloss/image{i}.webp|36"
    "jupiter/drum-alloy/meteor-red-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Meteor-Red-Gloss/image{i}.webp|36"
    "jupiter/drum-alloy/starlight-blue-gloss|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Starlight-Blue-Gloss/image{i}.webp|36"
    "jupiter/drum-alloy/titanium-grey-matte|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Titanium-Grey-Matte/image{i}.webp|36"
    "jupiter/drum-alloy/twilight-purple-new|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/drumalloy/Twilight-purple-new/image{i}.webp|36"
    
    "jupiter/drum/grey|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/Drum/Grey/image{i}.webp|36"
    "jupiter/drum/red|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/Drum/Red/image{i}.webp|36"
    "jupiter/drum/white|/tvs-jupiter/-/media/TVS-Jupiter-110/110-Disc-Drum-Base/Colors/360/Drum/White/image{i}.webp|36"
    
    # JUPITER 125 (36 images)
    "jupiter-125/smartxonnect/elite-green|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/sxc/Elite-Green-New/image{i}.webp|36"
    "jupiter-125/smartxonnect/copper-bronze|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/sxc/copper-bronze/image{i}.webp|36"
    "jupiter-125/smartxonnect/elegant-red|/tvs-jupiter-125/-/media/TVS-Jupiter-125/Jupitersmartxonnect_360_dimension/360-Images---125-Elegant-Red---800x533/image{i}.webp|36"
    "jupiter-125/disc/grey|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/Grey/Grey/800x533/image{i}.webp|36"
    "jupiter-125/disc/indiblue|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/Indiblue/Indiblue/800x533/image{i}.webp|36"
    "jupiter-125/disc/orange|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/Orange/Orange/800x533/image{i}.webp|36"
    "jupiter-125/disc/white|/tvs-jupiter-125/-/media/Jupiter-125-Images/Colors/360/disc/Disc-new/Disc/White/White/800x533/image{i}.webp|36"
    "jupiter-125/disc/sparkling-black|/tvs-jupiter-125/-/media/TVS-Jupiter-125/Disc/jupiter125discsparklingblack/Jupiter_125_Black_800x533_360/image{i}.webp|36"
    
    # RAIDER (36 images)
    "raider/smartxonnect/fiery-yellow|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-new/SX-Yellow/{i}.webp|36"
    "raider/smartxonnect/wicked-black|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-new/SX-Black/{i}.webp|36"
    "raider/igo/nardo-grey|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-new/iGO-Raider/iGO-Raider/{i}.webp|36"
    "raider/split-seat/striking-red|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DISC/RED/769x480/{i}.webp|36"
    "raider/split-seat/wicked-black|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DISC/BLACK/769x480/{i}.webp|36"
    "raider/split-seat/fiery-yellow|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Color-New-images/Split-Seat/OneDrive_1_21-3-2025/Yellow-Webp/{i}.webp|36"
    "raider/split-seat/blazing-blue|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Color-New-images/Split-Seat/OneDrive_1_21-3-2025/Blazing-blue/Blue/Webp/{i}.webp|36"
    "raider/single-seat/striking-red|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DRUM/RED/769x480/{i}.webp|36"
    "raider/single-seat/wicked-black|/tvs-raider/-/media/Brand-Pages-Webp/Raider/RevisedRaider360Images/DRUM/BLACK/769x480/{i}.webp|36"
    "raider/sse/deadpool|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/Deadpool/{i}.webp|36"
    "raider/sse/black-panther|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/SSE-Webpp/Black-Panther/{i}.webp|36"
    "raider/sse/iron-man|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/SSE-Webpp/Iron-Man/{i}.webp|36"
    "raider/sse/wolverine|/tvs-raider/-/media/Brand-Pages-Webp/Raider/Raider-360/360-raider/SSE/Wolverine/{i}.webp|36"

    # NTORQ-125 (36 images)
    "ntorq-125/race-edition/race-edition-red|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-edition-red/TVS_Ntorq_Race_Edition_360_{i}.webp|36"
    "ntorq-125/race-edition/race-edition-yellow|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-Edition/360-color/Race-Edition-Yellow/TVS_Ntorq_Race_Edition_Yellow_360_{i}.webp|36"
    "ntorq-125/race-edition/marine-blue|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/Race-Edition/Variant360/Marine-blue/Marine-Blue-0{i}.webp|36"
    "ntorq-125/disc/nardo-grey|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/125-Base/Variant360/nardo-grey/Nardo-Grey_W897x504px-0{i}N.webp|36"
    "ntorq-125/xt/xt-neon|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT/360-Variants/XT/XT_Neon-0{i}.webp|36"
    "ntorq-125/super-squad-edition/stealth-black|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Stealth-black/TVS_StealthBlack_360_0{i}.webp|36"
    "ntorq-125/super-squad-edition/combat-blue|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Combat-Blue/Combat-Blue-0{i}.webp|36"
    "ntorq-125/super-squad-edition/lightning-gray|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Lightning-Gray/Lightning-Gray-0{i}.webp|36"
    "ntorq-125/disc/metallic-blue|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/metallic-blue/TVS-Ntorq-metallic-blue-0{i}.webp|36"
    "ntorq-125/disc/metallic-red|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Ntorq-125/Base-360-Colors/metallic-red/TVS-Ntorq-metallic-red-0{i}.webp|36"
    "ntorq-125/race-xp/race-xp|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-Ntorq/Ntorq-new-29-10-25/Race-XP/360-color/Race-XP/TVS_Ntorq_RaceXP_360_0{i}.webp|36"
    "ntorq-125/super-squad-edition/amazing-red|/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/SSE/Variant360/Amazing-Red/Amazing-Red-0{i}.webp|36"

    # APACHE RTR 160 2V (36 images)
    "apache-160-2v/disc/racing-red|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Racing-red/{i}.webp|36"
    "apache-160-2v/disc/matte-blue|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Matte-blue/{i}.webp|36"
    "apache-160-2v/disc/t-grey|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/T-grey/{i}.webp|36"
    "apache-160-2v/disc/glossy-black|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Glossy-black/{i}.webp|36"
    "apache-160-2v/disc/pearl-white|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Pearl-white/{i}.webp|36"

    # APACHE RTR 200 4V (36 images)
    "apache-200-4v/disc/racing-red|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-200-4V/webp/color/Racing-red/{i}.webp|36"
    "apache-200-4v/disc/matte-blue|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-200-4V/webp/color/Matte-blue/{i}.webp|36"
    "apache-200-4v/disc/matte-black|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-200-4V/webp/color/Matte-black/{i}.webp|36"

    # APACHE RTR 160 4V (36 images)
    "apache-160-4v/disc/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/Racing-Red/{i}.webp|36"
    "apache-160-4v/disc/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/Knight-Black/{i}.webp|36"
    "apache-160-4v/special-edition/matte-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/Special-Edition-Matte-Black/{i}.webp|36"
    "apache-160-4v/dual-channel-abs-usd/granite-grey|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/360-View/USD-Granite-Grey/{i}.webp|36"

    # XL100 (36 images)
    "xl100/heavy-duty/red|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Red-New/{i}.webp|36"
    "xl100/heavy-duty/blue|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Blue/{i}.webp|36"
    "xl100/heavy-duty/green|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Green/{i}.webp|36"
    "xl100/heavy-duty/grey|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Grey-New/{i}.webp|36"

    # RADEON (36 images)
    "radeon/base/metal-black|/commuter/tvs-radeon/-/media/Brand-Pages/Radeon/1107/Radeon-Website_-360-View-Metals_-METAL-BLACK/{i}.webp|36"
    "radeon/base/royal-purple|/commuter/tvs-radeon/-/media/Brand-Pages/Radeon/1107/Radeon-Website_-360-View-Metals_-ROYAL-PURPLE/{i}.webp|36"
    "radeon/base/titanium-grey|/commuter/tvs-radeon/-/media/Brand-Pages/Radeon/1107/Radeon-Website_-360-View-Metals_-TITANIUM-GREY/{i}.webp|36"
)

function download_items() {
    for entry in "${declarations[@]}"; do
        path="${entry%%|*}"
        template_middle="${entry%|*}"
        template="${template_middle##*|}"
        count="${entry##*|}"
        
        dir="$BASE_DIR/$path/360"
        mkdir -p "$dir"
        
        echo "Updating 360 set for $path ($count images)..."
        for i in $(seq 1 "$count"); do
            url_path="${template//\{i\}/$i}"
            full_url="$TV_URL$url_path"
            target="$dir/image$i.webp"
            
            # Download silently
            curl -L -s -A "$USER_AGENT" -o "$target" "$full_url"
            
            # Verify if it is a valid WebP image (TVS 404s are ~93KB HTML files)
            if ! file "$target" | grep -q "Web/P image"; then
                echo "  [ERROR] Invalid file downloaded from $full_url. Removing."
                rm "$target"
            fi
        done
    done
}

download_items
echo "--- 360 Localization Step Complete ---"
