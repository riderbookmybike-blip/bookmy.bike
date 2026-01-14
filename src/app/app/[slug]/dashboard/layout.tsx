import ShellLayout from '@/components/layout/ShellLayout';

export default function TenantDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ShellLayout>{children}</ShellLayout>;
}
