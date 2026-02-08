#!/bin/bash

BASE_DIR="public/media/tvs"
TV_URL="https://www.tvsmotor.com"
USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Association format: model/variant/color|url_path
declarations=(
    # APACHE RTR 160 2V
    "apache-160-2v/disc/racing-red|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Racing-red/1.webp"
    "apache-160-2v/disc/matte-blue|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Matte-blue/1.webp"
    "apache-160-2v/disc/t-grey|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/T-grey/1.webp"
    "apache-160-2v/disc/glossy-black|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Glossy-black/1.webp"
    "apache-160-2v/disc/pearl-white|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-160/webp/color/Pearl-white/1.webp"
    
    # APACHE RTR 160 4V
    "apache-160-4v/rm-disc-black-edition/black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Black-Edition.webp"
    "apache-160-4v/drum/racing-red|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Racing-red.webp"
    "apache-160-4v/drum/knight-black|/tvs-apache/-/media/Brand-Pages-Webp/RTR-160-4V/Desktop/Color/Knight-black.webp"
    "apache-160-4v/drum/racing-red|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/red.webp"
    "apache-160-4v/disc/racing-red|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/red.webp"
    "apache-160-4v/disc/knight-black|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/black.webp"
    "apache-160-4v/bt-disc/racing-red|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/red.webp"
    "apache-160-4v/bt-disc/knight-black|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/black.webp"
    "apache-160-4v/bt-disc/lightning-blue|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/blue.webp"
    "apache-160-4v/special-edition/matte-black|/-/media/apache_160_2v_new_addition/oct24/160_4v_Matte_Black_Tank.webp"
    "apache-160-4v/dual-channel-abs/racing-red|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/red.webp"
    "apache-160-4v/dual-channel-abs/knight-black|/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-4V/black.webp"
    "apache-160-4v/dual-channel-abs/matte-black|/-/media/apache_160_2v_new_addition/oct24/160_4v_Matte_Black_Tank.webp"
    "apache-160-4v/dual-channel-abs-usd/granite-grey|/-/media/apache_160_2v_new_addition/oct24/160_4v_Granite_Grey_Tank.webp"
    "apache-160-4v/dual-channel-abs-usd/matte-black|/-/media/apache_160_2v_new_addition/oct24/160_4v_Matte_Black_Tank.webp"
    "apache-160-4v/dual-channel-abs-usd/pearl-white|/-/media/apache_160_2v_new_addition/oct24/160_4v_Pearl_White_Tank.webp"
    "apache-160-4v/tft/granite-grey|/-/media/apache_160_2v_new_addition/oct24/160_4v_Granite_Grey_Tank.webp"
    "apache-160-4v/tft/matte-black|/-/media/apache_160_2v_new_addition/oct24/160_4v_Matte_Black_Tank.webp"
    "apache-160-4v/tft/pearl-white|/-/media/apache_160_2v_new_addition/oct24/160_4v_Pearl_White_Tank.webp"
    
    # APACHE RTR 200 4V
    "apache-200-4v/disc/racing-red|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-200-4V/webp/color/Racing-red/1.webp"
    "apache-200-4v/disc/matte-blue|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-200-4V/webp/color/Matte-blue/1.webp"
    "apache-200-4v/disc/matte-black|/tvs-apache/-/media/Brand-Pages/Apache/Apache-RTR/Apache-RTR-200-4V/webp/color/Matte-black/1.webp"
    
    # RONIN
    "ronin/base/magma-red|/tvs-ronin/-/media/ronin-new-variant/Cult-logo-upldated-images/Main-website-adapts_Ronin_CultLogo_ColorSelection_MagmaRed.webp"
    "ronin/base/galatic-grey|/tvs-ronin/-/media/ronin-new-variant/Cult-logo-upldated-images/Main-website-adapts_Ronin_CultLogo_ColorSelection_GalacticGrey.webp"
    "ronin/base/dawn-orange|/tvs-ronin/-/media/ronin-new-variant/Cult-logo-upldated-images/Main-website-adapts_Ronin_CultLogo_ColorSelection_DawnOrange.webp"
    "ronin/top/agonda-white|/tvs-ronin/-/media/ronin-new-variant/Agonda-White/Banner/TVS-Ronin-Agonda-Website-Adapts_Banner-1920-X-843-copy.webp"
    
    # IQUBE
    "iqube/standard/pearl-white|/electric-scooters/tvs-iqube/-/media/Vehicles/Feature/Iqube/Variant/TVS-iQube-3-0-KW/Color-Images/Pearl-White/3-kw-pearl-white-01.webp"
    "iqube/standard/copper-bronze|/electric-scooters/tvs-iqube/-/media/Vehicles/Feature/Iqube/Variant/TVS-iQube-3-0-KW/Color-Images/Copper-Brown/3-kw-copper-brown-01.webp"
    "iqube/standard/shining-blue|/electric-scooters/tvs-iqube/-/media/Vehicles/Feature/Iqube/Variant/TVS-iQube-3-0-KW/Color-Images/Shining-Blue/3-kw-shining-blue-01.webp"
    
    # XL100
    "xl100/heavy-duty/red|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Red-New/1.webp"
    "xl100/heavy-duty/blue|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Blue/1.webp"
    "xl100/heavy-duty/green|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Green/1.webp"
    "xl100/heavy-duty/grey|/tvs-xl100/-/media/Brand-Pages/XL100/Colours/TVS-XL100-HD-Alloy/Grey-New/1.webp"
    
    # RADEOON
    "radeon/base/metal-black|/commuter/tvs-radeon/-/media/Brand-Pages/Radeon/1107/Radeon-Website_-360-View-Metals_-METAL-BLACK/1.webp"
    "radeon/base/royal-purple|/commuter/tvs-radeon/-/media/Brand-Pages/Radeon/1107/Radeon-Website_-360-View-Metals_-ROYAL-PURPLE/1.webp"
    "radeon/base/titanium-grey|/commuter/tvs-radeon/-/media/Brand-Pages/Radeon/1107/Radeon-Website_-360-View-Metals_-TITANIUM-GREY/1.webp"
)

function download_items() {
    for entry in "${declarations[@]}"; do
        path="${entry%%|*}"
        url_path="${entry##*|}"
        full_url="$TV_URL$url_path"
        
        dir="$BASE_DIR/$path"
        mkdir -p "$dir"
        
        echo "Downloading $full_url to $dir/primary.webp"
        curl -L -s -A "$USER_AGENT" -o "$dir/primary.webp" "$full_url"
        
        # Verify if it is a valid WebP image (TVS 404s are ~93KB HTML files)
        if ! file "$dir/primary.webp" | grep -q "Web/P image"; then
            echo "  [ERROR] Invalid file downloaded from $full_url. Removing."
            rm "$dir/primary.webp"
        else
            echo "  [SUCCESS] Valid WebP asset saved."
        fi
    done
}

echo "--- Starting Mass Localization for TVS ---"
download_items
echo "--- Mass Localization Complete ---"
