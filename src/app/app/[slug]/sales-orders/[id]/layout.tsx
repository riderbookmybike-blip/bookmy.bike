import React from 'react';

interface SalesOrderLayoutProps {
    children: React.ReactNode;
}

export default function SalesOrderLayout({ children }: SalesOrderLayoutProps) {
    return <>{children}</>;
}
