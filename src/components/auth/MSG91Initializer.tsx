'use client';

import { useEffect } from 'react';

export default function MSG91Initializer() {
    useEffect(() => {
        const initMSG91 = () => {
            if (typeof window === 'undefined') return;

            const configuration = {
                widgetId: "36616d686f4c313839363933",
                tokenAuth: "477985Az5dYpYUze6965fd67P1",
                identifier: "mobile",
                exposeMethods: true,
                success: (data: any) => {
                    console.log('[MSG91] Success Callback:', data);
                },
                failure: (error: any) => {
                    console.error('[MSG91] Failure Callback:', error);
                }
            };

            const checkMethodsInterval = setInterval(() => {
                if ((window as any).sendOtp && (window as any).verifyOtp) {
                    console.log('[MSG91] Methods Available - App Ready');
                    (window as any).isMsg91Ready = true;
                    window.dispatchEvent(new Event('msg91_app_ready'));
                    clearInterval(checkMethodsInterval);
                }
            }, 100);

            // Timeout to clear interval if it fails
            setTimeout(() => clearInterval(checkMethodsInterval), 10000);

            if ((window as any).initSendOTP) {
                (window as any).initSendOTP(configuration);
            }
        };

        const scriptId = 'msg91-otp-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://verify.msg91.com/otp-provider.js";
            script.defer = true;
            script.onload = () => {
                initMSG91();
            };
            document.body.appendChild(script);
        } else {
            // Already exists
            initMSG91();
        }

    }, []);

    return null; // Headless component
}
