import Script from 'next/script';

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;

export default function AnalyticsScripts() {
    if (!gtmId && !clarityId && !ga4Id) return null;

    return (
        <>
            {/* Google Analytics 4 — afterInteractive: needed for conversion tracking on first touch */}
            {ga4Id ? (
                <>
                    <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
                    <Script id="ga4-config" strategy="afterInteractive">
                        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ga4Id}');`}
                    </Script>
                </>
            ) : null}

            {/*
             * Google Tag Manager — lazyOnload: GTM is a tag container that loads many
             * sub-scripts. Deferring it to idle avoids main-thread blocking during the
             * critical interaction window that INP measures.
             */}
            {gtmId ? (
                <>
                    <Script id="gtm-script" strategy="lazyOnload">
                        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
                    </Script>
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                            title="gtm"
                        />
                    </noscript>
                </>
            ) : null}

            {/*
             * Microsoft Clarity — lazyOnload: Heatmap/session recording, not time-sensitive.
             * Running it on idle avoids the 50–100 ms main-thread task during first user
             * interactions which is the primary INP measurement window.
             */}
            {clarityId ? (
                <Script id="clarity-script" strategy="lazyOnload">
                    {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
                </Script>
            ) : null}
        </>
    );
}
