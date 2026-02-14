/**
 * 🏍️ Suzuki Avenis — Complete Image Extraction
 *
 * STEP 1: Open https://www.suzukimotorcycle.co.in/product-details/avenis
 * STEP 2: Open DevTools Console (Cmd+Option+J)
 * STEP 3: Paste this ENTIRE script and press Enter
 * STEP 4: Copy the JSON output and send it to the assistant
 */

(async () => {
    console.log('🏍️ Scanning page for all Avenis images...\n');

    const allUrls = new Set();

    // 1. Scan ALL <img> tags
    document.querySelectorAll('img').forEach(img => {
        [img.src, img.dataset.src, img.dataset.lazySrc, img.getAttribute('data-original')].forEach(u => {
            if (u && u.startsWith('http')) allUrls.add(u);
        });
        (img.srcset || '').split(',').forEach(e => {
            const u = e.trim().split(' ')[0];
            if (u && u.startsWith('http')) allUrls.add(u);
        });
    });

    // 2. Scan <source> tags (inside <picture>)
    document.querySelectorAll('source').forEach(src => {
        (src.srcset || '').split(',').forEach(e => {
            const u = e.trim().split(' ')[0];
            if (u && u.startsWith('http')) allUrls.add(u);
        });
    });

    // 3. Scan CSS background-image
    document.querySelectorAll('*').forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
            const m = bg.match(/url\(["']?(https?:\/\/[^"')]+)/);
            if (m) allUrls.add(m[1]);
        }
    });

    // 4. Scan inline styles
    document.querySelectorAll('[style*="url"]').forEach(el => {
        const m = el.style.cssText.match(/url\(["']?(https?:\/\/[^"')]+)/g);
        if (m)
            m.forEach(u => {
                const clean = u.replace(/url\(["']?/, '');
                if (clean.startsWith('http')) allUrls.add(clean);
            });
    });

    // 5. Scan all <script> tags for embedded URLs
    document.querySelectorAll('script').forEach(s => {
        const text = s.textContent || '';
        const matches = text.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp|svg)/gi);
        if (matches) matches.forEach(u => allUrls.add(u));
    });

    // 6. Check for __NEXT_DATA__ or __JSS_STATE__ (common in modern frameworks)
    ['__NEXT_DATA__', '__JSS_STATE__'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const text = el.textContent || '';
            const matches = text.match(/https?:\/\/[^\s"'<>\\]+\.(png|jpg|jpeg|webp|svg)/gi);
            if (matches) {
                console.log(`Found ${matches.length} URLs in ${id}`);
                matches.forEach(u => allUrls.add(u.replace(/\\\//g, '/')));
            }
        }
    });

    // 7. Check all link[rel=preload] and meta[property*=image]
    document.querySelectorAll('link[rel="preload"][as="image"], meta[property*="image"]').forEach(el => {
        const u = el.href || el.content;
        if (u && u.startsWith('http')) allUrls.add(u);
    });

    // Categorize
    const urls = [...allUrls];
    const colorImages = urls.filter(
        u => /color|colour|exterior|bike.*color/i.test(u) || /avenis.*\.(png|jpg|jpeg|webp)$/i.test(u)
    );
    const threeSixty = urls.filter(u => /360|rotate|spin/i.test(u));
    const otherImages = urls.filter(
        u => !colorImages.includes(u) && !threeSixty.includes(u) && /\.(png|jpg|jpeg|webp)$/i.test(u)
    );

    console.log(`\n📊 Results:`);
    console.log(`   All URLs: ${urls.length}`);
    console.log(`   Color/Exterior: ${colorImages.length}`);
    console.log(`   360°: ${threeSixty.length}`);
    console.log(`   Other images: ${otherImages.length}`);

    const result = {
        allImageUrls: urls.filter(u => /\.(png|jpg|jpeg|webp|svg)$/i.test(u)),
        colorImages,
        threeSixtyFrames: threeSixty,
        otherImages,
        total: urls.length,
        timestamp: new Date().toISOString(),
    };

    console.log('\n' + '='.repeat(80));
    console.log('📋 COPY THIS JSON AND SEND TO ASSISTANT:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result, null, 2));

    // Also try to auto-download by cycling through colors
    console.log('\n🎨 Now cycling through color swatches...');
    const swatches = document.querySelectorAll(
        '[class*="color"] li, [class*="colour"] li, .color-list li, .color-option'
    );
    for (let i = 0; i < swatches.length; i++) {
        swatches[i].click();
        await new Promise(r => setTimeout(r, 1500));
        const mainImg = document.querySelector(
            '.bike-image img, .exterior-image img, [class*="product"] img, [class*="bike-view"] img'
        );
        if (mainImg) {
            const src = mainImg.src || mainImg.dataset.src;
            const name = swatches[i].title || swatches[i].textContent?.trim() || `color-${i + 1}`;
            console.log(`  ${name}: ${src}`);
            result.colorImages.push(src);
        }
    }

    return result;
})();
