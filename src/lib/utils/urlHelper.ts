/**
 * URL Helper Utility for bookmy.bike
 * Enforces strict SEO-friendly hierarchical URL generation.
 */

interface BuildUrlOptions {
    make: string;
    model: string;
    variant: string;
    color?: string;
    pincode?: string;
    region?: string;
    dealer?: string;
    leadId?: string;
}

interface UrlResult {
    url: string;           // The user-facing URL for sharing
    canonicalUrl: string;  // The SEO truth
    robots: 'index,follow' | 'noindex,follow';
}

/**
 * Basic slugify implementation
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
}

/**
 * buildProductUrl
 * Generates the correct preferred URL and SEO metadata.
 * Pattern: /store/{make}/{model}/{variant}?color=...&pincode=...
 */
export function buildProductUrl(options: BuildUrlOptions): UrlResult {
    const { make, model, variant, color, pincode, region, dealer, leadId } = options;

    // 1. Identifiers (Path Segments)
    const makeSlug = slugify(make);
    const modelSlug = slugify(model);
    const variantSlug = slugify(variant);

    // 2. Base Path Hierachy: /store/make/model/variant
    let path = `/store/${makeSlug}/${modelSlug}/${variantSlug}`;

    // 3. Dealer Context Prefix
    if (dealer) {
        path = `/dealers/${slugify(dealer)}${path}`;
    }

    // 4. Construct Query Params (Context)
    const params = new URLSearchParams();
    if (color) params.set('color', slugify(color));
    if (pincode) params.set('pincode', pincode);
    if (region) params.set('region', slugify(region));
    if (leadId) params.set('leadId', leadId);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    // 5. Canonical Truth is ALWAYS the non-dealer, non-loc, non-color master variant
    const canonicalUrl = `/store/${makeSlug}/${modelSlug}/${variantSlug}`;

    // 6. Robots Rules
    // Noindex if location, dealer context, or color (optional) is present
    const isContextual = !!(pincode || region || dealer || color);
    const robots = isContextual ? 'noindex,follow' : 'index,follow';

    return {
        url: `${path}${queryString}`,
        canonicalUrl,
        robots
    };
}
