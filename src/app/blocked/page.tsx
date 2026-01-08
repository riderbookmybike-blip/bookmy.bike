'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function BlockedPage() {
    const router = useRouter();

    const handleLogout = () => {
        // Clear cookies/storage
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        localStorage.clear();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <span className="text-2xl">🚫</span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                    Account Suspended
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Your access to this tenant has been suspended due to policy violations or payment issues.
                </p>
                <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-4">Please contact support for assistance.</p>
                    <button
                        onClick={handleLogout}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
