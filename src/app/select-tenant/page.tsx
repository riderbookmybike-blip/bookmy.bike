'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Mock Tenants
const MOCK_TENANTS = [
    { id: 't1', name: 'AutoWorld Bangalore', city: 'Bangalore', role: 'Admin', status: 'Active' },
    { id: 't2', name: 'BikeZone Mumbai', city: 'Mumbai', role: 'Manager', status: 'Trial' },
    { id: 't3', name: 'SpeedyMotors Delhi', city: 'Delhi', role: 'Staff', status: 'Suspended' },
];

export default function SelectTenantPage() {
    const router = useRouter();

    const handleSelect = (tenantSlug: string) => {
        // Path-based: redirect to /app/{slug}/dashboard

        router.push(`/app/${tenantSlug}/dashboard`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Select Tenant
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Choose the organization you want to access
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {MOCK_TENANTS.map((tenant) => (
                            <li key={tenant.id}>
                                <button
                                    onClick={() => handleSelect(tenant.id)}
                                    className="block w-full text-left hover:bg-gray-50 transition duration-150 ease-in-out focus:outline-none"
                                    disabled={tenant.status === 'Suspended'}
                                >
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-blue-600 truncate">{tenant.name}</p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                    tenant.status === 'Trial' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tenant.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    {tenant.role}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>
                                                    {tenant.city}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
