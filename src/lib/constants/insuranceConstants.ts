/**
 * Insurance Constants — Industry-standard Motor Vehicles Act labels.
 *
 * SOT insurance schema only exposes numeric fields (od, tp, pa, addons, gst_rate).
 * These labels are regulatory, not dealer-configurable.
 */

export const TP_LABEL = 'Third Party';
export const TP_SUBTEXT = 'Liability Only (5 Years Cover)';
export const OD_LABEL = 'Own Damage';
export const OD_SUBTEXT = 'Comprehensive (1 Year Cover)';
export const TP_DETAIL = 'Mandatory by Law';

/** Combined subtitle for config cards / dossier */
export const INSURANCE_SUBTITLE = `${TP_SUBTEXT} & ${OD_SUBTEXT}`;
