'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
    Building2,
    Store,
    Landmark,
    Linkedin,
    ChevronRight,
    Camera,
    Power,
    Home as HomeIcon,
    Bike,
    Heart as HeartIcon,
    Globe,
    LayoutDashboard,
    User as LucideUser,
    Heart,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    ChevronDown,
    MapPin,
    X,
    MessageSquare,
    Send,
    Copy,
    Share2,
    Download,
    Facebook,
    Twitter,
    Instagram,
    Eye,
    ExternalLink,
    Check,
} from 'lucide-react';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';
import { OCircleLogo } from '@/components/common/OCircleLogo';
import { useDealerSession } from '@/hooks/useDealerSession';
import { OCircleMembershipCard, type WalletData } from '@/components/auth/OCircleMembershipCard';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getDefaultAvatar, AVATAR_PRESETS } from '@/lib/avatars';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatMembershipCardCode } from '@/lib/oclub/membershipCardIdentity';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { uploadMemberImage } from '@/actions/members';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN', 'SUPER_ADMIN', 'DEALERSHIP_ADMIN', 'MARKETPLACE_ADMIN']);

interface ProfileMembership {
    role: string | null;
    tenant_id: string | null;
    tenants: {
        id: string | null;
        slug: string | null;
        name: string | null;
        type: string | null;
        studio_id?: string | null;
        district_name?: string | null;
    } | null;
}

interface MemberIdentityProfile {
    full_name: string | null;
    avatar_url: string | null;
    primary_phone: string | null;
    primary_email: string | null;
}

interface ProfileDropdownProps {
    onLoginClick: () => void;
    scrolled: boolean;
    theme: string;
    tone?: 'light' | 'dark';
    externalOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
    compactTrigger?: boolean;
}

export function ProfileDropdown({
    onLoginClick,
    scrolled,
    theme,
    tone,
    externalOpen,
    onOpenChange,
    hideTrigger = false,
    compactTrigger = false,
}: ProfileDropdownProps) {
    const { isUnifiedContext } = useTenant();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [memberProfile, setMemberProfile] = useState<MemberIdentityProfile | null>(null);
    const [memberships, setProfileMemberships] = useState<ProfileMembership[]>([]);
    const [internalOpen, setInternalOpen] = useState(false);
    const [bCoins, setBCoins] = useState<number | null>(null);
    const [memberCode, setMemberCode] = useState<string>('');
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [referralCopied, setReferralCopied] = useState(false);
    // WA Quick Welcome state
    const [waOpen, setWaOpen] = useState(false);
    const [waPhone, setWaPhone] = useState('');
    const [waLang, setWaLang] = useState<'en_GB' | 'hi' | 'mr' | ''>('');
    const [waStatus, setWaStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
    const [waError, setWaError] = useState('');

    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) onOpenChange(open);
        setInternalOpen(open);
    };
    const [mounted, setMounted] = useState(false);
    const [location, setLocation] = useState<{
        area: string;
        taluka: string;
        district?: string;
        state?: string;
        stateCode?: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [mappedDealerTenants, setMappedDealerTenants] = useState<
        Array<{ id: string; name: string; slug: string | null; type: string; district_name?: string | null }>
    >([]);
    const [dealerLinkedFinancers, setDealerLinkedFinancers] = useState<
        Array<{ id: string; name: string; slug: string | null; type: string }>
    >([]);
    const mappedDealersFetchKeyRef = useRef('');
    const linkedFinancersFetchKeyRef = useRef('');
    // Collapsible section state for business mode
    const [studiosSectionOpen, setStudiosSectionOpen] = useState(false);
    const [financersSectionOpen, setFinancersSectionOpen] = useState(false);

    // O'Circle vs Business mode toggle (persisted)
    const [businessMode, setBusinessMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        const savedMode = localStorage.getItem('bkmb_sidebar_mode');
        if (!savedMode) return true;
        return savedMode === 'business';
    });
    const toggleMode = () => {
        setBusinessMode(prev => {
            const next = !prev;
            localStorage.setItem('bkmb_sidebar_mode', next ? 'business' : 'ocircle');
            return next;
        });
    };

    // CRM section collapse state
    const [dealerCrmOpen, setDealerCrmOpen] = useState(false);
    const [financerCrmOpen, setFinancerCrmOpen] = useState(false);

    // Dealer Session Hook
    const { activeTenantId, setDealerContext, clearDealerContext, financeId, setFinanceContext } = useDealerSession();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLButtonElement>(null); // Fixed: Ref is attached to a button

    const referralCode = useMemo(() => {
        if (memberCode) return memberCode;
        if (user?.id) return user.id.slice(0, 8).toUpperCase();
        return '';
    }, [memberCode, user?.id]);

    const referralUrl = useMemo(() => {
        if (!referralCode) return '';
        const baseUrl = 'https://www.bookmy.bike';
        return `${baseUrl}/store?ref=${encodeURIComponent(referralCode)}`;
    }, [referralCode]);

    const referralText = useMemo(() => {
        if (!referralUrl) return '';
        const cp = (...codes: number[]) => String.fromCodePoint(...codes);
        const e = {
            rocket: cp(0x1f680),
            bike: cp(0x1f3cd, 0xfe0f),
            sparkles: cp(0x2728),
            gift: cp(0x1f381),
            moneyBag: cp(0x1f4b0),
            handshake: cp(0x1f91d),
            party: cp(0x1f389),
            wings: cp(0x1f4b8),
            check: cp(0x2705),
            inr: cp(0x20b9),
        };
        return `${e.rocket} I just booked my bike on BookMyBike! ${e.bike}${e.sparkles}

Mujhe mile additional 13 B-Coins ${e.gift}
(approx. ${e.inr}1000 value ${e.moneyBag})

Aap bhi signup karo, apna referral link pao, aur sharing se earn karo! ${e.handshake}${e.party}

Meri link se abhi join karo aur apni earning start karo! ${e.wings}

${e.check} Best deal guaranteed
${e.check} Easy signup
${e.check} Share & earn rewards

Sign up now:
${referralUrl}`;
    }, [referralCode, referralUrl]);

    const encodedReferralText = useMemo(() => encodeURIComponent(referralText), [referralText]);
    const encodedReferralUrl = useMemo(() => encodeURIComponent(referralUrl), [referralUrl]);

    // Real brand SVGs with brand colors
    const BrandIcons = {
        whatsapp: (
            <svg viewBox="0 0 24 24" fill="#25D366" width="14" height="14">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.12 1.527 5.849L0 24l6.335-1.524A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.214-3.724.897.939-3.619-.234-.373A9.818 9.818 0 0112 2.182c5.424 0 9.818 4.394 9.818 9.818S17.424 21.818 12 21.818z" />
            </svg>
        ),
        instagram: (
            <svg viewBox="0 0 24 24" width="14" height="14">
                <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="25%" stopColor="#e6683c" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="75%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                </defs>
                <path
                    fill="url(#ig-grad)"
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
            </svg>
        ),
        facebook: (
            <svg viewBox="0 0 24 24" fill="#1877F2" width="14" height="14">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
        twitter: (
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        telegram: (
            <svg viewBox="0 0 24 24" fill="#229ED9" width="14" height="14">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
    };

    const socialShareLinks = useMemo(
        () => [
            {
                key: 'whatsapp',
                label: 'WhatsApp',
                href: `https://api.whatsapp.com/send?text=${encodedReferralText}`,
                brandIcon: 'whatsapp',
            },
            {
                key: 'instagram',
                label: 'Instagram',
                href: `https://www.instagram.com/?url=${encodedReferralUrl}`,
                brandIcon: 'instagram',
            },
            {
                key: 'facebook',
                label: 'Facebook',
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodedReferralUrl}`,
                brandIcon: 'facebook',
            },
            {
                key: 'twitter',
                label: 'X',
                href: `https://twitter.com/intent/tweet?text=${encodedReferralText}`,
                brandIcon: 'twitter',
            },
            {
                key: 'telegram',
                label: 'Telegram',
                href: `https://t.me/share/url?url=${encodedReferralUrl}&text=${encodedReferralText}`,
                brandIcon: 'telegram',
            },
        ],
        [encodedReferralText, encodedReferralUrl]
    );

    const sendWelcomeWa = async () => {
        if (!user) return;
        const digits = waPhone.replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(digits)) {
            setWaError('Enter a valid 10-digit mobile number (starts with 6-9)');
            return;
        }
        if (!waLang) {
            setWaError('Please select a language');
            return;
        }
        setWaStatus('sending');
        setWaError('');
        try {
            const supabase = createClient();
            const { data: member } = await supabase
                .from('id_members')
                .select('full_name, primary_phone, whatsapp')
                .eq('id', user.id)
                .maybeSingle();
            const advisorName = String(member?.full_name || '').trim();
            const advisorPhone = (member?.primary_phone || member?.whatsapp || '').replace(/\D/g, '').slice(-10);
            if (!advisorName || advisorPhone.length < 10) {
                setWaError('Your profile name/phone is incomplete. Update your profile first.');
                setWaStatus('idle');
                return;
            }
            const res = await fetch('/api/whatsapp/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: digits,
                    advisor_name: advisorName,
                    advisor_mobile: advisorPhone,
                    referral_code: referralCode,
                    language: waLang,
                }),
            });
            const result = await res.json();
            if (result?.success) {
                setWaStatus('done');
                setTimeout(() => {
                    setWaPhone('');
                    setWaLang('');
                    setWaStatus('idle');
                }, 1800);
            } else {
                setWaError(result?.message || 'Send failed — please try again');
                setWaStatus('error');
            }
        } catch {
            setWaError('Network error — please try again');
            setWaStatus('error');
        }
    };

    const handleCopyReferralUrl = async () => {
        if (!referralUrl) return;
        try {
            await navigator.clipboard.writeText(referralUrl);
            setReferralCopied(true);
            setTimeout(() => setReferralCopied(false), 1600);
        } catch (error) {
            console.error('Failed to copy referral URL:', error);
        }
    };

    const buildReferralPosterBlob = async (): Promise<Blob | null> => {
        if (typeof window === 'undefined' || !referralUrl) return null;

        const W = 1080;
        const H = 1350;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const PAD = 72;
        const FONT_SANS = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        const FONT_MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
        const GOLD = '#f4b000';
        const WHITE = '#ffffff';
        const SLATE = '#94a3b8';
        const LIGHT_SLATE = '#cbd5e1';

        // User Data
        const userName = (memberProfile?.full_name || 'BOOKMY.BIKE MEMBER').toUpperCase();
        const formattedID = formatMembershipCardCode(referralCode);

        const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
            const radius = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + w, y, x + w, y + h, radius);
            ctx.arcTo(x + w, y + h, x, y + h, radius);
            ctx.arcTo(x, y + h, x, y, radius);
            ctx.arcTo(x, y, x + w, y, radius);
            ctx.closePath();
        };

        const svgToImage = (svgMarkup: string): Promise<HTMLImageElement | null> => {
            return new Promise(resolve => {
                const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            });
        };

        const loadImageViaFetch = async (src: string): Promise<HTMLImageElement | null> => {
            try {
                const res = await fetch(src);
                if (!res.ok) return null;
                const blob = await res.blob();
                const objectUrl = URL.createObjectURL(blob);
                const img = await new Promise<HTMLImageElement>(resolve => {
                    const i = new Image();
                    i.onload = () => resolve(i);
                    i.src = objectUrl;
                });
                URL.revokeObjectURL(objectUrl);
                return img;
            } catch {
                return null;
            }
        };

        /* ── Background ─────────────────────────────────── */
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, W, H);

        // Diamond Lattice Texture
        ctx.strokeStyle = 'rgba(255,255,255,0.035)';
        ctx.lineWidth = 1;
        const diaSize = 85;
        for (let x = -W; x <= W * 2; x += diaSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + H, H);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - H, H);
            ctx.stroke();
        }

        // Atmospheric Glow
        const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 800);
        glow.addColorStop(0, 'rgba(244,176,0,0.1)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        /* ── VIP Gold Frame ────────────────────────────── */
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, W - 80, H - 80);
        ctx.strokeStyle = 'rgba(244,176,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(52, 52, W - 104, H - 104);

        /* ── Top Branding ─────────────────────────────── */
        // Exact BMB Icon
        const bmbIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 109" fill="none" width="80" height="109">
            <path d="M19.8104 12.3688C19.8104 12.3688 27.5471 10.8887 25.5022 16.0936C24.8351 17.7928 4.76066 76.5214 2.72546 83.1042C0.690261 89.6869 -0.122845 92.3016 6.01197 92.3016C7.67226 92.3016 10.394 90.9869 11.7037 87.9195C13.1157 84.6282 31.6857 37.2002 37.762 16.3078C40.8538 5.67898 33.1999 5.58648 28.1265 6.67225C22.0014 7.98685 19.8104 12.3688 19.8104 12.3688Z" fill="${GOLD}"/>
            <path d="M62.6811 60.0012C57.8365 52.9023 51.2002 53.4379 47.9721 52.9023C58.7324 47.6147 80.0095 33.0956 79.0016 17.2961C79.0065 -1.52709 63.8155 -0.217357 60.826 0.181892C51.8916 1.37964 40.3669 7.71409 40.6152 12.3639C40.8343 16.5268 48.498 16.3077 48.498 16.3077C51.3463 11.4875 56.1568 8.89236 59.0099 9.30134C61.2642 9.62269 62.4522 11.2002 62.6811 11.5751C67.8811 20.159 56.4245 36.7181 47.9721 43.6319C37.4894 53.2918 26.9239 59.8454 26.9872 60.0012C34.6995 56.9873 50.1729 54.4847 50.3628 68.5899C50.6013 86.2202 24.5333 93.6599 17.6584 95.0913C10.7835 96.5228 -0.51721 101.445 0.0183686 105.223C0.553947 109.002 12.4535 109.289 17.6584 108.427C22.8584 107.57 43.4879 97.6085 53.3523 90.2809C61.2448 84.4187 73.4608 71.6573 77.7454 66.9832C74.6975 68.8723 68.2608 72.6506 66.9219 72.6506C65.2519 72.6506 66.8537 66.1165 62.6811 60.0012Z" fill="${GOLD}"/>
        </svg>`;
        const bmbIcon = await svgToImage(bmbIconSVG);
        if (bmbIcon) ctx.drawImage(bmbIcon, PAD + 28, 85, 48, 65);

        // Exact BMB Wordmark
        const wordmarkSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 42" width="480" height="84" style="overflow:visible">
            <text x="0" y="32" font-family="${FONT_SANS}" font-weight="900" font-size="38" letter-spacing="-0.03em">
                <tspan fill="#FFFFFF">bookmy</tspan><tspan fill="${GOLD}">.bike</tspan>
            </text>
        </svg>`;
        const wordmark = await svgToImage(wordmarkSVG);
        if (wordmark) ctx.drawImage(wordmark, PAD + 90, 85, 410, 72);

        // Exact O'Circle Logo (Footer Style)
        const BLUE_CIRCLE = '#7EB4E2';
        const oCircleSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 52" width="320" height="104">
            <svg x="0" y="10" width="32" height="32" viewBox="0 0 100 100" fill="none">
                <path d="M84.4 34 A 38 38 0 1 0 84.4 66" stroke="${BLUE_CIRCLE}" stroke-width="16" stroke-linecap="butt" fill="none"/>
                <path d="M89.4 43.1 A 38 38 0 0 1 89.4 56.9" stroke="${BLUE_CIRCLE}" stroke-width="16" stroke-linecap="butt" fill="none"/>
            </svg>
            <text x="42" y="36" font-family="${FONT_SANS}" font-weight="800" font-size="28" letter-spacing="-0.03em">
                <tspan fill="${BLUE_CIRCLE}">O&apos;</tspan><tspan fill="#FFFFFF">Circle</tspan>
            </text>
        </svg>`;
        const oCircle = await svgToImage(oCircleSVG);
        if (oCircle) ctx.drawImage(oCircle, 760, 85, 210, 68);

        /* ── Hero Content ───────────────────────────── */
        ctx.textAlign = 'center';
        ctx.fillStyle = GOLD;
        ctx.font = `700 28px ${FONT_SANS}`;
        ctx.fillText('EXCLUSIVE MEMBERSHIP INVITATION', W / 2, 240);

        ctx.fillStyle = WHITE;
        ctx.font = `900 110px ${FONT_SANS}`;
        ctx.fillText('V I P', W / 2, 360);
        ctx.font = `700 42px ${FONT_SANS}`;
        ctx.fillText('PARTNER', W / 2, 420);

        /* ── Red Ribbon with O'Circle Logo ──────────── */
        const ribbonY = 510;
        const ribbonW = 540;
        const ribbonH = 110;
        const rX = (W - ribbonW) / 2;

        ctx.fillStyle = '#b91c1c'; // Crimson
        ctx.beginPath();
        ctx.moveTo(rX, ribbonY);
        ctx.lineTo(rX + ribbonW, ribbonY);
        ctx.lineTo(rX + ribbonW + 50, ribbonY + ribbonH / 2);
        ctx.lineTo(rX + ribbonW, ribbonY + ribbonH);
        ctx.lineTo(rX, ribbonY + ribbonH);
        ctx.lineTo(rX - 50, ribbonY + ribbonH / 2);
        ctx.closePath();
        ctx.fill();

        // Draw O'Circle Logo inside ribbon instead of text
        const ribbonLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="400" height="120">
            <svg x="10" y="10" width="40" height="40" viewBox="0 0 100 100" fill="none">
                <path d="M84.4 34 A 38 38 0 1 0 84.4 66" stroke="#ffffff" stroke-width="20" stroke-linecap="butt" fill="none"/>
                <path d="M89.4 43.1 A 38 38 0 0 1 89.4 56.9" stroke="#ffffff" stroke-width="20" stroke-linecap="butt" fill="none"/>
            </svg>
            <text x="60" y="42" font-family="${FONT_SANS}" font-weight="900" font-size="34" letter-spacing="0.05em" fill="#ffffff">O&apos;CIRCLE</text>
        </svg>`;
        const ribbonLogo = await svgToImage(ribbonLogoSVG);
        if (ribbonLogo) ctx.drawImage(ribbonLogo, W / 2 - 130, ribbonY + 20, 260, 78);

        /* ── Real User Membership Card (Drawn) ───────── */
        const cardW = 680;
        const cardH = 430;
        const cardX = (W - cardW) / 2;
        const cardY = 680;

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 40;
        roundRect(cardX, cardY, cardW, cardH, 28);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Black metal gradient
        const cardBg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        cardBg.addColorStop(0, '#151515');
        cardBg.addColorStop(1, '#080808');
        ctx.fillStyle = cardBg;
        ctx.fill();

        // Subtle carbon fiber pattern overlay (mocked via lines)
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < cardW + cardH; i += 4) {
            ctx.beginPath();
            ctx.moveTo(cardX + i, cardY);
            ctx.lineTo(cardX, cardY + i);
            ctx.stroke();
        }

        // Gold edge lighting
        ctx.strokeStyle = 'rgba(244,176,0,0.15)';
        ctx.lineWidth = 2;
        roundRect(cardX + 2, cardY + 2, cardW - 4, cardH - 4, 26);
        ctx.stroke();

        // Card Content: The O' Circle logo & BMB Logo
        ctx.textAlign = 'left';
        ctx.fillStyle = GOLD;
        ctx.font = `900 14px ${FONT_SANS}`;
        ctx.fillText("THE O' CIRCLE", cardX + 50, cardY + 60);
        ctx.fillRect(cardX + 50, cardY + 70, 30, 2);

        if (bmbIcon) ctx.drawImage(bmbIcon, cardX + cardW - 80, cardY + 30, 50, 68);

        // Chip placeholder
        const chipX = cardX + 50;
        const chipY = cardY + 140;
        roundRect(chipX, chipY, 80, 60, 8);
        const chipBg = ctx.createLinearGradient(chipX, chipY, chipX + 80, chipY + 60);
        chipBg.addColorStop(0, '#fcd34d');
        chipBg.addColorStop(1, '#b45309');
        ctx.fillStyle = chipBg;
        ctx.fill();

        // Member ID & Name
        ctx.fillStyle = WHITE;
        ctx.font = `500 36px ${FONT_MONO}`;
        ctx.fillText(formattedID, cardX + 50, cardY + 280);

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `700 28px ${FONT_SANS}`;
        ctx.fillText(userName, cardX + 50, cardY + 360);

        const expY = cardY + 280;
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = `900 14px ${FONT_SANS}`;
        ctx.fillText('EXP', cardX + cardW - 130, expY - 10);
        ctx.fillStyle = GOLD;
        ctx.font = `500 22px ${FONT_MONO}`;
        ctx.fillText('∞', cardX + cardW - 60, expY - 5);
        ctx.textAlign = 'center';

        /* ── QR Code ────────────────────────────────── */
        const qrSize = 190;
        const qrX = W - PAD - qrSize - 40;
        const qrY = H - PAD - qrSize - 40;
        roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 20);
        ctx.fillStyle = WHITE;
        ctx.fill();

        const qrImage = await loadImageViaFetch(
            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referralUrl)}`
        );
        if (qrImage) ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        /* ── Invite Info ────────────────────────────── */
        ctx.textAlign = 'left';
        ctx.fillStyle = WHITE;
        ctx.font = `800 36px ${FONT_SANS}`;
        ctx.fillText('YOUR REWARD AWAITS', PAD + 40, H - 280);
        ctx.fillStyle = GOLD;
        ctx.font = `700 28px ${FONT_SANS}`;
        ctx.fillText('13 B-COINS (~₹1,000) CREDITED JIT', PAD + 40, H - 235);
        ctx.fillStyle = LIGHT_SLATE;
        ctx.font = `500 22px ${FONT_SANS}`;
        ctx.fillText('Join the movement. Secure the best motorcycle deal.', PAD + 40, H - 195);
        ctx.fillStyle = GOLD;
        ctx.font = `700 22px ${FONT_MONO}`;
        ctx.fillText(referralUrl, PAD + 40, H - 150);

        /* ── Footer ──────────────────────────────────── */
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = `700 22px ${FONT_SANS}`;
        ctx.fillText("THE O'CIRCLE CREW", W / 2, H - 75);

        return new Promise(resolve => {
            canvas.toBlob(b => resolve(b), 'image/png', 1.0);
        });
    };

    const triggerPosterDownload = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bookmybike-referral-${referralCode || 'invite'}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleShareReferralImage = async () => {
        try {
            const posterBlob = await buildReferralPosterBlob();
            if (!posterBlob) return;

            const file = new File([posterBlob], `bookmybike-referral-${referralCode || 'invite'}.png`, {
                type: 'image/png',
            });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'BookMyBike Referral',
                    text: referralText,
                });
                return;
            }

            triggerPosterDownload(posterBlob);
        } catch (error) {
            console.error('Referral image share failed:', error);
        }
    };

    const handleDownloadReferralImage = async () => {
        try {
            const posterBlob = await buildReferralPosterBlob();
            if (!posterBlob) return;
            triggerPosterDownload(posterBlob);
        } catch (error) {
            console.error('Referral image download failed:', error);
        }
    };

    // Close on click outside is now handled by the Backdrop overlay in the logic below

    useEffect(() => {
        setUser(authUser);

        if (authUser?.id) {
            import('@/actions/oclub').then(({ getOClubWallet }) => {
                getOClubWallet(authUser.id).then(res => {
                    if (res.success && res.wallet) {
                        const w = res.wallet as any;
                        setBCoins(w.available_system || 0);
                        setWalletData({
                            available_system: w.available_system || 0,
                            available_referral: w.available_referral || 0,
                            available_sponsored: w.available_sponsored || 0,
                            lifetime_earned: w.lifetime_earned || 0,
                            lifetime_redeemed: w.lifetime_redeemed || 0,
                            locked: w.locked || 0,
                        });
                    }
                });
            });

            // Fetch referral_code (SOT for URL) and display_id (for card display)
            const supabase = createClient();
            supabase
                .from('id_members')
                .select('display_id, referral_code, full_name, avatar_url, primary_phone, primary_email')
                .eq('id', authUser.id)
                .maybeSingle()
                .then(({ data }) => {
                    setMemberProfile({
                        full_name: data?.full_name || null,
                        avatar_url: data?.avatar_url || null,
                        primary_phone: data?.primary_phone || null,
                        primary_email: data?.primary_email || null,
                    });
                    if (data?.referral_code) {
                        // Use raw referral_code as the identity in the referral URL.
                        // formatMembershipCardCode() is applied at display time (poster/card)
                        // using the same value, so the card visual stays formatted.
                        setMemberCode(data.referral_code);
                    } else if (data?.display_id) {
                        // Fallback to display_id if referral_code is missing (should be same value)
                        setMemberCode(data.display_id);
                    }
                });
        } else {
            setBCoins(null);
            setMemberProfile(null);
        }
    }, [authUser]);

    useEffect(() => {
        const loadProfileMemberships = async (userId: string) => {
            const supabase = createClient();
            const { data: rawProfileMemberships, error } = await supabase.rpc('get_user_memberships', {
                p_user_id: userId,
            });

            if (error && (error.message || error.code)) {
                const message = (error.message || error.code || '').toString();
                if (message.includes('AbortError')) {
                    return;
                }
                console.error('Error loading memberships:', message);
                return;
            }

            const mapped = (Array.isArray(rawProfileMemberships) ? rawProfileMemberships : []).map((m: any) => ({
                role: m.role,
                tenant_id: m.tenant_id,
                tenants: {
                    id: m.tenant_id,
                    slug: m.tenant_slug || '',
                    name: m.tenant_name || '',
                    type: m.tenant_type || '',
                    studio_id: m.studio_id || null,
                    district_name: m.district_name || undefined,
                },
            })) as unknown as ProfileMembership[];

            if (mapped.length === 0) {
                const { data: fallbackProfileMemberships } = await supabase
                    .from('id_team')
                    .select('id, user_id, tenant_id, role, status, id_tenants!inner(id, name, slug, type, studio_id)')
                    .eq('user_id', userId)
                    .eq('status', 'ACTIVE');

                const fallback = (fallbackProfileMemberships || []).map((m: any) => {
                    const t = Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants;
                    return {
                        role: m.role,
                        tenant_id: m.tenant_id,
                        tenants: {
                            id: t?.id,
                            slug: t?.slug || '',
                            name: t?.name || '',
                            type: t?.type || '',
                            studio_id: t?.studio_id || null,
                            district_name: undefined,
                        },
                    } as ProfileMembership;
                });
                setProfileMemberships(fallback);
                return;
            }

            setProfileMemberships(mapped);
        };

        if (authUser?.id) {
            loadProfileMemberships(authUser.id);
            return;
        }

        setProfileMemberships([]);
    }, [authUser?.id]);

    useEffect(() => {
        const handleLocationChange = () => {
            const stored = localStorage.getItem('bkmb_user_pincode');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setLocation({
                        area: parsed.area,
                        taluka: parsed.taluka || parsed.city,
                        district: parsed.district,
                        stateCode: parsed.stateCode,
                    });
                } catch (e) {
                    console.error('Error parsing stored location:', e);
                }
            }
        };

        handleLocationChange();
        window.addEventListener('locationChanged', handleLocationChange);
        window.addEventListener('storage', handleLocationChange);

        return () => {
            window.removeEventListener('locationChanged', handleLocationChange);
            window.removeEventListener('storage', handleLocationChange);
        };
    }, []);

    useEffect(() => {
        const mountedFrame = window.requestAnimationFrame(() => setMounted(true));
        return () => window.cancelAnimationFrame(mountedFrame);
    }, []);

    const { clearFavorites } = useFavorites();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        clearFavorites();

        // Only clear auth-related keys
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('active_role');
        localStorage.removeItem('base_role');
        localStorage.removeItem('tenant_type');

        window.location.href = '/';
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file || !user) return;

            const arrayBuffer = await file.arrayBuffer();
            const uint8 = new Uint8Array(arrayBuffer);
            let binary = '';
            uint8.forEach(b => {
                binary += String.fromCharCode(b);
            });
            const base64 = btoa(binary);

            const result = await uploadMemberImage(user.id, base64, 'avatar');
            if (!result.success) throw new Error(result.error);

            setMemberProfile(prev => (prev ? { ...prev, avatar_url: result.url } : prev));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar!');
        } finally {
            setUploading(false);
        }
    };

    const handleAvatarSelect = async (presetUrl: string) => {
        try {
            setUploading(true);
            if (!user) return;
            const supabase = createClient();

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: presetUrl },
            });
            if (updateError) throw updateError;

            await supabase.from('id_members').update({ avatar_url: presetUrl }).eq('id', user.id);

            setMemberProfile(prev => (prev ? { ...prev, avatar_url: presetUrl } : prev));
            setShowAvatarPicker(false);
        } catch (error) {
            console.error('Error setting avatar:', error);
        } finally {
            setUploading(false);
        }
    };

    const getTenantIcon = (type: string) => {
        switch (type) {
            case 'SUPER_ADMIN':
                return <Building2 className="w-5 h-5" />;
            case 'DEALER':
                return <Store className="w-5 h-5" />;
            case 'BANK':
                return <Landmark className="w-5 h-5" />;
            default:
                return <Building2 className="w-5 h-5" />;
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            OWNER: 'Owner',
            ADMIN: 'Admin',
            STAFF: 'Staff',
            DEALERSHIP_ADMIN: 'Admin',
        };
        return labels[role] || role;
    };

    const getWorkspaceDashboardHref = (slug: string | null | undefined) =>
        slug ? `/app/${slug}/dashboard` : '/dashboard';

    const handleWorkspaceLogin = (tenantId: string | null | undefined) => {
        if (!tenantId) return;
        setDealerContext(tenantId);
        setTimeout(() => router.refresh(), 60);
    };

    const handleFinanceLogin = (tenantId: string | null | undefined) => {
        if (!tenantId) return;
        setFinanceContext(tenantId);
        const selected = dealerLinkedFinancers.find(f => f.id === tenantId);
        if (selected?.slug) {
            const next = new URLSearchParams(searchParams?.toString() || '');
            next.set('financeSlug', selected.slug);
            router.replace(`${pathname}?${next.toString()}`);
        }
        setTimeout(() => router.refresh(), 60);
    };

    const handleWorkspaceLogout = () => {
        clearDealerContext();
    };

    const sortedMemberships = useMemo(() => {
        // Deduplicate by tenant_id first
        const uniqueMemberships = Array.from(
            new Map(memberships.filter(m => m.tenants && m.tenant_id).map(m => [m.tenant_id, m])).values()
        );

        return uniqueMemberships.sort((a, b) => {
            const aIsDealer = a.tenants?.type === 'DEALER';
            const bIsDealer = b.tenants?.type === 'DEALER';
            if (aIsDealer && !bIsDealer) return -1;
            if (!aIsDealer && bIsDealer) return 1;
            return (a.tenants?.name || '').localeCompare(b.tenants?.name || '');
        });
    }, [memberships]);

    const dealerMemberships = useMemo(
        () =>
            sortedMemberships.filter(m => {
                const type = String(m.tenants?.type || '').toUpperCase();
                return type === 'DEALER' || type === 'DEALERSHIP';
            }),
        [sortedMemberships]
    );

    const adminMemberships = useMemo(
        () =>
            sortedMemberships.filter(m => {
                const type = String(m.tenants?.type || '').toUpperCase();
                return type === 'SUPER_ADMIN' || type === 'MARKETPLACE';
            }),
        [sortedMemberships]
    );

    const financeMemberships = useMemo(
        () => sortedMemberships.filter(m => String(m.tenants?.type || '').toUpperCase() === 'BANK'),
        [sortedMemberships]
    );

    const primaryFinanceMembership = financeMemberships[0] || null;
    const effectiveActiveFinanceId = financeId || primaryFinanceMembership?.tenant_id || null;
    const isFinanceTeamOnly = financeMemberships.length > 0 && dealerMemberships.length === 0;
    const hasFinanceMembership = financeMemberships.length > 0;
    const availableFinanceOptions = useMemo(() => {
        const byId = new Map<string, { id: string; name: string; slug: string | null }>();

        for (const m of financeMemberships) {
            const id = String(m.tenant_id || '');
            if (!id) continue;
            byId.set(id, {
                id,
                name: m.tenants?.name || 'Financer',
                slug: m.tenants?.slug || null,
            });
        }

        for (const f of dealerLinkedFinancers) {
            const id = String(f.id || '');
            if (!id) continue;
            if (!byId.has(id)) {
                byId.set(id, {
                    id,
                    name: f.name || 'Financer',
                    slug: f.slug || null,
                });
            }
        }

        return Array.from(byId.values());
    }, [financeMemberships, dealerLinkedFinancers]);

    useEffect(() => {
        if (isFinanceTeamOnly && primaryFinanceMembership?.tenant_id && !financeId) {
            setFinanceContext(primaryFinanceMembership.tenant_id);
        }
    }, [isFinanceTeamOnly, primaryFinanceMembership?.tenant_id, financeId, setFinanceContext]);

    useEffect(() => {
        if (!hasFinanceMembership) return;
        // Use availableFinanceOptions (merges direct memberships + dealer-linked financers)
        // so that a dealer-linked financer selected by the user is not treated as "unknown"
        // and doesn't get reset back to the primary direct membership (L&T bug fix)
        const allKnownFinanceIds = new Set(availableFinanceOptions.map(f => f.id).filter(Boolean));
        if (allKnownFinanceIds.size === 0) return;
        if (!financeId || !allKnownFinanceIds.has(financeId)) {
            const fallbackFinanceId = primaryFinanceMembership?.tenant_id;
            if (fallbackFinanceId) setFinanceContext(fallbackFinanceId);
        }
    }, [
        hasFinanceMembership,
        availableFinanceOptions,
        financeId,
        primaryFinanceMembership?.tenant_id,
        setFinanceContext,
    ]);

    useEffect(() => {
        const loadMappedDealersForFinanceTeam = async () => {
            if (!isOpen || !businessMode) return;
            if (!authUser?.id || financeMemberships.length === 0) {
                mappedDealersFetchKeyRef.current = '';
                setMappedDealerTenants([]);
                return;
            }

            const supabase = createClient();
            const financeTenantIds = financeMemberships.map(m => m.tenant_id).filter(Boolean) as string[];
            const fetchKey = `${authUser.id}:${financeTenantIds.join(',')}`;
            if (mappedDealersFetchKeyRef.current === fetchKey) return;
            mappedDealersFetchKeyRef.current = fetchKey;
            const { data: userScopedLinks, error } = await supabase
                .from('dealer_finance_user_access')
                .select('dealer_tenant_id, finance_tenant_id')
                .eq('user_id', authUser.id)
                .in('finance_tenant_id', financeTenantIds);
            if (error) return;

            const dealerIds = Array.from(
                new Set((userScopedLinks || []).map((r: any) => String(r.dealer_tenant_id || '')).filter(Boolean))
            );
            if (dealerIds.length === 0) {
                setMappedDealerTenants([]);
                return;
            }

            const { data: dealers } = await supabase
                .from('id_tenants')
                .select('id, name, slug, type, district_name')
                .in('id', dealerIds);

            const nextMapped = (dealers || []).map((d: any) => ({
                id: d.id,
                name: d.name,
                slug: d.slug || null,
                type: d.type || 'DEALER',
                district_name: d.district_name || null,
            }));
            setMappedDealerTenants(prev => {
                const prevIds = prev.map(d => d.id).join(',');
                const nextIds = nextMapped.map((d: any) => d.id).join(',');
                return prevIds === nextIds ? prev : nextMapped;
            });
        };

        void loadMappedDealersForFinanceTeam();
    }, [authUser?.id, financeMemberships, isOpen, businessMode]);

    useEffect(() => {
        const loadDealerLinkedFinancers = async () => {
            if (!isOpen || !businessMode) return;
            if (!activeTenantId) {
                linkedFinancersFetchKeyRef.current = '';
                setDealerLinkedFinancers([]);
                return;
            }

            const supabase = createClient();
            if (linkedFinancersFetchKeyRef.current === activeTenantId) return;
            linkedFinancersFetchKeyRef.current = activeTenantId;
            const { data: links, error } = await supabase
                .from('dealer_finance_access')
                .select('finance_tenant_id')
                .eq('dealer_tenant_id', activeTenantId);
            if (error) return;

            const financeTenantIds = Array.from(
                new Set((links || []).map((r: any) => String(r.finance_tenant_id || '')).filter(Boolean))
            );
            if (financeTenantIds.length === 0) {
                setDealerLinkedFinancers([]);
                return;
            }

            const { data: financiers } = await supabase
                .from('id_tenants')
                .select('id, name, slug, type')
                .in('id', financeTenantIds)
                .eq('type', 'BANK');

            const nextFinancers = (financiers || []).map((f: any) => ({
                id: f.id,
                name: f.name,
                slug: f.slug || null,
                type: f.type || 'BANK',
            }));
            setDealerLinkedFinancers(prev => {
                const prevIds = prev.map(f => f.id).join(',');
                const nextIds = nextFinancers.map((f: any) => f.id).join(',');
                return prevIds === nextIds ? prev : nextFinancers;
            });
        };

        void loadDealerLinkedFinancers();
    }, [activeTenantId, isOpen, businessMode]);

    const activeMembership = useMemo(
        () => sortedMemberships.find(m => m.tenant_id === activeTenantId) || sortedMemberships[0] || null,
        [sortedMemberships, activeTenantId]
    );

    const hasWorkspaceAccess = sortedMemberships.length > 0;
    const activeWorkspaceRole = (activeMembership?.role || '').toUpperCase();
    const workspaceBasePath = activeMembership?.tenants?.slug
        ? `/app/${activeMembership.tenants.slug}/dashboard`
        : '/dashboard';
    const isAdminWorkspaceRole = ADMIN_ROLES.has(activeWorkspaceRole);
    const createLeadHref = workspaceBasePath.includes('/dashboard')
        ? `${workspaceBasePath.replace('/dashboard', '')}/leads?action=create`
        : '/leads?action=create';
    useEffect(() => {
        // If user has no business workspaces, force O'Circle mode to avoid empty middle panel.
        if (!hasWorkspaceAccess && businessMode) {
            setBusinessMode(false);
            if (typeof window !== 'undefined') {
                localStorage.setItem('bkmb_sidebar_mode', 'ocircle');
            }
        }
    }, [hasWorkspaceAccess, businessMode]);

    const accountMenuItems = useMemo(() => {
        if (!user) return [];

        if (!hasWorkspaceAccess || !businessMode) {
            // O'Circle / consumer mode
            return [
                {
                    label: 'Home',
                    icon: HomeIcon,
                    href: '/',
                    color: 'text-slate-500',
                    bg: 'bg-slate-500/10',
                },
                {
                    label: "O'Circle",
                    icon: OCircleLogo,
                    href: '/store/ocircle?tab=PROFILE',
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10',
                },
                {
                    label: 'Favorites',
                    icon: Heart,
                    href: '/store/compare/favorites',
                    color: 'text-rose-500',
                    bg: 'bg-rose-500/10',
                },
            ];
        }

        // Business mode
        const workspaceItems = [
            {
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: workspaceBasePath,
                color: 'text-indigo-500',
                bg: 'bg-indigo-500/10',
            },
            {
                label: 'Profile',
                icon: LucideUser,
                href: `${workspaceBasePath}/settings/profile`,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
            },
            {
                label: isAdminWorkspaceRole ? 'Team' : 'Settings',
                icon: isAdminWorkspaceRole ? Building2 : Settings,
                href: isAdminWorkspaceRole ? `${workspaceBasePath}/settings/team` : `${workspaceBasePath}/settings`,
                color: isAdminWorkspaceRole ? 'text-emerald-500' : 'text-slate-500',
                bg: isAdminWorkspaceRole ? 'bg-emerald-500/10' : 'bg-slate-500/10',
            },
            {
                label: 'Notifications',
                icon: Bell,
                href: '/notifications',
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
            },
        ];

        return workspaceItems;
    }, [user, hasWorkspaceAccess, workspaceBasePath, isAdminWorkspaceRole, businessMode, createLeadHref]);

    const isLight = tone === 'light' || (tone !== 'dark' && (mounted ? theme !== 'dark' : true));
    const isDarkSurface = !isLight;
    const triggerClass = isDarkSurface
        ? 'bg-transparent border-white/40 text-white hover:text-white hover:border-white/70'
        : 'border-slate-900/10 text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10 shadow-sm';

    const displayName = user ? memberProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User' : 'Guest';

    /** Animation Variants borrowed from LoginSidebar */
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    const sidebarVariants: Variants = {
        hidden: { x: '100%', opacity: 0, scale: 0.95 },
        visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.8,
            },
        },
        exit: {
            x: '100%',
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2, ease: 'easeIn' },
        },
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delayChildren: 0.1,
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
    };

    return (
        <>
            {mounted &&
                (user ? (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        ref={dropdownRef}
                        className={`flex ${compactTrigger ? 'h-9' : 'h-11'} w-auto pl-1 ${compactTrigger ? 'pr-3' : 'pr-4'} rounded-full border transition-all duration-300 relative flex-shrink-0 items-center ${compactTrigger ? 'gap-2' : 'gap-3'} group z-[101] ${triggerClass} ${hideTrigger ? 'hidden' : ''}`}
                    >
                        <div
                            className={`${compactTrigger ? 'w-8 h-8' : 'w-8 h-8'} rounded-full overflow-hidden flex items-center justify-center text-slate-900 dark:text-white font-black text-xs transition-all ring-1 ring-white/10 shadow-inner`}
                        >
                            <img
                                src={memberProfile?.avatar_url || getDefaultAvatar(user.id, displayName)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-[11px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">
                                HI,
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap max-w-[150px] truncate">
                                {displayName}
                            </span>
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className={`flex ${compactTrigger ? 'w-9 h-9' : 'w-10 h-10'} rounded-full border items-center justify-center transition-all duration-300 group ${triggerClass}`}
                        title="Sign In"
                    >
                        <LucideUser size={compactTrigger ? 18 : 20} />
                    </button>
                ))}

            {/* Full Screen Sidebar Portal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <div className="fixed inset-0 z-[100] flex justify-end items-center overflow-hidden sm:p-4 font-sans">
                                {/* Backdrop */}
                                <motion.div
                                    variants={overlayVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    onClick={() => setIsOpen(false)}
                                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                                />

                                {/* Sidebar */}
                                <motion.div
                                    variants={sidebarVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="relative w-full sm:w-[480px] h-full sm:h-[96vh] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden sm:rounded-[2.5rem] ml-auto"
                                >
                                    {/* Decorative Glows */}
                                    <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#F4B000]/10 rounded-full blur-[100px] pointer-events-none" />

                                    {/* Header - Reduced Padding */}
                                    <div className="flex-none px-6 py-5 flex items-center justify-between z-10 shrink-0">
                                        <div className="h-8 shrink-0">
                                            <Logo
                                                mode="auto"
                                                size={32}
                                                variant="full"
                                                customColors={{
                                                    bike: '#F4B000',
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-500 dark:text-slate-400"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Content - Condensed Spacing */}
                                    <div className="flex-1 overflow-y-auto px-6 z-10 flex flex-col min-h-0 custom-scrollbar pb-2">
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-4"
                                        >
                                            {/* USER/GUEST CARD */}
                                            {user ? (
                                                <motion.div
                                                    variants={itemVariants}
                                                    className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group"
                                                >
                                                    <div className="absolute top-0 right-0 p-4 opacity-30">
                                                        <div className="w-24 h-24 bg-brand-primary/20 rounded-full blur-2xl absolute -top-5 -right-5 pointer-events-none" />
                                                    </div>

                                                    {/* Smaller Avatar */}
                                                    <div className="relative shrink-0 group/avatar">
                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-[#F4B000] flex items-center justify-center text-black text-xl font-black shadow-lg shadow-brand-primary/20 overflow-hidden relative z-10 ring-2 ring-white dark:ring-[#0F172A]">
                                                            <img
                                                                src={
                                                                    memberProfile?.avatar_url ||
                                                                    getDefaultAvatar(
                                                                        user.id,
                                                                        memberProfile?.full_name || user.email
                                                                    )
                                                                }
                                                                alt={memberProfile?.full_name || 'Profile'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="absolute bottom-0 right-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20 border-2 border-white dark:border-[#0F172A]"
                                                            title="Change Photo"
                                                        >
                                                            {uploading ? (
                                                                <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <Camera size={10} />
                                                            )}
                                                        </button>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleAvatarUpload}
                                                        />
                                                    </div>

                                                    <div className="relative z-10 min-w-0 flex-1">
                                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight truncate">
                                                            {memberProfile?.full_name || 'BookMyBike User'}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 tracking-wide uppercase truncate">
                                                            {user.email}
                                                        </p>
                                                        {location && (
                                                            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-blue-500/10 text-[9px] font-black uppercase tracking-[0.05em] text-blue-600 dark:text-blue-400">
                                                                <MapPin size={10} className="fill-blue-500/20" />
                                                                {location.district || location.taluka}{' '}
                                                                {location.stateCode
                                                                    ? `(${location.stateCode})`
                                                                    : location.state
                                                                      ? `(${location.state})`
                                                                      : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    variants={itemVariants}
                                                    className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col items-center gap-4 text-center relative overflow-hidden group shadow-sm"
                                                >
                                                    <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-brand-primary/20 rounded-full blur-[40px] pointer-events-none" />
                                                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-brand-primary">
                                                        <LucideUser size={32} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                                            Welcome to BookMyBike
                                                        </h3>
                                                        <p className="text-xs text-slate-500 font-medium px-4">
                                                            Sign in to manage your bookings, wishlist, and exclusive
                                                            offers.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            onLoginClick();
                                                        }}
                                                        className="w-full mt-2 py-4 rounded-2xl bg-brand-primary text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20"
                                                    >
                                                        Sign In Now
                                                    </button>
                                                </motion.div>
                                            )}

                                            {/* O' CIRCLE MEMBERSHIP CARD — Reusable SOT */}
                                            {user && (
                                                <motion.div variants={itemVariants} className="mt-2">
                                                    <OCircleMembershipCard
                                                        memberName={memberProfile?.full_name || 'MEMBER'}
                                                        memberCode={memberCode}
                                                        wallet={walletData}
                                                        sizePreset="sidebar"
                                                    />
                                                </motion.div>
                                            )}
                                            {/* Share & Earn — compact badge */}
                                            {user && referralCode && (
                                                <motion.div
                                                    variants={itemVariants}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-amber-200/70 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5"
                                                >
                                                    {/* Label */}
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                                            <Share2
                                                                size={12}
                                                                className="text-amber-600 dark:text-amber-400"
                                                            />
                                                        </div>
                                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                                            Share & Earn
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                                                        {/* Native device WhatsApp share — opens user's WA app */}
                                                        {socialShareLinks.map(item => (
                                                            <a
                                                                key={item.key}
                                                                href={item.href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={item.label}
                                                                className="w-7 h-7 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.04] transition-all flex items-center justify-center hover:scale-110 hover:shadow-sm"
                                                            >
                                                                {BrandIcons[item.brandIcon as keyof typeof BrandIcons]}
                                                            </a>
                                                        ))}
                                                        {/* Copy */}
                                                        <button
                                                            type="button"
                                                            onClick={handleCopyReferralUrl}
                                                            title="Copy referral link"
                                                            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                                                                referralCopied
                                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                                    : 'border-amber-200/80 dark:border-amber-500/20 bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400'
                                                            }`}
                                                        >
                                                            {referralCopied ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Simplified Unified Navigation — only for logged-in users */}
                                            {user && (
                                                <div className="space-y-6 pt-2">
                                                    {/* O'Circle / Business Mode Toggle */}
                                                    {hasWorkspaceAccess && (
                                                        <div className="flex items-center gap-0 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                                                            <button
                                                                onClick={() => {
                                                                    if (!businessMode) toggleMode();
                                                                }}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                                                                    businessMode
                                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                                                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                                                                }`}
                                                            >
                                                                <Building2 size={12} />
                                                                The Crew
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (businessMode) toggleMode();
                                                                }}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                                                                    !businessMode
                                                                        ? 'bg-brand-primary text-black shadow-md shadow-brand-primary/20'
                                                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                                                                }`}
                                                            >
                                                                <Logo variant="icon" size={12} />
                                                                O&apos; Circle
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Account & Profile Section — O'Circle mode only */}
                                                    {(!businessMode || !hasWorkspaceAccess) && (
                                                        <>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1.5">
                                                                    {accountMenuItems.map(item => (
                                                                        <a
                                                                            key={item.label}
                                                                            href={item.href}
                                                                            onClick={() => setIsOpen(false)}
                                                                            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all group"
                                                                        >
                                                                            <div
                                                                                className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm shrink-0`}
                                                                            >
                                                                                <item.icon size={16} />
                                                                            </div>
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                                                {item.label}
                                                                            </span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* Workspaces Section — only in Business mode */}
                                                    {businessMode &&
                                                        sortedMemberships.length > 0 &&
                                                        (() => {
                                                            // Compute inactive dealers and financers
                                                            const inactiveDealers = (
                                                                isFinanceTeamOnly
                                                                    ? mappedDealerTenants
                                                                    : dealerMemberships
                                                                          .map(m => m.tenants)
                                                                          .filter(Boolean)
                                                                          .map((t: any) => ({
                                                                              id: t.id,
                                                                              name: t.name,
                                                                              slug: t.slug || null,
                                                                          }))
                                                            ).filter((d: any) => d.id !== activeTenantId);

                                                            const inactiveFinancers = !isFinanceTeamOnly
                                                                ? availableFinanceOptions.filter(
                                                                      f => f.id !== effectiveActiveFinanceId
                                                                  )
                                                                : [];

                                                            // Active dealership name
                                                            const activeDealerName =
                                                                sortedMemberships.find(
                                                                    m => m.tenant_id === activeTenantId
                                                                )?.tenants?.name ||
                                                                mappedDealerTenants.find(d => d.id === activeTenantId)
                                                                    ?.name ||
                                                                null;
                                                            const activeDealerSlug =
                                                                sortedMemberships.find(
                                                                    m => m.tenant_id === activeTenantId
                                                                )?.tenants?.slug || null;
                                                            // Active financer name
                                                            const activeFinancerName =
                                                                sortedMemberships.find(
                                                                    m => m.tenant_id === effectiveActiveFinanceId
                                                                )?.tenants?.name ||
                                                                dealerLinkedFinancers.find(
                                                                    f => f.id === effectiveActiveFinanceId
                                                                )?.name ||
                                                                availableFinanceOptions.find(
                                                                    f => f.id === effectiveActiveFinanceId
                                                                )?.name ||
                                                                null;
                                                            const activeFinancerSlug =
                                                                sortedMemberships.find(
                                                                    m => m.tenant_id === effectiveActiveFinanceId
                                                                )?.tenants?.slug ||
                                                                availableFinanceOptions.find(
                                                                    f => f.id === effectiveActiveFinanceId
                                                                )?.slug ||
                                                                null;

                                                            return (
                                                                <div className="space-y-2">
                                                                    {/* ─── ACTIVE GROUP ─── */}
                                                                    <div className="rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden">
                                                                        {/* Group Header */}
                                                                        <div className="px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
                                                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                                                Active
                                                                            </p>
                                                                        </div>

                                                                        {/* AUMS Console */}
                                                                        {adminMemberships.length > 0 && (
                                                                            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-white/5 bg-amber-50/60 dark:bg-amber-500/5">
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">
                                                                                        AUMS Console
                                                                                    </p>
                                                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">
                                                                                        {adminMemberships[0]?.tenants
                                                                                            ?.name || 'AUMS'}
                                                                                    </p>
                                                                                </div>
                                                                                <a
                                                                                    href={getWorkspaceDashboardHref(
                                                                                        adminMemberships[0]?.tenants
                                                                                            ?.slug
                                                                                    )}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    onClick={() => setIsOpen(false)}
                                                                                    className="ml-2 shrink-0 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider hover:bg-amber-600 transition-colors"
                                                                                >
                                                                                    Open
                                                                                </a>
                                                                            </div>
                                                                        )}

                                                                        {/* Dealership CRMs — collapsible */}
                                                                        <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 overflow-hidden">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setDealerCrmOpen(v => !v)
                                                                                }
                                                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <Store
                                                                                        size={12}
                                                                                        className="text-emerald-500 dark:text-emerald-400"
                                                                                    />
                                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                                                                                        Dealership CRMs{' '}
                                                                                        <span className="opacity-60">
                                                                                            ({dealerMemberships.length})
                                                                                        </span>
                                                                                    </p>
                                                                                </div>
                                                                                <ChevronDown
                                                                                    size={13}
                                                                                    className={`text-emerald-400 transition-transform duration-200 ${dealerCrmOpen ? 'rotate-180' : ''}`}
                                                                                />
                                                                            </button>
                                                                            <AnimatePresence initial={false}>
                                                                                {dealerCrmOpen && (
                                                                                    <motion.div
                                                                                        key="dealer-crm-list"
                                                                                        initial={{
                                                                                            height: 0,
                                                                                            opacity: 0,
                                                                                        }}
                                                                                        animate={{
                                                                                            height: 'auto',
                                                                                            opacity: 1,
                                                                                        }}
                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                        transition={{ duration: 0.2 }}
                                                                                        className="overflow-hidden"
                                                                                    >
                                                                                        <div className="px-2 pb-2 space-y-1 max-h-60 overflow-y-auto">
                                                                                            {dealerMemberships.length >
                                                                                            0 ? (
                                                                                                dealerMemberships.map(
                                                                                                    m => {
                                                                                                        const slug =
                                                                                                            m.tenants
                                                                                                                ?.slug ||
                                                                                                            null;
                                                                                                        const name =
                                                                                                            m.tenants
                                                                                                                ?.name ||
                                                                                                            'Dealership';
                                                                                                        return slug ? (
                                                                                                            <a
                                                                                                                key={String(
                                                                                                                    m.tenant_id
                                                                                                                )}
                                                                                                                href={getWorkspaceDashboardHref(
                                                                                                                    slug
                                                                                                                )}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                onClick={() =>
                                                                                                                    setIsOpen(
                                                                                                                        false
                                                                                                                    )
                                                                                                                }
                                                                                                                className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-white/80 dark:bg-white/[0.03] px-2.5 py-2 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all group"
                                                                                                            >
                                                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                                                    <Store
                                                                                                                        size={
                                                                                                                            13
                                                                                                                        }
                                                                                                                        className="text-emerald-600 dark:text-emerald-400 shrink-0"
                                                                                                                    />
                                                                                                                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                                                                        {
                                                                                                                            name
                                                                                                                        }
                                                                                                                    </p>
                                                                                                                </div>
                                                                                                                <ExternalLink
                                                                                                                    size={
                                                                                                                        12
                                                                                                                    }
                                                                                                                    className="text-emerald-400 shrink-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors"
                                                                                                                />
                                                                                                            </a>
                                                                                                        ) : (
                                                                                                            <div
                                                                                                                key={String(
                                                                                                                    m.tenant_id
                                                                                                                )}
                                                                                                                title="No CRM linked"
                                                                                                                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 dark:border-white/5 px-2.5 py-2 opacity-50 cursor-not-allowed"
                                                                                                            >
                                                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                                                    <Store
                                                                                                                        size={
                                                                                                                            13
                                                                                                                        }
                                                                                                                        className="text-slate-400 shrink-0"
                                                                                                                    />
                                                                                                                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                                                                                                                        {
                                                                                                                            name
                                                                                                                        }
                                                                                                                    </p>
                                                                                                                </div>
                                                                                                                <ExternalLink
                                                                                                                    size={
                                                                                                                        12
                                                                                                                    }
                                                                                                                    className="text-slate-300 dark:text-white/20 shrink-0"
                                                                                                                />
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                )
                                                                                            ) : (
                                                                                                <div className="px-2.5 py-2 text-[11px] font-semibold text-slate-400">
                                                                                                    No dealer
                                                                                                    memberships
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>

                                                                        {/* Financer CRMs — collapsible */}
                                                                        <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-500/5 overflow-hidden">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setFinancerCrmOpen(v => !v)
                                                                                }
                                                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <Landmark
                                                                                        size={12}
                                                                                        className="text-indigo-500 dark:text-indigo-400"
                                                                                    />
                                                                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                                                                        Financer CRMs{' '}
                                                                                        <span className="opacity-60">
                                                                                            ({financeMemberships.length}
                                                                                            )
                                                                                        </span>
                                                                                    </p>
                                                                                </div>
                                                                                <ChevronDown
                                                                                    size={13}
                                                                                    className={`text-indigo-400 transition-transform duration-200 ${financerCrmOpen ? 'rotate-180' : ''}`}
                                                                                />
                                                                            </button>
                                                                            <AnimatePresence initial={false}>
                                                                                {financerCrmOpen && (
                                                                                    <motion.div
                                                                                        key="financer-crm-list"
                                                                                        initial={{
                                                                                            height: 0,
                                                                                            opacity: 0,
                                                                                        }}
                                                                                        animate={{
                                                                                            height: 'auto',
                                                                                            opacity: 1,
                                                                                        }}
                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                        transition={{ duration: 0.2 }}
                                                                                        className="overflow-hidden"
                                                                                    >
                                                                                        <div className="px-2 pb-2 space-y-1 max-h-60 overflow-y-auto">
                                                                                            {financeMemberships.length >
                                                                                            0 ? (
                                                                                                financeMemberships.map(
                                                                                                    m => {
                                                                                                        const slug =
                                                                                                            m.tenants
                                                                                                                ?.slug ||
                                                                                                            null;
                                                                                                        const name =
                                                                                                            m.tenants
                                                                                                                ?.name ||
                                                                                                            'Financer';
                                                                                                        return slug ? (
                                                                                                            <a
                                                                                                                key={String(
                                                                                                                    m.tenant_id
                                                                                                                )}
                                                                                                                href={getWorkspaceDashboardHref(
                                                                                                                    slug
                                                                                                                )}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                onClick={() =>
                                                                                                                    setIsOpen(
                                                                                                                        false
                                                                                                                    )
                                                                                                                }
                                                                                                                className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200/60 dark:border-indigo-500/20 bg-white/80 dark:bg-white/[0.03] px-2.5 py-2 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all group"
                                                                                                            >
                                                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                                                    <Landmark
                                                                                                                        size={
                                                                                                                            13
                                                                                                                        }
                                                                                                                        className="text-indigo-600 dark:text-indigo-400 shrink-0"
                                                                                                                    />
                                                                                                                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                                                                        {
                                                                                                                            name
                                                                                                                        }
                                                                                                                    </p>
                                                                                                                </div>
                                                                                                                <ExternalLink
                                                                                                                    size={
                                                                                                                        12
                                                                                                                    }
                                                                                                                    className="text-indigo-400 shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"
                                                                                                                />
                                                                                                            </a>
                                                                                                        ) : (
                                                                                                            <div
                                                                                                                key={String(
                                                                                                                    m.tenant_id
                                                                                                                )}
                                                                                                                title="No CRM linked"
                                                                                                                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 dark:border-white/5 px-2.5 py-2 opacity-50 cursor-not-allowed"
                                                                                                            >
                                                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                                                    <Landmark
                                                                                                                        size={
                                                                                                                            13
                                                                                                                        }
                                                                                                                        className="text-slate-400 shrink-0"
                                                                                                                    />
                                                                                                                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                                                                                                                        {
                                                                                                                            name
                                                                                                                        }
                                                                                                                    </p>
                                                                                                                </div>
                                                                                                                <ExternalLink
                                                                                                                    size={
                                                                                                                        12
                                                                                                                    }
                                                                                                                    className="text-slate-300 dark:text-white/20 shrink-0"
                                                                                                                />
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                )
                                                                                            ) : (
                                                                                                <div className="px-2.5 py-2 text-[11px] font-semibold text-slate-400">
                                                                                                    No financer
                                                                                                    memberships
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Compact Footer */}
                                    <div className="flex-none p-5 z-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0F172A]/50">
                                        {/* WA Quick Welcome Panel */}
                                        <AnimatePresence initial={false}>
                                            {waOpen && (
                                                <motion.div
                                                    key="wa-panel"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden mb-3"
                                                >
                                                    <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 dark:bg-[#25D366]/[0.04] p-3 space-y-3">
                                                        {/* Title */}
                                                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#25D366]">
                                                            Quick Welcome
                                                        </p>
                                                        {waStatus === 'done' ? (
                                                            <div className="flex items-center justify-center gap-2 py-3">
                                                                <Check size={16} className="text-[#25D366]" />
                                                                <span className="text-[10px] font-black text-[#25D366] uppercase tracking-wide">
                                                                    Sent!
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3 py-2 focus-within:border-[#25D366] transition-all">
                                                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                                                        +91
                                                                    </span>
                                                                    <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10" />
                                                                    <input
                                                                        type="tel"
                                                                        inputMode="numeric"
                                                                        maxLength={10}
                                                                        value={waPhone.replace(/\D/g, '').slice(-10)}
                                                                        onChange={e => {
                                                                            setWaPhone(e.target.value);
                                                                            setWaError('');
                                                                        }}
                                                                        onKeyDown={e =>
                                                                            e.key === 'Enter' && sendWelcomeWa()
                                                                        }
                                                                        placeholder="Recipient 10-digit number"
                                                                        className="flex-1 bg-transparent text-[11px] font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-1.5">
                                                                    {(['en_GB', 'hi', 'mr'] as const).map(lang => {
                                                                        const labels: Record<string, string> = {
                                                                            en_GB: 'EN',
                                                                            hi: 'हि',
                                                                            mr: 'मर',
                                                                        };
                                                                        const full: Record<string, string> = {
                                                                            en_GB: 'English',
                                                                            hi: 'Hindi',
                                                                            mr: 'Marathi',
                                                                        };
                                                                        return (
                                                                            <button
                                                                                key={lang}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setWaLang(lang);
                                                                                    setWaError('');
                                                                                }}
                                                                                className={`flex-1 flex flex-col items-center py-1.5 rounded-xl border transition-all ${
                                                                                    waLang === lang
                                                                                        ? 'border-[#25D366] bg-[#25D366]/10 ring-1 ring-[#25D366]/30'
                                                                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-[#25D366]/40'
                                                                                }`}
                                                                            >
                                                                                <span
                                                                                    className={`text-[12px] font-black ${waLang === lang ? 'text-[#25D366]' : 'text-slate-500 dark:text-slate-400'}`}
                                                                                >
                                                                                    {labels[lang]}
                                                                                </span>
                                                                                <span
                                                                                    className={`text-[7px] font-semibold ${waLang === lang ? 'text-[#25D366]' : 'text-slate-400'}`}
                                                                                >
                                                                                    {full[lang]}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {waError && (
                                                                    <p className="text-[8px] text-rose-500 font-semibold">
                                                                        {waError}
                                                                    </p>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={sendWelcomeWa}
                                                                    disabled={waStatus === 'sending'}
                                                                    className={`w-full h-8 rounded-xl flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-all ${waStatus === 'sending' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#25D366] text-white hover:bg-[#22c55e]'}`}
                                                                >
                                                                    <Send size={11} />
                                                                    {waStatus === 'sending'
                                                                        ? 'Sending…'
                                                                        : 'Send Welcome'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href="/help"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 border border-slate-200 dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-white/[0.03] hover:shadow-md"
                                            >
                                                <HelpCircle size={14} />
                                                Help
                                            </a>
                                            {/* WA Quick Welcome Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => setWaOpen(o => !o)}
                                                title="Send Quick Welcome"
                                                className={`flex items-center justify-center w-10 h-10 rounded-2xl border transition-all flex-shrink-0 ${
                                                    waOpen
                                                        ? 'border-[#25D366] bg-[#25D366]/10 text-[#25D366]'
                                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-400 hover:border-[#25D366]/40 hover:text-[#25D366]'
                                                }`}
                                            >
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                    <path d="M12 0C5.374 0 0 5.374 0 12c0 2.13.558 4.122 1.528 5.847L0 24l6.336-1.524A11.939 11.939 0 0012 24c6.626 0 12-5.374 12-12 0-6.627-5.374-12-12-12zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.724.896.939-3.619-.234-.372A9.817 9.817 0 012.182 12C2.182 6.585 6.585 2.182 12 2.182c5.415 0 9.818 4.403 9.818 9.818 0 5.416-4.403 9.818-9.818 9.818zM9 7h3.5c1.38 0 2.5 1.175 2.5 2.625 0 .98-.527 1.82-1.307 2.25C14.611 12.3 15.5 13.35 15.5 14.625c0 1.6-1.232 2.875-2.875 2.875H9V7zm1.5 1.5v2.25h1.875c.62 0 1.125-.56 1.125-1.125C13.5 9.06 12.995 8.5 12.375 8.5H10.5zm0 3.75V14.5h2c.69 0 1.25-.56 1.25-1.25 0-.69-.56-1-1.25-1H10.5z" />
                                                </svg>
                                            </button>
                                            {user && (
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5"
                                                >
                                                    <LogOut size={14} />
                                                    Sign Out
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex justify-center gap-5 mt-4">
                                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                                <a
                                                    key={i}
                                                    href="#"
                                                    className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all hover:scale-110"
                                                >
                                                    <Icon size={14} />
                                                </a>
                                            ))}
                                        </div>
                                        <div className="text-center mt-3">
                                            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                                BookMyBike v2.4.0
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
