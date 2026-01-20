'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getQuotes } from '@/actions/crm';
import { Quote } from '@/components/modules/quotes/QuoteList';
import QuoteList from '@/components/modules/quotes/QuoteList';
import QuoteDetail from '@/components/modules/quotes/QuoteDetail';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function QuotesPage() {
    const { tenantId } = useTenant();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const data = await getQuotes(tenantId);
            setQuotes(data || []);
        } catch (error) {
            console.error('Failed to fetch quotes:', error);
            toast.error('Failed to load quotes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, [tenantId]);

    const handleNewQuote = () => {
        toast.info('Create Quote from Leads module for now');
    };

    return (
        <div className="h-full bg-black flex overflow-hidden font-sans">
            <MasterListDetailLayout mode={selectedQuote ? 'list-detail' : 'list-only'}>
                {/* List Panel */}
                <div className="h-full flex flex-col bg-black/40 backdrop-blur-3xl">
                    <QuoteList
                        quotes={quotes}
                        selectedId={selectedQuote?.id || null}
                        onSelect={setSelectedQuote}
                        onNewQuote={handleNewQuote}
                    />
                </div>

                {/* Detail Panel */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-black">
                    {!selectedQuote ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <FileText className="w-12 h-12 text-white/10 animate-pulse mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">Select_Quote_File</p>
                        </div>
                    ) : (
                        <QuoteDetail
                            quote={selectedQuote}
                            onBack={() => setSelectedQuote(null)}
                        />
                    )}
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
