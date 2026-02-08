#!/bin/bash

BASE_URL="https://www.tvsmotor.com"
MEDIA_ROOT="public/media/tvs/apache-160-2v"

download_image() {
    local source_url="$1"
    local dest_path="$2"
    
    mkdir -p "$(dirname "$dest_path")"
    if [[ "$source_url" == /* ]]; then
        full_url="${BASE_URL}${source_url}"
    else
        full_url="$source_url"
    fi
    
    echo "Downloading $full_url to $dest_path..."
    curl -s -o "$dest_path" "$full_url"
}

# 1. Black Edition - Glossy Black
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/2v_glossy_black.webp" "${MEDIA_ROOT}/black-edition/glossy-black/primary.webp"

# 2. RM Drum
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/black.webp" "${MEDIA_ROOT}/rm-drum/gloss-black/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/white.webp" "${MEDIA_ROOT}/rm-drum/pearl-white/primary.webp"

# 3. RM Disc
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/black.webp" "${MEDIA_ROOT}/rm-disc/gloss-black/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/blue.webp" "${MEDIA_ROOT}/rm-disc/matte-blue/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/white.webp" "${MEDIA_ROOT}/rm-disc/pearl-white/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/red.webp" "${MEDIA_ROOT}/rm-disc/racing-red/primary.webp"

# 4. RM Disc BT
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/black.webp" "${MEDIA_ROOT}/rm-disc-bt/gloss-black/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/blue.webp" "${MEDIA_ROOT}/rm-disc-bt/matte-blue/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/white.webp" "${MEDIA_ROOT}/rm-disc-bt/pearl-white/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/red.webp" "${MEDIA_ROOT}/rm-disc-bt/racing-red/primary.webp"
download_image "/-/media/BookOnline-V2/Motorcycle/APACHE-RTR-160-2V/grey.webp" "${MEDIA_ROOT}/rm-disc-bt/t-grey/primary.webp"

# 5. Racing Edition
# Note: The JSS state used a generic book_online_desktop for this. I'll use it but might need a specific one later.
download_image "/-/media/BookOnline-V2/book_online_desktop.webp" "${MEDIA_ROOT}/racing-edition/matte-black/primary.webp"

# 6. Dual Channel ABS
download_image "/-/media/U750/13062025/RTR1602V_BOOK-ONLINE_700X500_MATTE-BLACK.webp" "${MEDIA_ROOT}/dual-channel-abs/matte-black/primary.webp"
download_image "/-/media/U750/13062025/RTR1602V_BOOK-ONLINE_700X500_PEARL-WHITE.webp" "${MEDIA_ROOT}/dual-channel-abs/pearl-white/primary.webp"

echo "Media download complete."
