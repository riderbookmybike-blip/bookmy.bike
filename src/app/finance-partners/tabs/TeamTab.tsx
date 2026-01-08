import React from 'react';
import { BankTeamMember } from '@/types/bankPartner';
import { User, Phone, Mail } from 'lucide-react';

export default function TeamTab({ team }: { team: BankTeamMember[] }) {
    // Basic hierarchy visualization could be added here later
    return (
        <div className="space-y-4">
            {team.map((member) => (
                <div key={member.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-4 shadow-sm dark:shadow-none">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <User className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">{member.role}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="flex items-center justify-end gap-2">
                            <span className="font-medium">{member.email}</span>
                            <Mail size={14} />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <span className="font-mono">{member.phone}</span>
                            <Phone size={14} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
