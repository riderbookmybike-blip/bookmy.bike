// Asset Download Service — called from syncAction.ts (server action boundary)

/**
 * assetDownloader.ts — Safe Asset Download Service
 *
 * Handles:
 * 1. Path sanitization & traversal protection
 * 2. SHA-256 hash-based deduplication
 * 3. File type validation & size limits
 * 4. Chunked batch downloads with progress
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'fs';
import { join, resolve, basename, extname } from 'path';

// ─── Configuration ──────────────────────────────────────────────────────

const MEDIA_ROOT = join(process.cwd(), 'public', 'media');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.svg', '.avif', '.gif', '.mp4', '.pdf'];
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'application/pdf'];
const BATCH_CONCURRENCY = 5;

// [FIX #8] Domain allowlist for asset downloads — mirrors scraperAction.ts
const ASSET_DOMAIN_ALLOWLIST = [
    'tvsmotor.com',
    'heromotocorp.com',
    'honda2wheelersindia.com',
    'bajajauto.com',
    'suzukimotorcycle.co.in',
    'yamaha-motor-india.com',
    // CDN domains used by OEMs
    'cloudfront.net',
    'akamaized.net',
    'imgix.net',
    'cloudinary.com',
];

function isAllowedAssetDomain(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ASSET_DOMAIN_ALLOWLIST.some(d => parsed.hostname.endsWith(d));
    } catch {
        return false;
    }
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface DownloadRequest {
    url: string;
    targetPath: string; // Relative to /public/media/, e.g., "tvs/jupiter/drum/grey/primary.webp"
}

export interface DownloadResult {
    url: string;
    localPath: string; // Path relative to /public/, e.g., "/media/tvs/..."
    sha256: string;
    fileSize: number;
    contentType: string;
    status: 'downloaded' | 'dedupe_skipped' | 'error';
    error?: string;
}

export interface BatchProgress {
    total: number;
    completed: number;
    skipped: number;
    failed: number;
    results: DownloadResult[];
}

// ─── Path Safety ────────────────────────────────────────────────────────

/**
 * Sanitize a filename to prevent traversal and special chars.
 */
function sanitizeFilename(name: string): string {
    return name
        .replace(/\.\./g, '') // Remove traversal
        .replace(/[^a-zA-Z0-9._-]/g, '-') // Only safe chars
        .replace(/-+/g, '-') // Collapse dashes
        .replace(/^-|-$/g, '') // Trim leading/trailing dashes
        .toLowerCase();
}

/**
 * Validate that the resolved path stays within MEDIA_ROOT.
 */
function validatePath(targetPath: string): {
    safe: boolean;
    resolved: string;
    sanitizedRelative: string;
    error?: string;
} {
    const sanitizedParts = targetPath.split('/').map(sanitizeFilename).filter(Boolean);
    const sanitizedRelative = sanitizedParts.join('/'); // [FIX #6] Build sanitized relative path
    const resolved = resolve(MEDIA_ROOT, ...sanitizedParts);

    if (!resolved.startsWith(MEDIA_ROOT)) {
        return { safe: false, resolved, sanitizedRelative, error: 'Path traversal detected' };
    }

    const ext = extname(resolved).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { safe: false, resolved, sanitizedRelative, error: `Extension ${ext} not allowed` };
    }

    return { safe: true, resolved, sanitizedRelative };
}

// ─── Hashing ────────────────────────────────────────────────────────────

function computeSha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
}

// ─── Preflight ──────────────────────────────────────────────────────────

/**
 * Check that the media root directory exists and is writable.
 */
export async function preflightCheck(): Promise<{
    ok: boolean;
    mediaRoot: string;
    error?: string;
}> {
    try {
        if (!existsSync(MEDIA_ROOT)) {
            mkdirSync(MEDIA_ROOT, { recursive: true });
        }
        // Test write
        const testFile = join(MEDIA_ROOT, '.preflight_test');
        writeFileSync(testFile, 'ok');
        const { unlinkSync } = await import('fs');
        unlinkSync(testFile);
        return { ok: true, mediaRoot: MEDIA_ROOT };
    } catch (e: unknown) {
        return { ok: false, mediaRoot: MEDIA_ROOT, error: e.message };
    }
}

// ─── Single Download ────────────────────────────────────────────────────

/**
 * Download a single asset with safety checks.
 * @param existingHashes - Set of known sha256 hashes for dedup
 */
export async function downloadAsset(request: DownloadRequest, existingHashes?: Set<string>): Promise<DownloadResult> {
    const { url, targetPath } = request;

    // [FIX #8] Validate asset URL against domain allowlist
    if (!isAllowedAssetDomain(url)) {
        return {
            url,
            localPath: '',
            sha256: '',
            fileSize: 0,
            contentType: '',
            status: 'error',
            error: `Asset domain not in allowlist: ${url}`,
        };
    }

    // 1. Validate path
    const pathCheck = validatePath(targetPath);
    if (!pathCheck.safe) {
        return {
            url,
            localPath: '',
            sha256: '',
            fileSize: 0,
            contentType: '',
            status: 'error',
            error: pathCheck.error,
        };
    }

    // [FIX #6] Use sanitized relative path for all returns
    const sanitizedLocalPath = `/media/${pathCheck.sanitizedRelative}`;

    try {
        // 2. Fetch the asset
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BookMyBike-AssetSync/1.0',
                Accept: 'image/*,video/*,application/pdf',
            },
            signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (!response.ok) {
            return {
                url,
                localPath: '',
                sha256: '',
                fileSize: 0,
                contentType: '',
                status: 'error',
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        // 3. Validate content type
        const contentType = response.headers.get('content-type') || '';
        if (!ALLOWED_MIME_PREFIXES.some(p => contentType.startsWith(p))) {
            return {
                url,
                localPath: '',
                sha256: '',
                fileSize: 0,
                contentType,
                status: 'error',
                error: `Content-Type ${contentType} not allowed`,
            };
        }

        // 4. Read buffer and check size
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > MAX_FILE_SIZE) {
            return {
                url,
                localPath: '',
                sha256: '',
                fileSize: buffer.length,
                contentType,
                status: 'error',
                error: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB > ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
            };
        }

        // 5. Compute hash for dedup
        const sha256 = computeSha256(buffer);

        // 6. Check dedup
        if (existingHashes?.has(sha256)) {
            return {
                url,
                localPath: sanitizedLocalPath,
                sha256,
                fileSize: buffer.length,
                contentType,
                status: 'dedupe_skipped',
            };
        }

        // 7. Check if file already exists with same hash
        if (existsSync(pathCheck.resolved)) {
            const existingBuffer = readFileSync(pathCheck.resolved);
            const existingHash = computeSha256(existingBuffer);
            if (existingHash === sha256) {
                return {
                    url,
                    localPath: sanitizedLocalPath,
                    sha256,
                    fileSize: buffer.length,
                    contentType,
                    status: 'dedupe_skipped',
                };
            }
        }

        // 8. Ensure directory exists and write
        const dir = resolve(pathCheck.resolved, '..');
        mkdirSync(dir, { recursive: true });
        writeFileSync(pathCheck.resolved, buffer);

        return {
            url,
            localPath: sanitizedLocalPath,
            sha256,
            fileSize: buffer.length,
            contentType,
            status: 'downloaded',
        };
    } catch (e: unknown) {
        return {
            url,
            localPath: '',
            sha256: '',
            fileSize: 0,
            contentType: '',
            status: 'error',
            error: e.message,
        };
    }
}

// ─── Batch Download ─────────────────────────────────────────────────────

/**
 * Download assets in controlled batches with progress tracking.
 * Concurrency is bounded to BATCH_CONCURRENCY.
 */
export async function downloadBatch(requests: DownloadRequest[], existingHashes?: Set<string>): Promise<BatchProgress> {
    const progress: BatchProgress = {
        total: requests.length,
        completed: 0,
        skipped: 0,
        failed: 0,
        results: [],
    };

    // Process in chunks
    for (let i = 0; i < requests.length; i += BATCH_CONCURRENCY) {
        const chunk = requests.slice(i, i + BATCH_CONCURRENCY);
        const results = await Promise.allSettled(chunk.map(req => downloadAsset(req, existingHashes)));

        for (const result of results) {
            if (result.status === 'fulfilled') {
                const r = result.value;
                progress.results.push(r);
                if (r.status === 'downloaded') progress.completed++;
                else if (r.status === 'dedupe_skipped') progress.skipped++;
                else progress.failed++;

                // Add to hash set for intra-batch dedup
                if (r.sha256 && existingHashes) existingHashes.add(r.sha256);
            } else {
                progress.failed++;
                progress.results.push({
                    url: chunk[results.indexOf(result)]?.url || 'unknown',
                    localPath: '',
                    sha256: '',
                    fileSize: 0,
                    contentType: '',
                    status: 'error',
                    error: result.reason?.message || 'Unknown error',
                });
            }
        }
    }

    return progress;
}

/**
 * Generate canonical asset path for a product item.
 * Format: {brand}/{model}/{variant}/{color}/{filename}
 */
export function generateAssetPath(params: {
    brandSlug: string;
    modelSlug: string;
    variantSlug?: string;
    colorSlug?: string;
    filename: string;
    subfolder?: string; // e.g., "360" for 360-degree images
}): string {
    const parts = [sanitizeFilename(params.brandSlug), sanitizeFilename(params.modelSlug)];

    if (params.variantSlug) parts.push(sanitizeFilename(params.variantSlug));
    if (params.colorSlug) parts.push(sanitizeFilename(params.colorSlug));
    if (params.subfolder) parts.push(sanitizeFilename(params.subfolder));

    parts.push(sanitizeFilename(params.filename));

    return parts.join('/');
}
