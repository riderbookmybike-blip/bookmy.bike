import {
    Users,
    FileText,
    CheckCircle,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wallet,
    Package,
    Building2,
    Landmark,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Activity,
    Database,
    AlertTriangle,
    Server,
    LayoutDashboard,
    Settings,
    History,
    FileInput,
    HelpCircle,
    Bell
} from 'lucide-react';

export const ICON_REGISTRY: Record<string, any> = {
    Users,
    FileText,
    CheckCircle,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wallet,
    Package,
    Building2,
    Landmark,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Activity,
    Database,
    AlertTriangle,
    Server,
    LayoutDashboard,
    Settings,
    History,
    FileInput,
    HelpCircle,
    Bell
};

export const getIcon = (name: string) => {
    return ICON_REGISTRY[name] || (() => null);
};
