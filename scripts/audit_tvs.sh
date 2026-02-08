#!/bin/bash

BASE_DIR="public/media/tvs"

echo "| Model | Variant | Color | Primary | 360 Count | Status |"
echo "|-------|---------|-------|---------|-----------|--------|"

for model_path in "$BASE_DIR"/*; do
    [ -d "$model_path" ] || continue
    model=$(basename "$model_path")
    
    for variant_path in "$model_path"/*; do
        [ -d "$variant_path" ] || continue
        variant=$(basename "$variant_path")
        
        for color_path in "$variant_path"/*; do
            [ -d "$color_path" ] || continue
            color=$(basename "$color_path")
            
            # Count primary images in color folder (excluding 360 dir)
            primary_count=$(find "$color_path" -maxdepth 1 -type f \( -name "*.webp" -o -name "*.png" -o -name "*.jpg" \) | wc -l | xargs)
            
            # Count 360 images
            three_sixty_dir="$color_path/360"
            if [ -d "$three_sixty_dir" ]; then
                three_sixty_count=$(find "$three_sixty_dir" -maxdepth 1 -type f \( -name "*.webp" -o -name "*.png" -o -name "*.jpg" \) | wc -l | xargs)
            else
                three_sixty_count=0
            fi
            
            # Status logic
            status=""
            if [ "$primary_count" -eq 0 ]; then
                status="❌ No Primary"
            elif [ "$three_sixty_count" -gt 0 ] && [ "$three_sixty_count" -lt 25 ]; then
                status="⚠️ Partial 360 ($three_sixty_count)"
            elif [ "$three_sixty_count" -eq 0 ]; then
                status="ℹ️ No 360"
            else
                status="✅ Complete"
            fi
            
            echo "| $model | $variant | $color | $primary_count | $three_sixty_count | $status |"
        done
    done
done
