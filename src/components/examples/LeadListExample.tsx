import { formatDisplayIdForUI } from '@/lib/displayId';
import { DisplayId } from '@/components/ui/DisplayId';

/**
 * Example: Update LeadList component to show Display IDs
 */

export default function LeadList({ leads }: { leads: any[] }) {
    return (
        <div className="space-y-2">
            {leads.map((lead) => (
                <div
                    key={lead.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                >
                    <div className="flex items-start justify-between">
                        {/* Lead Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">
                                    {lead.customer_name}
                                </h3>

                                {/* Display ID Component - NEW! */}
                                <DisplayId
                                    id={lead.display_id}
                                    prefix="LEAD"
                                    className="text-xs"
                                />
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {lead.customer_phone} · {lead.customer_email}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                                        lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-700' :
                                            lead.status === 'QUALIFIED' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {lead.status}
                                </span>

                                {lead.interested_vehicle && (
                                    <span className="text-xs text-gray-500">
                                        🏍️ {lead.interested_vehicle}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                📞
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                ✉️
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
