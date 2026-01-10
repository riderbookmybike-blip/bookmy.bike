'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, Bike, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import Link from 'next/link';

// ... existing code ...

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('redirect_to') || '/dashboard';

    // ... existing states ...
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const supabase = createClient();

            // Construct absolute redirect URL
            const origin = window.location.origin;
            const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: callbackUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
            // Redirect happens automatically
        } catch (err: any) {
            console.error('Google Login Error:', err);
            setIsLoading(false);
            // Show error toast/alert
        }
    };

    // ... render ...
    // Add Google Button above Email Login
}
