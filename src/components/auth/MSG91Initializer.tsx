'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function MSG91Initializer() {
    useEffect(() => {
        // Define configuration on window
        const config = {
            widgetId: '356a61726564303832343238',
            tokenAuth: '451395TUHQUl3H696647feP1', // Widget Token (NOT API Key)
            identifier: '', // Optional
            exposeMethods: true,
            success: (data: unknown) => {

            },
            failure: (error: unknown) => {

            },
        };

        // Assign to window
        window.configuration = config;

        // If script already loaded, init immediately
        if (window.initSendOTP) {
            window.initSendOTP(config);
        }
    }, []);

    return (
        <Script
            id="msg91-init"
            strategy="afterInteractive"
            src="https://verify.msg91.com/otp-provider.js"
            onLoad={() => {

                if (window.initSendOTP && window.configuration) {
                    window.initSendOTP(window.configuration);
                }
            }}
        />
    );
}
