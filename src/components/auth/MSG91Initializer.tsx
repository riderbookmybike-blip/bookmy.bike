'use client';

import { useEffect } from 'react';

export default function MSG91Initializer() {
    useEffect(() => {
        const initMSG91 = () => {
            if (typeof window === 'undefined') return;

            const configuration = {
                widgetId: "36616b677853323939363231",
                tokenAuth: "477985T3uAd4stn6963525fP1",
                identifier: "mobile",
                exposeMethods: true,
                success: (data: any) => {
                    console.log('[MSG91] Background Init Success:', data);
                    // Dispatch event to notify listeners (like LoginSidebar)
                    window.dispatchEvent(new Event('msg91_app_ready'));
                    (window as any).isMsg91Ready = true;
                },
                failure: (error: any) => {
                    console.error('[MSG91] Background Init Failure:', error);
                }
            };

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
                // The script loads initSendOTP into window
                initMSG91();
            };
            document.body.appendChild(script);
        } else {
            // Already exists, just init if function ready
            if ((window as any).initSendOTP) initMSG91();
        }

    }, []);

    return null; // Headless component
}
