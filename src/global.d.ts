export { };

declare global {
    interface Window {
        sendOtp: (
            identifier: string,
            success?: (data: any) => void,
            failure?: (error: any) => void
        ) => void;
        retryOtp: (
            channel: string | null,
            success?: (data: any) => void,
            failure?: (error: any) => void
        ) => void;
        verifyOtp: (
            otp: string,
            success?: (data: any) => void,
            failure?: (error: any) => void
        ) => void;
        getWidgetData: () => any;
        isCaptchaVerified: () => boolean;
        isMsg91Ready?: boolean;
        initSendOTP: (config: any) => void;
        configuration: any;
    }
}
