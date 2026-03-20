export {};

declare global {
    interface Window {
        /** Microsoft Clarity tracking API */
        clarity?: (...args: unknown[]) => void;

        sendOtp: (identifier: string, success?: (data: any) => void, failure?: (error: any) => void) => void;
        retryOtp: (channel: string | null, success?: (data: any) => void, failure?: (error: any) => void) => void;
        verifyOtp: (otp: string, success?: (data: any) => void, failure?: (error: any) => void) => void;
        getWidgetData: () => any;
        isCaptchaVerified: () => boolean;
        isMsg91Ready?: boolean;
        initSendOTP: (config: any) => void;
        configuration: any;
    }
}
