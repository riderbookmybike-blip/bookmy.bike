const DEFAULT_MEMBER_NAME = 'MEMBER';
const DEFAULT_MEMBER_CODE = 'BMB-000-000';

export const formatMembershipCardCode = (
    rawCode: string | null | undefined,
    fallbackCode: string = DEFAULT_MEMBER_CODE
): string => {
    const cleaned = String(rawCode || fallbackCode)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    const canonicalNine = (cleaned || 'XXXXXXXXX').padEnd(9, 'X').slice(0, 9);
    return `${canonicalNine.slice(0, 3)}-${canonicalNine.slice(3, 6)}-${canonicalNine.slice(6, 9)}`;
};

export const formatMembershipCardName = (
    rawName: string | null | undefined,
    fallbackName: string = DEFAULT_MEMBER_NAME
): string => {
    const cleaned = String(rawName || fallbackName)
        .trim()
        .replace(/\s+/g, ' ');

    return cleaned || DEFAULT_MEMBER_NAME;
};

export const resolveMembershipCardIdentity = ({
    memberName,
    memberCode,
    fallbackName,
    fallbackCode,
}: {
    memberName?: string | null;
    memberCode?: string | null;
    fallbackName?: string;
    fallbackCode?: string;
}) => ({
    name: formatMembershipCardName(memberName, fallbackName),
    code: formatMembershipCardCode(memberCode, fallbackCode),
});
