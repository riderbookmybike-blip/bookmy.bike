/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo } from 'react';
import { HelpCircle, Clock, CheckCircle2, SlidersHorizontal, Edit2 } from 'lucide-react';
import { formatDisplayIdForUI, unformatDisplayId } from '@/lib/displayId';
import { formatInterestRate } from '@/utils/formatVehicleSpec';

const FALLBACK_TENURES: number[] = [12, 24, 36, 48, 60];

interface FinanceCardProps {
    emi: number;
    emiTenure: number;
    setEmiTenure?: (tenure: number) => void;
    downPayment: number;
    setUserDownPayment?: (amount: number) => void; // Added setter
    minDownPayment?: number; // Added min
    maxDownPayment?: number; // Added max
    totalOnRoad: number;
    loanAmount: number;
    annualInterest: number;
    interestType?: string;
    schemeId?: string;
    financeCharges?: { id: string; label: string; value: number; helpText?: string }[];
    bank?: any;
    scheme?: any;
    schemeCandidates?: Array<{ bank: any; scheme: any }>;
}

export default function FinanceCard({
    emi,
    emiTenure,
    setEmiTenure,
    downPayment,
    setUserDownPayment,
    minDownPayment = 0,
    maxDownPayment = 0,
    totalOnRoad,
    loanAmount,
    annualInterest,
    interestType = 'REDUCING',
    schemeId,
    financeCharges = [],
    bank,
    scheme,
    schemeCandidates = [],
}: FinanceCardProps) {
    const displayDownPayment = downPayment < 1 ? 0 : downPayment;
    const netLoan = Math.max(0, Math.round(totalOnRoad - displayDownPayment));
    const calcChargeAmt = (c: any, baseLoan: number) => {
        const type = String(c?.type || c?.valueType || 'FIXED').toUpperCase();
        if (type === 'PERCENTAGE') {
            const basisKey = String(c?.calculationBasis || 'ON_ROAD').toUpperCase();
            const basis = basisKey === 'LOAN_AMOUNT' ? baseLoan : totalOnRoad;
            return Math.round(Number(basis || 0) * (Number(c?.value || 0) / 100));
        }
        return c.value || 0;
    };
    const getBankName = (b: any) =>
        String(b?.name || b?.identity?.display_name || b?.identity?.displayName || b?.identity?.name || 'Financier');
    const getBankShortCode = (name: string) => {
        const key = name.toLowerCase();
        const mapped =
            (key.includes('home credit') && 'HCI') ||
            (key.includes('shriram') && 'SFL') ||
            (key.includes('kotak') && 'KPL') ||
            (key.includes('bajaj') && 'BFS') ||
            (key.includes('bandhan') && 'BBL') ||
            ((key.includes('l&t') || key.includes('lt finance')) && 'LTF') ||
            '';
        if (mapped) return mapped;
        const initials = String(name || '')
            .split(/[\s&/-]+/)
            .map(token => token.trim())
            .filter(Boolean)
            .map(token => token.charAt(0).toUpperCase())
            .join('');
        if (initials.length >= 3) return initials.slice(0, 3);
        const compact = String(name || '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase();
        if (compact.length >= 3) return compact.slice(0, 3);
        return 'FIN';
    };

    const activeCandidates: Array<{ bank: any; scheme: any }> =
        Array.isArray(schemeCandidates) && schemeCandidates.length > 0
            ? schemeCandidates
            : bank && scheme
              ? [{ bank, scheme }]
              : [];

    const tenures = useMemo(() => {
        const set = new Set<number>();

        for (const candidate of activeCandidates) {
            const s = candidate?.scheme || {};
            const allowed = Array.isArray(s?.allowedTenures) ? s.allowedTenures.map((t: any) => Number(t)) : [];
            const normalizedAllowed = allowed.filter((t: number) => Number.isFinite(t) && t > 0);

            if (normalizedAllowed.length > 0) {
                normalizedAllowed.forEach((t: number) => set.add(t));
                continue;
            }

            const minT = Number(s?.minTenure || 0);
            const maxT = Number(s?.maxTenure || 0);
            if (Number.isFinite(minT) && Number.isFinite(maxT) && minT > 0 && maxT >= minT) {
                for (let t = minT; t <= maxT; t += 1) set.add(t);
            }
        }

        if (set.size === 0) {
            FALLBACK_TENURES.forEach(t => set.add(t));
        }

        return Array.from(set).sort((a, b) => a - b);
    }, [activeCandidates]);

    type WinnerRow = {
        bankName: string;
        bankShortCode: string;
        emi: number;
        grossLoan: number;
        interest: number;
        total: number;
    };

    const winnerByTenure = useMemo(() => {
        const out = new Map<number, WinnerRow>();

        const evaluateCandidate = (candidate: { bank: any; scheme: any }, tenure: number): WinnerRow | null => {
            const candidateScheme = candidate?.scheme || {};
            const charges: any[] = Array.isArray(candidateScheme?.charges) ? candidateScheme.charges : [];
            const totalUpfront = charges
                .filter(c => String(c?.impact || '').toUpperCase() === 'UPFRONT')
                .reduce((s, c) => s + calcChargeAmt(c, netLoan), 0);
            const totalFunded = charges
                .filter(c => String(c?.impact || '').toUpperCase() === 'FUNDED')
                .reduce((s, c) => s + calcChargeAmt(c, netLoan), 0);
            const grossLoan = Math.max(0, Math.round(netLoan + totalFunded + totalUpfront));
            if (grossLoan <= 0) return null;

            const annualRate = Number(candidateScheme?.interestRate || 0) / 100;
            const iType = String(candidateScheme?.interestType || 'REDUCING').toUpperCase();
            const emiRaw =
                iType === 'FLAT'
                    ? (grossLoan + grossLoan * annualRate * (tenure / 12)) / tenure
                    : (() => {
                          const monthlyRate = annualRate / 12;
                          if (monthlyRate === 0) return grossLoan / tenure;
                          return (
                              (grossLoan * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                              (Math.pow(1 + monthlyRate, tenure) - 1)
                          );
                      })();
            const emi = Math.round(emiRaw);
            const totalPaidViaEmi = emi * tenure;
            const interest = Math.max(0, Math.round(totalPaidViaEmi - grossLoan));
            const total = Math.round(totalPaidViaEmi + displayDownPayment);
            const bankName = getBankName(candidate?.bank);
            return {
                bankName,
                bankShortCode: getBankShortCode(bankName),
                emi,
                grossLoan,
                interest,
                total,
            };
        };

        const isExactTenureSupported = (candidate: { bank: any; scheme: any }, tenure: number) => {
            const s = candidate?.scheme || {};
            const allowedTenures = Array.isArray(s?.allowedTenures) ? s.allowedTenures.map((t: any) => Number(t)) : [];
            if (allowedTenures.length > 0) return allowedTenures.includes(tenure);
            const minT = Number(s?.minTenure || 0);
            const maxT = Number(s?.maxTenure || 0);
            if (Number.isFinite(minT) && Number.isFinite(maxT) && minT > 0 && maxT > 0) {
                return tenure >= minT && tenure <= maxT;
            }
            return true;
        };

        for (const tenure of tenures) {
            let best: WinnerRow | null = null;
            const exactEligible = activeCandidates.filter(c => isExactTenureSupported(c, tenure));
            for (const candidate of exactEligible) {
                const row = evaluateCandidate(candidate, tenure);
                if (!row) continue;
                if (!best || row.emi < best.emi) best = row;
            }
            if (best) out.set(tenure, best);
        }
        return out;
    }, [activeCandidates, displayDownPayment, netLoan, tenures]);

    const selectedWinner = winnerByTenure.get(emiTenure);
    const fallbackBankName = getBankName(bank);
    const fallbackBankShortCode = getBankShortCode(fallbackBankName);
    const selectedAnnualInterest =
        selectedWinner && activeCandidates.length > 0 ? null : formatInterestRate(annualInterest);
    const selectedGrossLoan = selectedWinner?.grossLoan ?? Math.max(0, Math.round(loanAmount || 0));

    const financeItems = [
        { label: 'Down Payment', value: `₹${displayDownPayment.toLocaleString('en-IN')}` },
        ...financeCharges.map(charge => ({
            label: charge.label,
            value: typeof charge.value === 'number' ? `₹${charge.value.toLocaleString('en-IN')}` : charge.value,
            helpText: charge.helpText,
        })),
        { label: 'Loan Amount', value: `₹${selectedGrossLoan.toLocaleString('en-IN')}` },
        {
            label: `Interest (${interestType})`,
            value: selectedAnnualInterest ?? formatInterestRate(annualInterest),
            isHighlight: true,
        },
        {
            label: 'Approval Chance',
            value: downPayment / totalOnRoad > 0.25 ? 'High' : downPayment / totalOnRoad > 0.15 ? 'Medium' : 'Low',
            isHighlight: true,
            colorClass:
                downPayment / totalOnRoad > 0.25
                    ? 'text-emerald-500'
                    : downPayment / totalOnRoad > 0.15
                      ? 'text-brand-primary'
                      : 'text-amber-500',
        },
        { label: 'Scheme', value: schemeId ? formatDisplayIdForUI(unformatDisplayId(schemeId)) : 'STANDARD' },
    ];

    return (
        <div className="md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none rounded-[2.5rem] md:rounded-none overflow-hidden flex flex-col h-full group/fcard relative">
            <div className="w-full flex-1 flex gap-2 lg:gap-3 px-4 md:px-0 pb-4 overflow-x-auto max-w-[800px] mr-auto hide-scrollbar">
                {/* Independent Vertical Cards */}
                {[
                    { key: 'fin', label: 'Fin', align: 'text-center' },
                    { key: 'tenure', label: 'Tenure', align: 'text-center' },
                    { key: 'emi', label: 'EMI', align: 'text-left lg:text-center' },
                    { key: 'loan', label: 'Loan', align: 'text-center' },
                    { key: 'interest', label: 'Interest', align: 'text-center' },
                    { key: 'total', label: 'Total', align: 'text-right lg:text-center' },
                ].map(col => (
                    <div
                        key={col.key}
                        className="flex-1 min-w-[80px] flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-slate-50/80 w-full py-2.5 px-2 border-b border-slate-200 flex items-center justify-center shrink-0 h-[38px]">
                            <span className="text-[8px] font-bold tracking-[0.08em] text-slate-500">{col.label}</span>
                        </div>
                        {/* Vertical Cells */}
                        <div className="flex flex-col flex-1 divide-y divide-slate-100">
                            {tenures.map(t => {
                                const winner = winnerByTenure.get(t);
                                const calculatedEmiForT = winner?.emi ?? 0;
                                const totalInterest = winner?.interest ?? 0;
                                const totalCost = winner?.total ?? 0;
                                const rowGrossLoan = winner?.grossLoan ?? 0;
                                const rowFin = winner?.bankShortCode ?? '--';
                                const rowFinTitle = winner?.bankName ?? 'No eligible financer';
                                const isSelected = emiTenure === t;
                                const isSelectable = Boolean(winner);

                                let valueNode = <></>;

                                if (col.key === 'fin') {
                                    valueNode = (
                                        <span
                                            className={`text-[10px] lg:text-[11px] font-black tracking-[0.06em] ${isSelected ? 'text-brand-primary' : 'text-slate-500'} ${!isSelectable ? 'opacity-40' : ''}`}
                                            title={rowFinTitle}
                                        >
                                            {rowFin}
                                        </span>
                                    );
                                } else if (col.key === 'emi') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-black font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-700'} ${!isSelectable ? 'opacity-40' : ''}`}
                                        >
                                            {isSelectable ? `₹${calculatedEmiForT.toLocaleString('en-IN')}` : '--'}
                                        </span>
                                    );
                                } else if (col.key === 'tenure') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-bold font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-600'}`}
                                        >
                                            {String(t).padStart(2, '0')}mo
                                        </span>
                                    );
                                } else if (col.key === 'loan') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-semibold font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-500'} ${!isSelectable ? 'opacity-40' : ''}`}
                                        >
                                            {isSelectable ? `₹${rowGrossLoan.toLocaleString('en-IN')}` : '--'}
                                        </span>
                                    );
                                } else if (col.key === 'interest') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-semibold font-mono tracking-tight ${totalInterest > 0 ? 'text-red-400/80' : 'text-slate-400'} ${isSelected && 'opacity-90'} ${!isSelectable ? 'opacity-40' : ''}`}
                                        >
                                            {isSelectable
                                                ? `+₹${Math.max(0, totalInterest).toLocaleString('en-IN')}`
                                                : '--'}
                                        </span>
                                    );
                                } else if (col.key === 'total') {
                                    valueNode = (
                                        <span
                                            className={`text-[11px] lg:text-[12px] font-bold font-mono tracking-tight ${isSelected ? 'text-brand-primary' : 'text-slate-600'} ${!isSelectable ? 'opacity-40' : ''}`}
                                        >
                                            {isSelectable ? `₹${totalCost.toLocaleString('en-IN')}` : '--'}
                                        </span>
                                    );
                                }

                                return (
                                    <button
                                        key={`${col.key}-${t}`}
                                        onClick={() => {
                                            if (isSelectable) {
                                                setEmiTenure && setEmiTenure(t);
                                            }
                                        }}
                                        className={`w-full h-10 px-2 flex items-center justify-center transition-all duration-200 relative
                                        ${isSelected ? 'bg-amber-50' : isSelectable ? 'hover:bg-slate-50/60' : 'bg-slate-50/40 cursor-not-allowed'}`}
                                    >
                                        {/* Row sync hover highlight hack */}
                                        <div className="absolute inset-x-0 inset-y-0 opacity-0 group-hover/row:opacity-100 peer-hover:bg-slate-50/60 pointer-events-none" />

                                        {/* Selection Indicator: gold left-bar on first col (Fin), right-bar on Total col */}
                                        {isSelected && col.key === 'fin' && (
                                            <div className="absolute left-0 inset-y-0 w-[4px] bg-amber-400 rounded-r-full" />
                                        )}
                                        {isSelected && col.key === 'total' && (
                                            <div className="absolute right-0 inset-y-0 w-[3px] bg-amber-400/60" />
                                        )}

                                        {valueNode}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
