'use server';

/**
 * scraperAction.ts — Controlled Ingestion Engine (Server Actions)
 *
 * Provides server-side actions for:
 * 1. Parsing raw HTML or JSON from OEM websites.
 * 2. Extracting models, variants, colors, and media URLs.
 * 3. Returning structured data for client-side review (NO auto-writes).
 *
 * Architecture:
 * - BaseExtractor interface for all brand handlers.
 * - Extractor Registry maps domain -> handler.
 * - Provenance contract attached to every extracted item.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface Provenance {
    source_url: string;
    fetched_at: string; // ISO timestamp
    parser_version: string;
    external_id: string; // Unique ID from the source (e.g., Sitecore GUID)
    brand_slug: string;
}

export interface ExtractedColor {
    name: string;
    hex_primary?: string;
    hex_secondary?: string;
    finish?: string;
    media_urls: string[]; // Full URLs to images
    video_urls?: string[];
    provenance: Provenance;
}

export interface ExtractedVariant {
    name: string;
    specs: Record<string, unknown>;
    price?: number;
    colors: ExtractedColor[];
    provenance: Provenance;
}

export interface ExtractedModel {
    name: string;
    category?: string; // MOTORCYCLE, SCOOTER, MOPED
    specs: Record<string, unknown>;
    variants: ExtractedVariant[];
    provenance: Provenance;
    related_models?: ExtractedModel[]; // Optional child models (e.g., Series expansion)
}

export interface ExtractionResult {
    success: boolean;
    brand_slug: string;
    models: ExtractedModel[];
    raw_json?: unknown; // For "Raw Inspector" fallback mode
    errors: string[];
    logs: ExtractorLog[];
}

export interface ExtractorLog {
    event: 'INIT_FETCH' | 'PARSE_SUCCESS' | 'PARSE_FAIL' | 'EXTRACTOR_MATCH' | 'FALLBACK_MODE' | 'ASSET_FOUND';
    message: string;
    timestamp: string;
    data?: Record<string, unknown>;
}

// ─── Domain Allowlist ───────────────────────────────────────────────────

const DOMAIN_ALLOWLIST = [
    'tvsmotor.com',
    'heromotocorp.com',
    'honda2wheelersindia.com',
    'bajajauto.com',
    'suzukimotorcycle.co.in',
    'yamaha-motor-india.com',
    'bikewale.com',
    'bikedekho.com',
];

function isAllowedDomain(url: string): boolean {
    try {
        const parsed = new URL(url);
        return DOMAIN_ALLOWLIST.some(d => parsed.hostname.endsWith(d));
    } catch {
        return false;
    }
}

function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        // Enforce https
        parsed.protocol = 'https:';
        // Strip tracking params
        const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
        stripParams.forEach(p => parsed.searchParams.delete(p));
        return parsed.toString();
    } catch {
        return url;
    }
}

// ─── Extractor Interface ────────────────────────────────────────────────

interface BaseExtractor {
    readonly PARSER_VERSION: string;
    readonly BRAND_SLUG: string;
    canHandle(url: string, sourceHtml: string): boolean;
    extract(sourceHtml: string, sourceUrl: string): ExtractionResult;
}

// ─── Helper: Create Log Entry ───────────────────────────────────────────

function log(event: ExtractorLog['event'], message: string, data?: Record<string, unknown>): ExtractorLog {
    return { event, message, timestamp: new Date().toISOString(), data };
}

// ─── TVS Extractor (JSS_STATE) ──────────────────────────────────────────

const TvsExtractor: BaseExtractor = {
    PARSER_VERSION: 'tvs-jss-v1.0',
    BRAND_SLUG: 'tvs',

    canHandle(url: string, sourceHtml: string): boolean {
        if (url && url.includes('tvsmotor.com')) return true;
        if (sourceHtml && sourceHtml.includes('__JSS_STATE__')) return true;
        return false;
    },

    extract(sourceHtml: string, sourceUrl: string): ExtractionResult {
        const logs: ExtractorLog[] = [];
        const errors: string[] = [];
        const models: ExtractedModel[] = [];

        logs.push(log('INIT_FETCH', `Starting TVS extraction`, { url: sourceUrl }));

        // Extract __JSS_STATE__ JSON
        const jssMatch = sourceHtml.match(/id="__JSS_STATE__">([\s\S]*?)<\/script>/);
        if (!jssMatch) {
            logs.push(log('PARSE_FAIL', 'JSS_STATE not found'));
            const fallbackModels = extractTvsModelsFromHtml(sourceHtml, sourceUrl, this.PARSER_VERSION, logs);
            if (fallbackModels.length > 0) {
                logs.push(log('FALLBACK_MODE', `HTML fallback extracted ${fallbackModels.length} models`));
                return { success: true, brand_slug: 'tvs', models: fallbackModels, errors, logs };
            }
            errors.push('JSS_STATE script tag not found in source HTML');
            return { success: false, brand_slug: 'tvs', models, errors, logs };
        }

        let jssData: any;
        try {
            jssData = JSON.parse(jssMatch[1]);
        } catch (e: any) {
            errors.push(`Failed to parse JSS_STATE JSON: ${e.message}`);
            logs.push(log('PARSE_FAIL', 'JSON parse error', { error: e.message }));
            return { success: false, brand_slug: 'tvs', models, errors, logs };
        }

        logs.push(log('PARSE_SUCCESS', 'JSS_STATE parsed successfully'));

        // Navigate the TVS Sitecore structure
        let vehicles: any[] = [];
        const routeFields = jssData?.sitecore?.route?.fields;
        if (routeFields?.Vehicles) {
            vehicles = routeFields.Vehicles;
        } else {
            // Try placeholders path
            const placeholders = jssData?.sitecore?.route?.placeholders;
            if (placeholders?.['jss-main']) {
                for (const p of placeholders['jss-main']) {
                    if (p?.fields?.Vehicles) {
                        vehicles = p.fields.Vehicles;
                        break;
                    }
                }
            }
        }

        if (!vehicles.length) {
            const listingModels = extractTvsModelsFromProductListing(jssData, sourceUrl, this.PARSER_VERSION, logs);
            if (listingModels.length > 0) {
                logs.push(log('PARSE_SUCCESS', `ProductListing extracted ${listingModels.length} models`));
                return { success: true, brand_slug: 'tvs', models: listingModels, errors, logs };
            }
        }

        if (!vehicles.length) {
            // Maybe it's a single-model page
            const singleModel = extractSingleTvsModel(jssData, sourceUrl, this.PARSER_VERSION, logs);
            if (singleModel) {
                models.push(singleModel);
            } else {
                errors.push('No vehicles found in JSS_STATE structure');
                logs.push(log('PARSE_FAIL', 'Empty vehicles array'));
            }
            return { success: models.length > 0, brand_slug: 'tvs', models, errors, logs };
        }

        // Process each vehicle type (Motorcycles, Scooters, Mopeds)
        for (const vehicleType of vehicles) {
            const typeName = vehicleType?.fields?.VehicleTypeName?.value || 'Unknown';
            const category = mapTvsCategory(typeName);
            const activeVehicles = vehicleType?.fields?.ActiveVehicles || [];

            for (const v of activeVehicles) {
                const vName = v?.fields?.VehicleName?.value;
                const vId = v?.id;
                if (!vName) continue;

                const modelSpecs: Record<string, unknown> = {};
                // Extract displacement if present
                const displacement = v?.fields?.Displacement?.value;
                if (displacement) {
                    modelSpecs.engine_cc = parseNumeric(displacement);
                }

                const variants: ExtractedVariant[] = [];
                const activeVariants = v?.fields?.ActiveVariants || [];

                for (const vari of activeVariants) {
                    const varName = vari?.fields?.VariantName?.value;
                    const varId = vari?.id;
                    if (!varName) continue;

                    const varSpecs: Record<string, unknown> = {};
                    // Extract variant-level specs
                    const exShowroom = vari?.fields?.ExShowroomPrice?.value;
                    const varPrice = exShowroom ? parseNumeric(exShowroom) : undefined;

                    const colors: ExtractedColor[] = [];
                    const activeColors = vari?.fields?.ActiveColours || [];

                    for (const col of activeColors) {
                        const colName = col?.fields?.VehicleColor?.name || col?.fields?.VehicleColor?.value;
                        const colId = col?.id;
                        const colHex = col?.fields?.ColorHexCode?.value;

                        // Gather images
                        const images = col?.fields?.VariantColorImages || [];
                        const mediaUrls: string[] = [];
                        for (const img of images) {
                            const imgUrl = img?.url || img?.fields?.Image?.value?.src;
                            if (imgUrl) {
                                const fullUrl = imgUrl.startsWith('http')
                                    ? imgUrl
                                    : `https://www.tvsmotor.com${imgUrl}`;
                                mediaUrls.push(fullUrl);
                            }
                        }

                        // Gather videos
                        const videoUrls: string[] = [];
                        const videos = col?.fields?.ColorVideos || col?.fields?.Videos || [];
                        for (const vid of videos) {
                            const vidUrl = vid?.fields?.VideoUrl?.value || vid?.url;
                            if (vidUrl) videoUrls.push(vidUrl);
                        }

                        if (mediaUrls.length > 0) {
                            logs.push(log('ASSET_FOUND', `${colName}: ${mediaUrls.length} images`, { color: colName }));
                        }

                        colors.push({
                            name: colName || 'Unknown Color',
                            hex_primary: colHex,
                            finish: inferFinish(colName),
                            media_urls: mediaUrls,
                            video_urls: videoUrls.length > 0 ? videoUrls : undefined,
                            provenance: {
                                source_url: sanitizeUrl(sourceUrl),
                                fetched_at: new Date().toISOString(),
                                parser_version: TvsExtractor.PARSER_VERSION,
                                external_id: colId || `${varId}-${colName}`,
                                brand_slug: 'tvs',
                            },
                        });
                    }

                    variants.push({
                        name: varName,
                        specs: varSpecs,
                        price: varPrice,
                        colors,
                        provenance: {
                            source_url: sanitizeUrl(sourceUrl),
                            fetched_at: new Date().toISOString(),
                            parser_version: TvsExtractor.PARSER_VERSION,
                            external_id: varId || `${vId}-${varName}`,
                            brand_slug: 'tvs',
                        },
                    });
                }

                models.push({
                    name: vName,
                    category,
                    specs: modelSpecs,
                    variants,
                    provenance: {
                        source_url: sanitizeUrl(sourceUrl),
                        fetched_at: new Date().toISOString(),
                        parser_version: TvsExtractor.PARSER_VERSION,
                        external_id: vId || vName,
                        brand_slug: 'tvs',
                    },
                });
            }
        }

        logs.push(
            log(
                'PARSE_SUCCESS',
                `Extracted ${models.length} models, ${models.reduce((a, m) => a + m.variants.length, 0)} variants`
            )
        );
        return { success: true, brand_slug: 'tvs', models, errors, logs };
    },
};

// ─── Hero Extractor (AEM / JSON-LD) ──────────────────────────────────────

const HeroExtractor: BaseExtractor = {
    PARSER_VERSION: 'hero-aem-v1.0',
    BRAND_SLUG: 'hero',

    canHandle(url: string, sourceHtml: string): boolean {
        return url.includes('heromotocorp.com');
    },

    extract(sourceHtml: string, sourceUrl: string): ExtractionResult {
        const logs: ExtractorLog[] = [];
        const errors: string[] = [];
        const models: ExtractedModel[] = [];

        logs.push(log('INIT_FETCH', `Starting Hero extraction`, { url: sourceUrl }));

        // 1. Check for Model Discovery (Mega Menu / data-vehicles)
        if (sourceHtml.includes('drawer-fragment') && sourceHtml.includes('data-vehicles')) {
            const discoveryModels = extractHeroModelsFromDataVehicles(sourceHtml, sourceUrl, this.PARSER_VERSION, logs);
            if (discoveryModels.length > 0) {
                logs.push(log('PARSE_SUCCESS', `Extracted ${discoveryModels.length} models from data-vehicles`));
                return { success: true, brand_slug: 'hero', models: discoveryModels, errors, logs };
            }
        }

        // 2. Check for Single Model/Variant Specs (Detail Page)
        const specs = extractHeroSpecsFromHtml(sourceHtml);
        if (Object.keys(specs).length > 0) {
            // Find model name from title or OG tags
            const titleMatch = sourceHtml.match(/<title>(.*?)<\/title>/i);
            const ogTitleMatch = sourceHtml.match(/<meta property="og:title" content="(.*?)"/i);
            let modelName = (ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1] : 'Unknown')
                .split(':')[0]
                .trim();

            // Clean up: "Hero Xpulse 200 4V" -> "Xpulse 200 4V"
            modelName = modelName.replace(/^Hero\s+/i, '');

            logs.push(log('PARSE_SUCCESS', `Extracted specs for ${modelName}`));
            models.push({
                name: modelName,
                specs,
                variants: [],
                provenance: {
                    source_url: sanitizeUrl(sourceUrl),
                    fetched_at: new Date().toISOString(),
                    parser_version: this.PARSER_VERSION,
                    external_id: sourceUrl,
                    brand_slug: 'hero',
                },
            });
            return { success: true, brand_slug: 'hero', models, errors, logs };
        }

        errors.push('No Hero-specific data structures found on this page.');
        return { success: false, brand_slug: 'hero', models, errors, logs };
    },
};

// ─── Bikewale Extractor (JSON-LD) ──────────────────────────────────────

const BikewaleExtractor: BaseExtractor = {
    PARSER_VERSION: 'bikewale-ld-v1.0',
    BRAND_SLUG: 'generic', // Will be dynamic based on source

    canHandle(url: string, sourceHtml: string): boolean {
        return url.includes('bikewale.com');
    },

    extract(sourceHtml: string, sourceUrl: string): ExtractionResult {
        const logs: ExtractorLog[] = [];
        const errors: string[] = [];
        const models: ExtractedModel[] = [];

        logs.push(log('INIT_FETCH', `Starting Bikewale extraction`, { url: sourceUrl }));

        // Extract JSON-LD script tags
        const ldMatches = sourceHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
        if (!ldMatches) {
            errors.push('No JSON-LD metadata found on page');
            return { success: false, brand_slug: 'unknown', models, errors, logs };
        }

        let productData: any = null;
        for (const match of ldMatches) {
            try {
                const content = match.replace(/<script[^>]*>|<\/script>/g, '');
                const json = JSON.parse(content);
                if (json['@type'] === 'Product') {
                    productData = json;
                    break;
                }
            } catch (e) {
                // Skip invalid JSON
            }
        }

        if (!productData) {
            errors.push('Could not find Product schema in JSON-LD');
            return { success: false, brand_slug: 'unknown', models, errors, logs };
        }

        const brandName = productData.brand?.name || 'Unknown';
        const modelName = productData.name || 'Unknown Model';
        const brandSlug = brandName.toLowerCase();

        const specs: Record<string, any> = {};
        const props = productData.additionalProperty || [];

        // Mapping table for Bikewale keys to our Standard Keys
        const keyMap: Record<string, string> = {
            Displacement: 'engine_cc',
            'Max Power(bhp)': 'max_power',
            'Fuel Tank Capacity': 'fuel_capacity',
            'Mileage - Owner Reported': 'mileage',
            'Seat Height': 'seat_height',
            'Top Speed': 'top_speed',
            'Emission Standard': 'emission_standard',
            'Kerb Weight': 'kerb_weight',
            'Global Rating': 'rating_avg',
        };

        for (const p of props) {
            const rawKey = p.name;
            const value = p.value;
            const stdKey = keyMap[rawKey] || rawKey.toLowerCase().replace(/\s+/g, '_');

            // Numeric parsing with unit awareness
            const numericValue = parseNumeric(value);
            specs[stdKey] = numericValue !== undefined ? numericValue : value;
        }

        // Features/Variants check (often listed in description or colors)
        const variants: ExtractedVariant[] = [];
        const colors: ExtractedColor[] = (productData.color || []).map((c: string) => ({
            name: c,
            media_urls: [], // Bikewale hides high-res behind complex paths, usually extracted from DOM slider
            provenance: {
                source_url: sourceUrl,
                fetched_at: new Date().toISOString(),
                parser_version: this.PARSER_VERSION,
                external_id: `color-${c}`,
                brand_slug: brandSlug,
            },
        }));

        // If it's a model landing page, we might only have the base specs
        // Detailed variants often require separate URLs or deeper JSON-LD inspection
        variants.push({
            name: 'Standard',
            specs: {}, // Will be populated by segregation logic later
            colors,
            provenance: {
                source_url: sourceUrl,
                fetched_at: new Date().toISOString(),
                parser_version: this.PARSER_VERSION,
                external_id: `model-base`,
                brand_slug: brandSlug,
            },
        });

        models.push({
            name: modelName,
            specs,
            variants,
            provenance: {
                source_url: sourceUrl,
                fetched_at: new Date().toISOString(),
                parser_version: this.PARSER_VERSION,
                external_id: `model-${modelName}`,
                brand_slug: brandSlug,
            },
        });

        logs.push(log('PARSE_SUCCESS', `Extracted ${modelName} with ${props.length} properties`));
        return { success: true, brand_slug: brandSlug, models, errors, logs };
    },
};

// ─── BikeDekho Extractor (JSON-LD) ──────────────────────────────────────

const BikedekhoExtractor: BaseExtractor = {
    PARSER_VERSION: 'bikedekho-ld-v1.0',
    BRAND_SLUG: 'generic',

    canHandle(url: string, sourceHtml: string): boolean {
        return url.includes('bikedekho.com');
    },

    extract(sourceHtml: string, sourceUrl: string): ExtractionResult {
        const logs: ExtractorLog[] = [];
        const errors: string[] = [];
        const models: ExtractedModel[] = [];

        logs.push(log('INIT_FETCH', `Starting BikeDekho extraction`, { url: sourceUrl }));

        const ldMatches = sourceHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
        if (!ldMatches) {
            errors.push('No JSON-LD metadata found on page');
            return { success: false, brand_slug: 'unknown', models, errors, logs };
        }

        let productData: any = null;
        for (const match of ldMatches) {
            try {
                const content = match.replace(/<script[^>]*>|<\/script>/g, '');
                const json = JSON.parse(content);
                // Handle both single objects and arrays in @graph
                const items = Array.isArray(json) ? json : json['@graph'] || [json];
                productData = items.find(
                    (i: any) => i['@type'] === 'Motorcycle' || i['@type'] === 'Product' || i['@type'] === 'Vehicle'
                );
                if (productData) break;
            } catch (e) {}
        }

        if (!productData) {
            errors.push('Could not find Vehicle schema in JSON-LD');
            return { success: false, brand_slug: 'unknown', models, errors, logs };
        }

        const brandName = productData.brand?.name || productData.manufacturer?.name || 'Unknown';
        const modelName = productData.name || 'Unknown Model';
        const brandSlug = brandName.toLowerCase();

        const specs: Record<string, any> = {};
        const props = productData.additionalProperty || [];

        const keyMap: Record<string, string> = {
            Displacement: 'engine_cc',
            'Max Power': 'max_power',
            'Fuel Capacity': 'fuel_capacity',
            Mileage: 'mileage',
            'Kerb Weight': 'kerb_weight',
            'Engine Type': 'engine_type',
            'Front Brake': 'front_brake_type',
            'Rear Brake': 'rear_brake_type',
        };

        for (const p of props) {
            const stdKey = keyMap[p.name] || p.name.toLowerCase().replace(/\s+/g, '_');
            const numericValue = parseNumeric(p.value);
            specs[stdKey] = numericValue !== undefined ? numericValue : p.value;
        }

        // Add core schema fields if missing from additionalProperty
        if (!specs.engine_cc && productData.vehicleEngine?.engineDisplacement?.value) {
            specs.engine_cc = productData.vehicleEngine.engineDisplacement.value;
        }
        if (!specs.fuel_capacity && productData.fuelEfficiency?.name) {
            // Note: BikeDekho sometimes puts mileage in fuelEfficiency schema
            specs.mileage = parseNumeric(productData.fuelEfficiency.name);
        }

        const variants: ExtractedVariant[] = [];
        const colors: ExtractedColor[] = (productData.color || []).map((c: string) => ({
            name: c,
            media_urls: [],
            provenance: {
                source_url: sourceUrl,
                fetched_at: new Date().toISOString(),
                parser_version: this.PARSER_VERSION,
                external_id: `color-${c}`,
                brand_slug: brandSlug,
            },
        }));

        variants.push({
            name: 'Standard',
            specs: {},
            colors,
            provenance: {
                source_url: sourceUrl,
                fetched_at: new Date().toISOString(),
                parser_version: this.PARSER_VERSION,
                external_id: `model-base`,
                brand_slug: brandSlug,
            },
        });

        models.push({
            name: modelName,
            specs,
            variants,
            provenance: {
                source_url: sourceUrl,
                fetched_at: new Date().toISOString(),
                parser_version: this.PARSER_VERSION,
                external_id: `model-${modelName}`,
                brand_slug: brandSlug,
            },
        });

        logs.push(log('PARSE_SUCCESS', `Extracted ${modelName} with ${props.length} properties`));
        return { success: true, brand_slug: brandSlug, models, errors, logs };
    },
};

// ─── Yamaha Extractor (DOM/HTML) ────────────────────────────────────────

const YamahaExtractor: BaseExtractor = {
    PARSER_VERSION: 'yamaha-dom-v1.0',
    BRAND_SLUG: 'yamaha',

    canHandle(url: string, sourceHtml: string): boolean {
        return url.includes('yamaha-motor-india.com');
    },

    extract(sourceHtml: string, sourceUrl: string): ExtractionResult {
        const logs: ExtractorLog[] = [];
        const errors: string[] = [];
        const models: ExtractedModel[] = [];

        logs.push(log('INIT_FETCH', `Starting Yamaha extraction`, { url: sourceUrl }));

        // 1. Check if it's a listing page (Menu parsing)
        const menuModels = extractYamahaModelsFromMenu(sourceHtml, sourceUrl, this.PARSER_VERSION, logs);
        if (menuModels.length > 0) {
            logs.push(log('PARSE_SUCCESS', `Menu extracted ${menuModels.length} models`));
            return { success: true, brand_slug: 'yamaha', models: menuModels, errors, logs };
        }

        // 2. Check if it's a detail page (Spec Table parsing)
        const specs = extractYamahaSpecsFromHtml(sourceHtml);
        if (Object.keys(specs).length > 0) {
            // Extract model name from title or H1
            let rawName = 'Unknown Yamaha';
            const h1Match = sourceHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            const titleMatch = sourceHtml.match(/<title>([\s\S]*?)<\/title>/i);

            if (h1Match) {
                rawName = h1Match[1].replace(/<[^>]*>/g, '').trim();
            } else if (titleMatch) {
                rawName = titleMatch[1].split('|')[0].replace('Yamaha', '').trim();
            }

            models.push({
                name: rawName,
                specs,
                variants: [],
                provenance: {
                    source_url: sourceUrl,
                    fetched_at: new Date().toISOString(),
                    parser_version: this.PARSER_VERSION,
                    external_id: sourceUrl,
                    brand_slug: 'yamaha',
                },
            });
            logs.push(log('PARSE_SUCCESS', `Detail page extracted for ${rawName}`));
            return { success: true, brand_slug: 'yamaha', models, errors, logs };
        }

        errors.push('No Yamaha models or specs found in source HTML');
        return { success: false, brand_slug: 'yamaha', models, errors, logs };
    },
};

// ─── Bajaj Extractor (DOM/HTML) ────────────────────────────────────────

const BajajExtractor: BaseExtractor = {
    PARSER_VERSION: 'bajaj-dom-v1.0',
    BRAND_SLUG: 'bajaj',

    canHandle(url: string, sourceHtml: string): boolean {
        return url.includes('bajajauto.com');
    },

    extract(sourceHtml: string, sourceUrl: string): ExtractionResult {
        const logs: ExtractorLog[] = [];
        const errors: string[] = [];
        const models: ExtractedModel[] = [];

        logs.push(log('INIT_FETCH', `Starting Bajaj extraction`, { url: sourceUrl }));

        // 1. Listing Page Discovery
        if (sourceHtml.includes('listingBoxSec')) {
            const listingModels = extractBajajModelsFromHtml(sourceHtml, sourceUrl, this.PARSER_VERSION, logs);
            if (listingModels.length > 0) {
                logs.push(log('PARSE_SUCCESS', `Listing extracted ${listingModels.length} models`));
                return { success: true, brand_slug: 'bajaj', models: listingModels, errors, logs };
            }
        }

        // 2. Detail Page Spec Extraction
        const specs = extractBajajSpecsFromHtml(sourceHtml);
        if (Object.keys(specs).length > 0) {
            // Extract model name from title or H1
            let rawName = 'Unknown Bajaj';
            const h1Match = sourceHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            const titleMatch = sourceHtml.match(/<title>([\s\S]*?)<\/title>/i);

            if (h1Match) {
                rawName = h1Match[1].replace(/<[^>]*>/g, '').trim();
            } else if (titleMatch) {
                rawName = titleMatch[1].split('|')[0].replace('Bajaj', '').trim();
            }

            models.push({
                name: rawName,
                specs,
                variants: [],
                provenance: {
                    source_url: sourceUrl,
                    fetched_at: new Date().toISOString(),
                    parser_version: this.PARSER_VERSION,
                    external_id: sourceUrl,
                    brand_slug: 'bajaj',
                },
            });
            logs.push(log('PARSE_SUCCESS', `Detail page extracted for ${rawName}`));
            return { success: true, brand_slug: 'bajaj', models, errors, logs };
        }

        errors.push('No Bajaj models or specs found in source HTML');
        return { success: false, brand_slug: 'bajaj', models, errors, logs };
    },
};

// ─── TVS Helpers ────────────────────────────────────────────────────────

function decodeHtml(input: string): string {
    return input
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function extractTvsModelsFromHtml(
    sourceHtml: string,
    sourceUrl: string,
    parserVersion: string,
    logs: ExtractorLog[]
): ExtractedModel[] {
    const models: ExtractedModel[] = [];
    const seen = new Set<string>();

    const cardRegex = /<div class="bike-details-main">[\s\S]*?<a href="([^"]+)">[\s\S]*?<h3>(.*?)<\/h3>/gi;
    let match: RegExpExecArray | null;
    while ((match = cardRegex.exec(sourceHtml)) !== null) {
        const href = match[1]?.trim();
        const rawName = match[2]?.trim();
        if (!rawName) continue;
        const name = decodeHtml(rawName).replace(/\s+/g, ' ').trim();
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const externalId = href ? href.split('?')[0] : name;
        models.push({
            name,
            specs: {},
            variants: [],
            provenance: {
                brand_slug: 'tvs',
                source_url: sanitizeUrl(sourceUrl),
                fetched_at: new Date().toISOString(),
                parser_version: parserVersion,
                external_id: externalId,
            },
        });
    }

    if (models.length === 0) {
        logs.push(log('PARSE_FAIL', 'HTML fallback found no model cards'));
    }

    return models;
}

function extractTvsModelsFromProductListing(
    jssData: any,
    sourceUrl: string,
    parserVersion: string,
    logs: ExtractorLog[]
): ExtractedModel[] {
    const models: ExtractedModel[] = [];
    const seen = new Set<string>();

    const placeholders = jssData?.sitecore?.route?.placeholders;
    const main = placeholders?.['jss-main'];
    if (!Array.isArray(main)) return models;

    for (const block of main) {
        const data = block?.fields?.data;
        const vehicleRoot = data?.Vehicle;
        const vehicleTypes = vehicleRoot?.children?.results;
        if (!Array.isArray(vehicleTypes)) continue;

        for (const vehicleType of vehicleTypes) {
            const typeName =
                vehicleType?.VehicleTypeName?.value || vehicleType?.fields?.VehicleTypeName?.value || 'Unknown';
            const category = mapTvsCategory(typeName);

            const vehicleFields = vehicleType?.Vehicle?.fields || vehicleType?.fields?.Vehicle?.fields || [];
            if (!Array.isArray(vehicleFields)) continue;

            for (const v of vehicleFields) {
                const showRaw = v?.ShowOnOurProductsPage?.value;
                if (showRaw === false || showRaw === '0' || showRaw === 'false') continue;

                const name = v?.Title?.value || v?.displayName || v?.VehicleCode?.value || v?.name;
                if (!name) continue;
                const trimmedName = name.toString().trim();
                const key = trimmedName.toLowerCase();
                if (seen.has(key)) continue;
                seen.add(key);

                const linkUrl = v?.Link?.url;
                const externalId = linkUrl || v?.VehicleModelId?.value || trimmedName;

                const specs: Record<string, unknown> = {};
                const specFields = v?.VehicleSpecification?.fields || [];
                if (Array.isArray(specFields)) {
                    for (const s of specFields) {
                        const sName = s?.SpecificationName?.value?.toString().trim();
                        const sVal = s?.SpecificationValue?.value?.toString().trim();
                        if (!sName || !sVal) continue;
                        const lower = sName.toLowerCase();
                        if (lower.includes('engine') && lower.includes('capacity')) {
                            const num = parseNumeric(sVal);
                            if (num !== undefined) specs.engine_cc = num;
                        } else if (lower.includes('power')) {
                            specs.max_power = sVal;
                        } else if (lower.includes('weight')) {
                            const num = parseNumeric(sVal);
                            if (num !== undefined) specs.weight_kg = num;
                        } else if (lower.includes('range')) {
                            specs.range_km = parseNumeric(sVal) ?? sVal;
                        } else if (lower.includes('battery')) {
                            specs.battery_kwh = parseNumeric(sVal) ?? sVal;
                        } else if (lower.includes('top speed')) {
                            specs.top_speed = parseNumeric(sVal) ?? sVal;
                        } else {
                            specs[sName] = sVal;
                        }
                    }
                }

                if (v?.IsElectric?.value === true || v?.IsElectric?.value === '1') {
                    specs.fuel_type = 'ELECTRIC';
                }

                models.push({
                    name: trimmedName,
                    category,
                    specs,
                    variants: [],
                    provenance: {
                        brand_slug: 'tvs',
                        source_url: sanitizeUrl(sourceUrl),
                        fetched_at: new Date().toISOString(),
                        parser_version: parserVersion,
                        external_id: externalId,
                    },
                });
            }
        }
    }

    if (models.length === 0) {
        logs.push(log('PARSE_FAIL', 'ProductListing found no models'));
    }

    return models;
}

function extractSingleTvsModel(
    jssData: any,
    sourceUrl: string,
    parserVersion: string,
    logs: ExtractorLog[]
): ExtractedModel | null {
    // For single-model pages (e.g., /tvs-apache-rtr-200-4v)
    const route = jssData?.sitecore?.route;
    if (!route) return null;

    const fields = route.fields;
    if (!fields) return null;

    const modelName = fields.VehicleName?.value || route.name;
    if (!modelName) return null;

    logs.push(log('EXTRACTOR_MATCH', `Single-model page detected: ${modelName}`));

    const specs: Record<string, unknown> = {};

    // Core Engine
    if (fields.Displacement?.value) specs.engine_cc = parseNumeric(fields.Displacement.value);
    if (fields.MaxPower?.value) specs.max_power = fields.MaxPower.value;
    if (fields.MaxTorque?.value) specs.max_torque = fields.MaxTorque.value;
    if (fields.EngineType?.value) specs.engine_type = fields.EngineType.value;
    if (fields.CoolingSystem?.value) specs.cooling_system = fields.CoolingSystem.value;
    if (fields.Bore?.value) specs.bore = parseNumeric(fields.Bore.value);
    if (fields.Stroke?.value) specs.stroke = parseNumeric(fields.Stroke.value);
    if (fields.CompressionRatio?.value) specs.compression_ratio = fields.CompressionRatio.value;
    if (fields.Starting?.value) specs.starting_method = fields.Starting.value;

    // Performance & Fuel
    if (fields.FuelCapacity?.value) specs.fuel_capacity = parseNumeric(fields.FuelCapacity.value);
    if (fields.Mileage?.value) specs.mileage = parseNumeric(fields.Mileage.value);
    if (fields.TopSpeed?.value) specs.top_speed = parseNumeric(fields.TopSpeed.value);

    // Dimensions
    if (fields.KerbWeight?.value) specs.kerb_weight = parseNumeric(fields.KerbWeight.value);
    if (fields.GroundClearance?.value) specs.ground_clearance = parseNumeric(fields.GroundClearance.value);
    if (fields.SeatHeight?.value) specs.seat_height = parseNumeric(fields.SeatHeight.value);
    if (fields.Wheelbase?.value) specs.wheelbase = parseNumeric(fields.Wheelbase.value);

    // Transmission
    if (fields.Transmission?.value) specs.transmission_type = fields.Transmission.value;
    if (fields.Clutch?.value) specs.clutch_type = fields.Clutch.value;

    // Chassis & Braking (Common)
    if (fields.ChassisType?.value) specs.chassis_type = fields.ChassisType.value;
    if (fields.BrakingSystem?.value) specs.abs_type = fields.BrakingSystem.value;
    if (fields.FrontBrake?.value) specs.front_brake_type = fields.FrontBrake.value;
    if (fields.RearBrake?.value) specs.rear_brake_type = fields.RearBrake.value;

    const variants: ExtractedVariant[] = [];
    const activeVariants = fields.ActiveVariants || [];

    for (const vari of activeVariants) {
        const varName = vari?.fields?.VariantName?.value;
        const varId = vari?.id;
        if (!varName) continue;

        const varPrice = vari?.fields?.ExShowroomPrice?.value
            ? parseNumeric(vari.fields.ExShowroomPrice.value)
            : undefined;

        const colors: ExtractedColor[] = [];
        const activeColors = vari?.fields?.ActiveColours || [];

        for (const col of activeColors) {
            const colName = col?.fields?.VehicleColor?.name || col?.fields?.VehicleColor?.value;
            const colId = col?.id;
            const colHex = col?.fields?.ColorHexCode?.value;

            const images = col?.fields?.VariantColorImages || [];
            const mediaUrls: string[] = [];
            for (const img of images) {
                const imgUrl = img?.url || img?.fields?.Image?.value?.src;
                if (imgUrl) {
                    mediaUrls.push(imgUrl.startsWith('http') ? imgUrl : `https://www.tvsmotor.com${imgUrl}`);
                }
            }

            colors.push({
                name: colName || 'Unknown',
                hex_primary: colHex,
                finish: inferFinish(colName),
                media_urls: mediaUrls,
                provenance: {
                    source_url: sanitizeUrl(sourceUrl),
                    fetched_at: new Date().toISOString(),
                    parser_version: parserVersion,
                    external_id: colId || `${varId}-${colName}`,
                    brand_slug: 'tvs',
                },
            });
        }

        variants.push({
            name: varName,
            specs: {},
            price: varPrice,
            colors,
            provenance: {
                source_url: sanitizeUrl(sourceUrl),
                fetched_at: new Date().toISOString(),
                parser_version: parserVersion,
                external_id: varId || varName,
                brand_slug: 'tvs',
            },
        });
    }

    return {
        name: modelName,
        category: mapTvsCategory(fields.VehicleType?.value || ''),
        specs,
        variants,
        provenance: {
            source_url: sanitizeUrl(sourceUrl),
            fetched_at: new Date().toISOString(),
            parser_version: parserVersion,
            external_id: route.itemId || modelName,
            brand_slug: 'tvs',
        },
    };
}

// ─── Yamaha Helpers ────────────────────────────────────────────────────────

function extractYamahaModelsFromMenu(
    sourceHtml: string,
    sourceUrl: string,
    parserVersion: string,
    logs: ExtractorLog[]
): ExtractedModel[] {
    const models: ExtractedModel[] = [];
    const seen = new Set<string>();

    // Pattern: <li><a href="https://www.yamaha-motor-india.com/yamaha-r3.html">R3</a></li>
    // Note: We need to capture the category from the parent menu item if possible

    // First, find all menu blocks
    const menuRegex =
        /<li class="mob-li">[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<div class="mob-sub-menu">([\s\S]*?)<\/div>/gi;
    let menuMatch: RegExpExecArray | null;

    while ((menuMatch = menuRegex.exec(sourceHtml)) !== null) {
        const categoryRaw = menuMatch[1] || '';
        const category = categoryRaw.toUpperCase().includes('SCOOTER') ? 'SCOOTER' : 'MOTORCYCLE';
        const subMenuHtml = menuMatch[2] || '';

        const itemRegex = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/gi;
        let itemMatch: RegExpExecArray | null;

        while ((itemMatch = itemRegex.exec(subMenuHtml)) !== null) {
            const href = itemMatch[1]?.trim();
            const name = decodeHtml(itemMatch[2]?.trim());

            if (!name || name.includes('View all') || name.includes('Click here')) continue;

            const key = name.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);

            models.push({
                name,
                category,
                specs: {},
                variants: [],
                provenance: {
                    source_url: sanitizeUrl(sourceUrl),
                    fetched_at: new Date().toISOString(),
                    parser_version: parserVersion,
                    external_id: href || name,
                    brand_slug: 'yamaha',
                },
            });
        }
    }

    return models;
}

function extractYamahaSpecsFromHtml(sourceHtml: string): Record<string, any> {
    const specs: Record<string, any> = {};

    // Pattern: <tr><td>Key</td><td>Value</td></tr>
    const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gi;
    let match: RegExpExecArray | null;

    const keyMap: Record<string, string> = {
        'Engine type': 'engine_type',
        Displacement: 'engine_cc',
        'Bore & stroke': 'bore_stroke',
        'Compression ratio': 'compression_ratio',
        'Maximum horse power': 'max_power',
        'Maximum torque': 'max_torque',
        'Starting system type': 'starting_method',
        'Lubrication system': 'lubrication_system',
        'Overall length x width x height': 'dimensions',
        'Seat height': 'seat_height',
        'Wheel base': 'wheelbase',
        'Minimum ground clearance': 'ground_clearance',
        'Kerb weight': 'kerb_weight',
        'Fuel tank capacity': 'fuel_capacity',
        'Tyre size (Front)': 'front_tyre_size',
        'Tyre size (Rear)': 'rear_tyre_size',
        'Brake type (Front)': 'front_brake_type',
        'Brake type (Rear)': 'rear_brake_type',
        'Suspension type (Front)': 'front_suspension',
        'Suspension type (Rear)': 'rear_suspension',
        'Frame type': 'frame_type',
        'Ignition system type': 'ignition_system',
    };

    while ((match = rowRegex.exec(sourceHtml)) !== null) {
        const rawKey = decodeHtml(match[1]?.replace(/<[^>]*>/g, '').trim());
        const rawVal = decodeHtml(match[2]?.replace(/<[^>]*>/g, '').trim());

        if (!rawKey || !rawVal) continue;

        const stdKey = keyMap[rawKey] || rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
        const numVal = parseNumeric(rawVal);
        specs[stdKey] = numVal !== undefined ? numVal : rawVal;
    }

    return specs;
}

// ─── Hero Helpers ──────────────────────────────────────────────────────────

function extractHeroModelsFromDataVehicles(
    sourceHtml: string,
    sourceUrl: string,
    parserVersion: string,
    logs: ExtractorLog[]
): ExtractedModel[] {
    const models: ExtractedModel[] = [];
    const seen = new Set<string>();

    const fragmentRegex = /<div class="drawer-fragment" data-vehicles='([\s\S]*?)'>/gi;
    let match: RegExpExecArray | null;

    while ((match = fragmentRegex.exec(sourceHtml)) !== null) {
        try {
            const rawJson = match[1].replace(/&quot;/g, '"');
            const vehicles = JSON.parse(rawJson);

            if (Array.isArray(vehicles)) {
                for (const v of vehicles) {
                    const name = v.vehicleName || v.vehicleModelName;
                    const id = v.vehicleId;
                    const image = v.vehicleImage;

                    if (!name) continue;
                    const key = name.toLowerCase();
                    if (seen.has(key)) continue;
                    seen.add(key);

                    models.push({
                        name,
                        category: name.toLowerCase().includes('scooter') ? 'SCOOTER' : 'MOTORCYCLE',
                        specs: {
                            hero_short_spec: v.vehicleSpec?.replace(/<[^>]*>/g, '').trim(),
                        },
                        variants: [],
                        provenance: {
                            source_url: sanitizeUrl(sourceUrl),
                            fetched_at: new Date().toISOString(),
                            parser_version: parserVersion,
                            external_id: id || name,
                            brand_slug: 'hero',
                        },
                    });
                }
            }
        } catch (e: any) {
            logs.push(log('PARSE_FAIL', `Failed to parse data-vehicles JSON: ${e.message}`));
        }
    }

    return models;
}

function extractHeroSpecsFromHtml(sourceHtml: string): Record<string, any> {
    const specs: Record<string, any> = {};

    // Pattern: <h5 class="weight-heavy">Key</h5>\s*<h4[^>]*>(?:<p>)?Value(?:</p>)?</h4>
    const specRegex = /<h5[^>]*>(.*?)<\/h5>\s*<h4[^>]*>(?:<p>)?(.*?)(?:<\/p>)?<\/h4>/gi;
    let match: RegExpExecArray | null;

    const keyMap: Record<string, string> = {
        'Max. Power': 'max_power',
        'Max. Torque': 'max_torque',
        Displacement: 'engine_cc',
        Type: 'engine_type',
        'Front Tyre': 'front_tyre',
        'Rear Tyre': 'rear_tyre',
        'Fuel Tank Capacity': 'fuel_capacity',
        'Kerb Weight': 'kerb_weight',
        'Overall Length': 'length',
        'Overall Height': 'height',
        'Overall Width': 'width',
        'Seat Height': 'seat_height',
        Wheelbase: 'wheelbase',
        'Ground Clearance': 'ground_clearance',
        'Transmission Type': 'transmission_type',
        'Clutch Type': 'clutch_type',
        'Instrument Cluster': 'instrument_cluster',
        Headlamp: 'headlamp_type',
        'Suspension (Front)': 'front_suspension',
        'Front Suspension': 'front_suspension',
        'Suspension (Rear)': 'rear_suspension',
        'Rear Suspension': 'rear_suspension',
    };

    while ((match = specRegex.exec(sourceHtml)) !== null) {
        const rawKey = decodeHtml(match[1]?.replace(/<[^>]*>/g, '').trim());
        const rawVal = decodeHtml(match[2]?.replace(/<[^>]*>/g, '').trim());

        if (!rawKey || !rawVal) continue;

        const stdKey = keyMap[rawKey] || rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
        const numVal = parseNumeric(rawVal);
        specs[stdKey] = numVal !== undefined ? numVal : rawVal;
    }

    return specs;
}

function extractBajajModelsFromHtml(
    sourceHtml: string,
    sourceUrl: string,
    parserVersion: string,
    logs: ExtractorLog[]
): ExtractedModel[] {
    const models: ExtractedModel[] = [];
    const seen = new Set<string>();

    const cardRegex =
        /<div[^>]*class="listingBoxSec"[^>]*data-model-name="([^"]+)"[\s\S]*?href="([^"]+)"[^>]*>Explore Now<\/a>/gi;

    let match: RegExpExecArray | null;
    while ((match = cardRegex.exec(sourceHtml)) !== null) {
        const rawName = decodeHtml(match[1]);
        const href = match[2];
        if (!rawName) continue;

        const name = rawName.trim();
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const fullUrl = href.startsWith('http') ? href : `https://www.bajajauto.com${href}`;
        const externalId = href.split('/').pop() || name;

        // Try to sneakily find basic specs from the card list
        const cardSpecs: Record<string, any> = {};
        const cardInner = match[0];

        const engineMatch = cardInner.match(/<li>Engine\s*<span>(.*?)<\/span><\/li>/i);
        if (engineMatch) cardSpecs.engine_cc = parseNumeric(engineMatch[1]);

        const torqueMatch = cardInner.match(/<li>Max Torque\s*<span>(.*?)<\/span><\/li>/i);
        if (torqueMatch) cardSpecs.max_torque = torqueMatch[1].trim();

        const powerMatch = cardInner.match(/<li>Max Power\s*<span>(.*?)<\/span><\/li>/i);
        if (powerMatch) cardSpecs.max_power = powerMatch[1].trim();

        const priceMatch = cardInner.match(/class="earn-total motor-bike-price"[^>]*>(.*?)<\/span>/i);
        const price = priceMatch ? parseNumeric(priceMatch[1]) : undefined;

        models.push({
            name,
            specs: cardSpecs,
            variants: price
                ? [
                      {
                          name: 'Standard',
                          price,
                          specs: {},
                          colors: [],
                          provenance: {
                              source_url: sanitizeUrl(sourceUrl),
                              fetched_at: new Date().toISOString(),
                              parser_version: parserVersion,
                              external_id: `${externalId}-std`,
                              brand_slug: 'bajaj',
                          },
                      },
                  ]
                : [],
            provenance: {
                source_url: sanitizeUrl(sourceUrl),
                fetched_at: new Date().toISOString(),
                parser_version: parserVersion,
                external_id: externalId,
                brand_slug: 'bajaj',
            },
        });
    }

    return models;
}

function extractBajajSpecsFromHtml(sourceHtml: string): Record<string, any> {
    const specs: Record<string, any> = {};

    // Pattern 1: Structured spec containers (Label/Value)
    // <div class="label">Ground Clearance</div>\s*<div class="value">170 mm</div>
    const specRegex = /<div[^>]*class="label"[^>]*>(.*?)<\/div>\s*<div[^>]*class="value"[^>]*>(.*?)<\/div>/gi;

    const keyMap: Record<string, string> = {
        Displacement: 'engine_cc',
        'Max Power': 'max_power',
        'Max Torque': 'max_torque',
        'Fuel Tank': 'fuel_capacity',
        'Curb Weight': 'kerb_weight',
        'Ground Clearance': 'ground_clearance',
        Wheelbase: 'wheelbase',
        'Front Brake': 'front_brake_type',
        'Rear Brake': 'rear_brake_type',
        'Tyre Front': 'front_tyre',
        'Tyre Rear': 'rear_tyre',
    };

    let match: RegExpExecArray | null;
    while ((match = specRegex.exec(sourceHtml)) !== null) {
        const rawKey = decodeHtml(match[1]?.replace(/<[^>]*>/g, '').trim());
        const rawVal = decodeHtml(match[2]?.replace(/<[^>]*>/g, '').trim());

        if (!rawKey || !rawVal) continue;

        const stdKey = keyMap[rawKey] || rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
        const numVal = parseNumeric(rawVal);
        specs[stdKey] = numVal !== undefined ? numVal : rawVal;
    }

    return specs;
}

function mapTvsCategory(typeName: string): string {
    const lower = typeName.toLowerCase();
    if (lower.includes('electric')) return 'SCOOTER';
    if (lower.includes('scooter')) return 'SCOOTER';
    if (lower.includes('moped')) return 'MOPED';
    return 'MOTORCYCLE';
}

function parseNumeric(value: string | number): number | undefined {
    if (typeof value === 'number') return value;
    if (!value) return undefined;

    // Strip common suffixes and characters: "159.7 cc", "12 L", "₹1,23,890", "5.3 litres"
    const cleaned = value
        .toString()
        .replace(/[₹,\s]/g, '')
        .replace(/\s*(cc|l|litres|km\/l|kmpl|ps|nm|kg|mm|bhp|kmph)\s*$/i, '');

    const num = parseFloat(cleaned);

    // [FIX #7] Return undefined on failure instead of 0 — prevents false diffs
    return isNaN(num) ? undefined : num;
}

function inferFinish(colorName?: string): string {
    if (!colorName) return 'Gloss';
    const lower = colorName.toLowerCase();
    if (lower.includes('matte') || lower.includes('matt')) return 'Matte';
    if (lower.includes('metallic')) return 'Metallic';
    if (lower.includes('pearl')) return 'Pearl';
    return 'Gloss';
}

// ─── Extractor Registry ─────────────────────────────────────────────────

const EXTRACTORS: BaseExtractor[] = [
    TvsExtractor,
    HeroExtractor,
    YamahaExtractor,
    BajajExtractor,
    BikewaleExtractor,
    BikedekhoExtractor,
];

function findExtractor(url: string, sourceHtml: string): BaseExtractor | null {
    for (const ext of EXTRACTORS) {
        if (ext.canHandle(url, sourceHtml)) return ext;
    }
    return null;
}

// ─── Public Server Actions ──────────────────────────────────────────────

/**
 * Parse raw HTML source code and extract product data.
 * This is a READ-ONLY action — it returns extracted data for review.
 * No database writes happen here.
 */
export async function parseSource(params: {
    sourceHtml: string;
    sourceUrl: string;
    isManualPaste?: boolean;
    dryRun?: boolean;
}): Promise<ExtractionResult> {
    const { sourceHtml, sourceUrl, isManualPaste = false, dryRun = true } = params;
    const logs: ExtractorLog[] = [];

    // 1. Domain validation — skip for manual-paste (audit-only, no network fetch)
    if (sourceUrl && !isManualPaste && !isAllowedDomain(sourceUrl)) {
        return {
            success: false,
            brand_slug: 'unknown',
            models: [],
            errors: [`Domain not in allowlist. Allowed: ${DOMAIN_ALLOWLIST.join(', ')}`],
            logs: [log('INIT_FETCH', 'Domain rejected', { url: sourceUrl })],
        };
    }

    const cleanUrl = sanitizeUrl(sourceUrl);
    logs.push(log('INIT_FETCH', `Processing source`, { original_url: sourceUrl, sanitized_url: cleanUrl }));

    // 2. Find matching extractor
    const extractor = findExtractor(cleanUrl, sourceHtml);

    if (!extractor) {
        // Fallback: Raw Inspector mode
        logs.push(log('FALLBACK_MODE', 'No matching extractor found, entering Raw Inspector mode'));

        // Try to parse any JSON we can find
        let rawJson: unknown = null;
        try {
            // Try finding JSON in script tags
            const jsonMatch =
                sourceHtml.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/) ||
                sourceHtml.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
            if (jsonMatch) {
                rawJson = JSON.parse(jsonMatch[1]);
            }
        } catch {
            // Not parseable, that's fine
        }

        return {
            success: false,
            brand_slug: 'unknown',
            models: [],
            raw_json: rawJson,
            errors: ['No matching extractor for this source. Use Raw Inspector to review data.'],
            logs,
        };
    }

    logs.push(log('EXTRACTOR_MATCH', `Using ${extractor.PARSER_VERSION} for ${extractor.BRAND_SLUG}`));

    // 3. Extract
    const result = extractor.extract(sourceHtml, cleanUrl);
    result.logs = [...logs, ...result.logs];

    return result;
}

/**
 * Validate a list of URLs against the domain allowlist.
 */
export async function validateUrls(urls: string[]): Promise<{
    valid: { url: string; sanitized: string; domain: string }[];
    invalid: { url: string; reason: string }[];
}> {
    const valid: { url: string; sanitized: string; domain: string }[] = [];
    const invalid: { url: string; reason: string }[] = [];

    for (const url of urls) {
        try {
            const parsed = new URL(url);
            if (!DOMAIN_ALLOWLIST.some(d => parsed.hostname.endsWith(d))) {
                invalid.push({ url, reason: `Domain ${parsed.hostname} not in allowlist` });
            } else {
                valid.push({ url, sanitized: sanitizeUrl(url), domain: parsed.hostname });
            }
        } catch {
            invalid.push({ url, reason: 'Invalid URL format' });
        }
    }

    return { valid, invalid };
}

/**
 * Get list of supported extractors and their versions.
 */
export async function getExtractorInfo(): Promise<{
    extractors: { brand: string; version: string }[];
    allowed_domains: string[];
}> {
    return {
        extractors: EXTRACTORS.map(e => ({ brand: e.BRAND_SLUG, version: e.PARSER_VERSION })),
        allowed_domains: DOMAIN_ALLOWLIST,
    };
}
// ─── Persistence ─────────────────────────────────────────────────────────────

/**
 * Saves or updates inbound source HTML for a catalog item.
 */
export async function saveIngestionSources(params: {
    itemId?: string;
    brandId?: string;
    sources: any[];
    tenantId?: string;
}) {
    const { itemId, brandId, sources, tenantId: providedTenantId } = params;
    if (!!itemId === !!brandId) {
        throw new Error('Either itemId or brandId must be provided (but not both).');
    }
    const supabase = await createServerClient();

    let tenantId: string | null = providedTenantId || null;

    // Derive tenantId from item if not provided
    if (!tenantId && itemId) {
        const { data: item, error } = await supabase.from('cat_items').select('tenant_id').eq('id', itemId).single();
        if (!error && item) {
            tenantId = (item as any)?.tenant_id || null;
        }
    }

    // Fetch existing ID if it exists to avoid ON CONFLICT target mismatch
    const { data: existing } = await supabase
        .from('cat_item_ingestion_sources')
        .select('id')
        .eq(itemId ? 'item_id' : 'brand_id', itemId || brandId)
        .maybeSingle();

    const payload = {
        item_id: itemId || null,
        brand_id: brandId || null,
        tenant_id: tenantId,
        sources: sources.map(s => ({
            id: s.id,
            sourceUrl: s.sourceUrl,
            sourceHtml: s.sourceHtml,
        })),
        updated_at: new Date().toISOString(),
    };

    let error = null as any;
    const targetKey = itemId ? 'item_id' : 'brand_id';
    const targetValue = itemId || brandId;

    const { data: updated, error: updateError } = await supabase
        .from('cat_item_ingestion_sources')
        .update(payload)
        .eq(targetKey, targetValue as string)
        .select('id');

    if (updateError) {
        error = updateError;
    } else if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase.from('cat_item_ingestion_sources').insert(payload);
        error = insertError;
    }

    if (error) {
        console.error('Failed to save ingestion sources:', error);
        throw new Error(error.message);
    }

    return { success: true };
}

/**
 * Fetches saved inbound sources for a catalog item.
 */
export async function getIngestionSources(params: { itemId?: string; brandId?: string }) {
    const { itemId, brandId } = params;
    if (!!itemId === !!brandId) return [];
    if (itemId === 'dry-run') return [];

    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('cat_item_ingestion_sources')
        .select('sources')
        .eq(itemId ? 'item_id' : 'brand_id', itemId || brandId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch ingestion sources:', error);
        return [];
    }

    return data?.sources || [];
}

/**
 * Deletes saved inbound sources for a catalog item.
 */
export async function deleteIngestionSources(params: { itemId?: string; brandId?: string }) {
    const { itemId, brandId } = params;
    if (!!itemId === !!brandId) {
        throw new Error('Either itemId or brandId must be provided (but not both).');
    }
    const supabase = await createServerClient();
    const { error } = await supabase
        .from('cat_item_ingestion_sources')
        .delete()
        .eq(itemId ? 'item_id' : 'brand_id', itemId || brandId);

    if (error) {
        console.error('Failed to delete ingestion sources:', error);
        throw new Error(error.message);
    }

    return { success: true };
}

// ─── Ignore Rules (Discovery) ────────────────────────────────────────────────

export async function getIngestionIgnoreRules(params: { brandId: string }) {
    const { brandId } = params;
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('cat_ingestion_ignore_rules')
        .select('id, pattern_type, pattern_value, active')
        .eq('brand_id', brandId)
        .eq('active', true);

    if (error) {
        console.error('Failed to fetch ingestion ignore rules:', error);
        throw new Error(error.message);
    }
    return data || [];
}

export async function saveIngestionIgnoreRule(params: {
    brandId: string;
    tenantId?: string;
    patternType: 'URL' | 'NAME' | 'TYPE';
    patternValue: string;
}) {
    const { brandId, tenantId, patternType, patternValue } = params;
    if (patternType === 'TYPE' && !patternValue) {
        throw new Error('Cannot ignore by type: category is missing.');
    }
    const supabase = await createServerClient();
    const { data: existing, error: lookupError } = await supabase
        .from('cat_ingestion_ignore_rules')
        .select('id')
        .eq('brand_id', brandId)
        .eq('pattern_type', patternType)
        .eq('pattern_value', patternValue)
        .limit(1)
        .maybeSingle();

    if (lookupError) {
        console.error('Failed to lookup ingestion ignore rule:', lookupError);
        throw new Error(lookupError.message);
    }

    if (existing?.id) {
        const { error: updateError } = await supabase
            .from('cat_ingestion_ignore_rules')
            .update({
                tenant_id: tenantId || null,
                active: true,
            })
            .eq('id', existing.id);
        if (updateError) {
            console.error('Failed to update ingestion ignore rule:', updateError);
            throw new Error(updateError.message);
        }
        return { success: true };
    }

    const { error: insertError } = await supabase.from('cat_ingestion_ignore_rules').insert({
        brand_id: brandId,
        tenant_id: tenantId || null,
        pattern_type: patternType,
        pattern_value: patternValue,
        active: true,
    });

    if (insertError) {
        console.error('Failed to insert ingestion ignore rule:', insertError);
        throw new Error(insertError.message);
    }
    return { success: true };
}

export async function deactivateIngestionIgnoreRule(params: { ruleId: string }) {
    const { ruleId } = params;
    const supabase = await createServerClient();
    const { error } = await supabase.from('cat_ingestion_ignore_rules').update({ active: false }).eq('id', ruleId);

    if (error) {
        console.error('Failed to deactivate ingestion ignore rule:', error);
        throw new Error(error.message);
    }
    return { success: true };
}

export async function expandSeriesFromSources(params: {
    brandId: string;
    seriesUrl?: string;
    seriesName?: string;
    categoryHint?: string;
}) {
    const { brandId, seriesUrl, seriesName, categoryHint } = params;
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('cat_item_ingestion_sources')
        .select('sources')
        .eq('brand_id', brandId)
        .single();

    if (error) {
        console.error('Failed to load ingestion sources for series expansion:', error);
        throw new Error(error.message);
    }

    const sources = (data as any)?.sources || [];
    const seen = new Set<string>();
    const models: ExtractedModel[] = [];

    for (const src of sources) {
        const sourceHtml = src?.sourceHtml || '';
        if (!sourceHtml.includes('__JSS_STATE__')) continue;
        const jssMatch = sourceHtml.match(/id="__JSS_STATE__">([\s\S]*?)<\/script>/);
        if (!jssMatch) continue;
        let jssData: any;
        try {
            jssData = JSON.parse(jssMatch[1]);
        } catch {
            continue;
        }

        const footerBlocks = jssData?.sitecore?.route?.placeholders?.['jss-footer'];
        if (!Array.isArray(footerBlocks)) continue;

        for (const block of footerBlocks) {
            const navCats = block?.fields?.NavigationCategory || [];
            for (const cat of navCats) {
                const firstList = cat?.fields?.FirstChildList || [];
                for (const entry of firstList) {
                    const title = entry?.fields?.Title?.value;
                    const href = entry?.fields?.Link?.value?.href || entry?.fields?.Link?.value?.url;
                    const matchesByName = seriesName && title?.toLowerCase() === seriesName.toLowerCase();
                    const matchesByUrl = seriesUrl && href && href.toLowerCase() === seriesUrl.toLowerCase();
                    if (!matchesByName && !matchesByUrl) continue;

                    const childList = entry?.fields?.ChildList || [];
                    for (const child of childList) {
                        const childTitle = child?.fields?.Title?.value || child?.displayName;
                        const childHref = child?.fields?.Link?.value?.href || child?.fields?.Link?.value?.url;
                        if (!childTitle || !childHref) continue;
                        const key = childHref.toLowerCase();
                        if (seen.has(key)) continue;
                        seen.add(key);

                        models.push({
                            name: childTitle,
                            category: categoryHint,
                            specs: { source_series: seriesName || title || null },
                            variants: [],
                            provenance: {
                                source_url: seriesUrl || childHref,
                                fetched_at: new Date().toISOString(),
                                parser_version: 'series-footer-v1.0',
                                external_id: childHref,
                                brand_slug: 'tvs',
                            },
                        });
                    }
                }
            }
        }
    }

    return { success: true, models };
}

// Helper to create server client (internal)
async function createServerClient() {
    const { createClient } = await import('@/lib/supabase/server');
    return createClient();
}
