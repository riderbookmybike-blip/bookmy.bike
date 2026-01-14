'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyInviteToken } from '@/app/actions/invitations';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, ShieldCheck, ArrowRight, XCircle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

function InviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'LOADING' | 'VALID' | 'INVALID' | 'JOINING' | 'SUCCESS'>('LOADING');
    const [inviteData, setInviteData] = useState<any>(null);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'VERIFY_TOKEN' | 'PHONE' | 'OTP'>('VERIFY_TOKEN');
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            checkToken(token);
        } else {
            setStatus('INVALID');
            setError('Missing invitation token.');
        }
    }, [token]);

    const checkToken = async (t: string) => {
        const data = await verifyInviteToken(t);
        if (data) {
            setInviteData(data);
            setStatus('VALID');
            setStep('PHONE');
        } else {
            setStatus('INVALID');
            setError('This invitation has expired or is invalid.');
        }
    };

    const handleJoin = async () => {
        setStatus('JOINING');
        // 1. Verify OTP & Authenticate User
        const supabase = createClient();

        // Mock OTP Check logic (reusing implementation from Login Page for now)
        if (otp !== '6424' && otp !== '1234') {
            setStatus('VALID'); // Reset
            setError('Invalid PIN.');
            return;
        }

        // 2. Call Server Action to Accept Invite
        try {
            const { acceptInvite } = await import('@/app/actions/invitations');

            // WE NEED A USER ID.
            // Ideally we should have logged them in via Supabase first using OTP.
            // For this MVP, let's assume the OTP check *is* the login.

            // Step A: Login/Signup User via Supabase Auth
            // We can use signInWithOtp (if enabled) or a custom flow.
            // Since we mocked login before, we hit a wall here: we need a REAL user.id to insert membership.

            // WORKAROUND FOR MVP: 
            // We will check if user matches `invite.email` (assuming email==phone logic for now? No, DB invite has email).
            // Let's assume the user enters the EMAIL they were invited with, or we just trust the token?

            // CRITICAL: The Invite System requires a REAL User ID.
            // If we don't have real Auth, we can't create a real Membership linked to a User.

            // Temporary Solution: 
            // Show Alert: "Invite Accepted! Please Log In normally now."
            // And we manually call acceptInvite with a stub user ID? No that breaks constraints.

            // Actual Plan:
            // 1. Just Ask User to Login/Signup.
            // 2. Once Logged In, we attach the invite.

            // Let's change flow:
            // "Please Login to Accept" -> Redirect to /login?next=/invite?token=...

            // SIMPLIFICATION:
            // Path-based: /invite stays on the main domain.
        } catch (err) {
            console.error(err);
        }
    };

    // REFINED LOGIC:
    // 1. Validate Token. Show "You are invited to join [Tenant]".
    // 2. Button "Login to Accept" or "Register to Accept".
    // 3. User clicks -> Goes to /login?next=/invite?token=...
    // 4. User logs in.
    // 5. Back at /invite (authenticated).
    // 6. We auto-accept and redirect to Dashboard.

    // Let's implement the "Auto-Accept if Logged In" flow.

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
    }, []);

    const handleAccept = async () => {
        if (!currentUser) {
            // Redirect to Login
            const returnUrl = encodeURIComponent(`/invite?token=${token}`);
            router.push(`/login?next=${returnUrl}`);
            return;
        }

        setStatus('JOINING');
        try {
            const { acceptInvite } = await import('@/app/actions/invitations');
            const result = await acceptInvite(token!, currentUser.id);

            if (result.success) {
                setStatus('SUCCESS');
                const slug = inviteData?.tenants?.slug;
                const destination = slug ? `/app/${slug}/dashboard` : '/dashboard';
                setTimeout(() => router.push(destination), 1500);
            } else {
                setStatus('INVALID');
                setError(result.message || 'Failed to accept.');
            }
        } catch (e) {
            setError('Error processing acceptance.');
        }
    };

    if (status === 'LOADING') {
        return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin w-6 h-6 border-2 border-indigo-600 rounded-full border-t-transparent"></div></div>;
    }

    if (status === 'INVALID') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
                    <XCircle className="mx-auto text-red-500" size={48} />
                    <h2 className="text-xl font-bold text-slate-900">Invalid Invitation</h2>
                    <p className="text-slate-500">{error}</p>
                    <button onClick={() => router.push('/')} className="text-indigo-600 font-bold hover:underline">Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans">
            <div className="mb-8"><Logo mode="auto" /></div>

            <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-2xl shadow-indigo-500/10 max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                    <ShieldCheck size={32} />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">You've been invited!</h1>
                    <p className="text-slate-500 text-lg">
                        Join <strong className="text-slate-900">{inviteData?.tenants?.name}</strong> as <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-sm font-bold align-middle">{inviteData?.role}</span>
                    </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-left flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                        {inviteData?.tenants?.name?.charAt(0)}
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</div>
                        <div className="font-bold text-slate-900">{inviteData?.tenants?.name}</div>
                    </div>
                </div>

                {status === 'SUCCESS' ? (
                    <div className="flex flex-col items-center gap-4 text-emerald-600 font-bold animate-in fade-in">
                        <CheckCircle2 size={32} />
                        <p>Invitation Accepted! Redirecting...</p>
                    </div>
                ) : (
                    <button
                        onClick={handleAccept}
                        disabled={status === 'JOINING'}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'JOINING' ? 'Joining...' : currentUser ? 'Accept & Join Team' : 'Log In to Accept'}
                        {!status.includes('JOIN') && <ArrowRight size={20} />}
                    </button>
                )}

                {!currentUser && (
                    <p className="text-xs text-slate-400">
                        You will be asked to verify your phone number to proceed.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <InviteContent />
        </Suspense>
    );
}
