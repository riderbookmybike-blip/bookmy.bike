import json
import re

# The user provided a large snippet. I will search for the relevant structures.
source = """
[PASTE SNIPPET PORTION HERE IF NEEDED, BUT I'LL EXTRACT FROM THE CURRENT CONTEXT]
"""

# I'll use regex to grab the image sets for XT and others from the snippet provided in the prompt.
# Specifically looking for "ColourImages" and "VariantColorImages" patterns.

# XT Neon images
xt_neon_images = [
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N01.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N02.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N03.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N04.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N05.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N06.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N07.webp",
    "/commuter/tvs-ntorq/-/media/commuter-app/Tvs-u577/XT-variant/360/W897x504px/XT_W897x504px-N08.webp"
]

# Disc Metallic Blue images (from the truncated footer)
disc_blue_images = [
    "/-/media/BookOnline-V2/Scooter/TVS-NTORQ-125/Disc/Metallic-Blue/left.png",
    "/-/media/BookOnline-V2/Scooter/TVS-NTORQ-125/Disc/Metallic-Blue/front.png",
    "/-/media/BookOnline-V2/Scooter/TVS-NTORQ-125/Disc/Metallic-Blue/right.png",
    "/-/media/BookOnline-V2/Scooter/TVS-NTORQ-125/Disc/Metallic-Blue/back.png"
]

def format_urls(urls):
    return [f"https://www.tvsmotor.com{url}?smart_crop=1&scale=1" for url in urls]

print("XT NEON:", json.dumps(format_urls(xt_neon_images)))
print("DISC BLUE:", json.dumps(format_urls(disc_blue_images)))
