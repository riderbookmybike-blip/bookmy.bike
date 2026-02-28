import { isHandheldPhoneUserAgent, isTvUserAgent } from '../src/lib/utils/deviceUserAgent';

type UaCase = {
    label: string;
    ua: string;
};

const CASES: UaCase[] = [
    {
        label: 'Android Phone (Chrome)',
        ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    },
    {
        label: 'iPhone Safari',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    },
    {
        label: 'Android TV (Chromecast/Google TV)',
        ua: 'Mozilla/5.0 (Linux; Android 12; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CrKey/1.56.500000',
    },
    {
        label: 'Samsung Smart TV (Tizen)',
        ua: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/7.0 TV Safari/537.36',
    },
    {
        label: 'LG TV (webOS)',
        ua: 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.41 (KHTML, like Gecko) Large Screen Safari/537.41',
    },
    {
        label: 'Desktop Chrome (macOS)',
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    {
        label: 'Samsung TV (SamsungBrowser)',
        ua: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.0 Chrome/120.0.0.0 TV Safari/537.36',
    },
    {
        label: 'Generic TitanOS TV',
        ua: 'Mozilla/5.0 (TitanOS; 1.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
    {
        label: 'Amazon Fire TV (Fling)',
        ua: 'Mozilla/5.0 (Linux; Android 11; AFTSSS) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36 Firebolt/1.0',
    },
];

for (const entry of CASES) {
    const isTv = isTvUserAgent(entry.ua);
    const isPhone = isHandheldPhoneUserAgent(entry.ua);
    const resolvedDevice = isPhone ? 'phone' : 'desktop/tablet';

    console.log(`${entry.label}`);
    console.log(`  isTvUserAgent: ${isTv}`);
    console.log(`  isHandheldPhoneUserAgent: ${isPhone}`);
    console.log(`  resolved: ${resolvedDevice}`);
    console.log('');
}
