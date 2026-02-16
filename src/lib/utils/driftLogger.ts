/**
 * driftLogger.ts - Parity Monitor for Linear Catalog Migration
 */

export interface DriftReport {
    legacyCount: number;
    linearCount: number;
    discrepancies: Array<{
        id: string;
        sku?: string;
        field: string;
        legacy: any;
        linear: any;
    }>;
    parityPercentage: number;
}

export function logCatalogDrift(report: DriftReport) {
    const { legacyCount, linearCount, discrepancies, parityPercentage } = report;

    if (discrepancies.length === 0) {
        console.log(`✅ [Catalog Parity] 100% matched (${legacyCount} items).`);
        return;
    }

    console.warn(`⚠️ [Catalog Drift] Parity: ${parityPercentage.toFixed(2)}% (${linearCount}/${legacyCount})`);

    // Log top 5 discrepancies to avoid spamming logs
    discrepancies.slice(0, 5).forEach(d => {
        console.warn(`   - Item ${d.id} (${d.sku || 'No SKU'}): Field "${d.field}" mismatched.`);
        console.warn(`     Legacy:`, d.legacy);
        console.warn(`     Linear:`, d.linear);
    });

    if (discrepancies.length > 5) {
        console.warn(`   ... and ${discrepancies.length - 5} more discrepancies.`);
    }
}

export function calculateParity(legacy: any[], linear: any[], matchKey: string = 'id'): DriftReport {
    const linearMap = new Map(linear.map(i => [i[matchKey], i]));
    const discrepancies: DriftReport['discrepancies'] = [];

    legacy.forEach(lItem => {
        const linItem = linearMap.get(lItem[matchKey]);
        if (!linItem) {
            discrepancies.push({
                id: lItem.id,
                sku: lItem.sku,
                field: 'exists_in_linear',
                legacy: true,
                linear: false,
            });
            return;
        }

        // Deep parity check on critical fields
        const criticalFields = ['price.exShowroom', 'displayName', 'sku'];
        criticalFields.forEach(fieldPath => {
            const lVal = getDeepValue(lItem, fieldPath);
            const rVal = getDeepValue(linItem, fieldPath);

            if (lVal !== rVal) {
                discrepancies.push({
                    id: lItem.id,
                    sku: lItem.sku,
                    field: fieldPath,
                    legacy: lVal,
                    linear: rVal,
                });
            }
        });
    });

    const parityPercentage = legacy.length > 0 ? ((legacy.length - discrepancies.length) / legacy.length) * 100 : 100;

    return {
        legacyCount: legacy.length,
        linearCount: linear.length,
        discrepancies,
        parityPercentage,
    };
}

function getDeepValue(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
