'use client';

import { useEffect, useState } from 'react';

interface ProbeData {
    w: number;
    h: number;
    dpr: number;
    ua: string;
    touch: number;
    orientation: string;
    tvLike: boolean;
    dataTv: string;
    colorDepth: number;
    pixelW: number;
    pixelH: number;
}

export default function TvProbePage() {
    const [data, setData] = useState<ProbeData | null>(null);
    const [serverUa, setServerUa] = useState<string>('loading...');
    const [reloadStatus, setReloadStatus] = useState<'idle' | 'sent' | 'error'>('idle');

    const triggerReload = async () => {
        setReloadStatus('idle');
        try {
            const secret = prompt('Admin secret:');
            if (!secret) return;
            const res = await fetch('/api/tv-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret, action: 'reload' }),
            });
            setReloadStatus(res.ok ? 'sent' : 'error');
            if (res.ok) setTimeout(() => setReloadStatus('idle'), 65_000);
        } catch {
            setReloadStatus('error');
        }
    };

    useEffect(() => {
        // Client-side viewport data
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        const ua = navigator.userAgent;
        const touch = navigator.maxTouchPoints || 0;
        const orientation =
            screen.orientation?.type || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
        const tvLike =
            (w >= 1500 && h <= 1000) || (w >= 900 && w <= 1200 && h >= 500 && h <= 700) || (w === 960 && h === 540);
        const dataTv = document.documentElement.dataset.tv || 'not-set';
        const colorDepth = screen.colorDepth || 0;
        const pixelW = screen.width * dpr;
        const pixelH = screen.height * dpr;

        setData({ w, h, dpr, ua, touch, orientation, tvLike, dataTv, colorDepth, pixelW, pixelH });

        // Also fetch server-side UA
        fetch('/api/tv-probe')
            .then(r => r.json())
            .then(d => setServerUa(d.summary?.userAgent || 'n/a'))
            .catch(() => setServerUa('fetch-error'));
    }, []);

    const Row = ({
        label,
        value,
        highlight,
    }: {
        label: string;
        value: string | number | boolean;
        highlight?: boolean;
    }) => (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                borderBottom: '1px solid #222',
                gap: 24,
            }}
        >
            <span style={{ color: '#888', fontSize: 22, fontWeight: 600, minWidth: 260 }}>{label}</span>
            <span
                style={{
                    color: highlight ? '#ffd700' : '#fff',
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    wordBreak: 'break-all',
                }}
            >
                {String(value)}
            </span>
        </div>
    );

    return (
        <div
            style={{
                background: '#000',
                minHeight: '100vh',
                color: '#fff',
                fontFamily: 'system-ui, sans-serif',
                padding: '40px 60px',
                boxSizing: 'border-box',
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 700, letterSpacing: 4, marginBottom: 8 }}>
                    BOOKMYBIKE — TV PROBE
                </div>
                <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>Device Inspector</div>
                <div style={{ fontSize: 20, color: '#555', marginTop: 8 }}>192.168.0.202:3000/tv</div>
            </div>

            {!data ? (
                <div style={{ fontSize: 36, color: '#555', marginTop: 80, textAlign: 'center' }}>
                    Reading device info...
                </div>
            ) : (
                <>
                    {/* Big status badge */}
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 16,
                            background: data.tvLike ? '#052e16' : '#1e293b',
                            border: `3px solid ${data.tvLike ? '#22c55e' : '#3b82f6'}`,
                            borderRadius: 20,
                            padding: '16px 32px',
                            marginBottom: 40,
                        }}
                    >
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: data.tvLike ? '#22c55e' : '#3b82f6',
                            }}
                        />
                        <span style={{ fontSize: 28, fontWeight: 800 }}>
                            {data.tvLike ? '✅ TV-LIKE VIEWPORT DETECTED' : '🖥️ DESKTOP MODE'}
                        </span>
                    </div>

                    {/* Viewport */}
                    <div
                        style={{
                            background: '#0a0a0a',
                            borderRadius: 16,
                            border: '1px solid #1a1a1a',
                            overflow: 'hidden',
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                padding: '12px 24px',
                                background: '#111',
                                fontSize: 16,
                                color: '#ffd700',
                                fontWeight: 700,
                                letterSpacing: 2,
                            }}
                        >
                            📐 VIEWPORT (CSS pixels — what browser uses for layout)
                        </div>
                        <Row label="CSS Width" value={`${data.w}px`} highlight />
                        <Row label="CSS Height" value={`${data.h}px`} highlight />
                        <Row label="Device Pixel Ratio (DPR)" value={data.dpr.toFixed(2)} highlight />
                        <Row label="Physical Pixels (W×H)" value={`${data.pixelW} × ${data.pixelH}`} />
                        <Row label="Screen Width (screen.width)" value={`${screen.width}px`} />
                        <Row label="Screen Height (screen.height)" value={`${screen.height}px`} />
                        <Row label="Color Depth" value={`${data.colorDepth}-bit`} />
                        <Row label="Orientation" value={data.orientation} />
                    </div>

                    {/* TV Detection */}
                    <div
                        style={{
                            background: '#0a0a0a',
                            borderRadius: 16,
                            border: '1px solid #1a1a1a',
                            overflow: 'hidden',
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                padding: '12px 24px',
                                background: '#111',
                                fontSize: 16,
                                color: '#ffd700',
                                fontWeight: 700,
                                letterSpacing: 2,
                            }}
                        >
                            📺 TV DETECTION LOGIC
                        </div>
                        <Row label="tvLike (heuristic)" value={String(data.tvLike)} highlight />
                        <Row label="data-tv attr (UA detect)" value={data.dataTv} />
                        <Row label="Touch Points" value={data.touch} />
                        <Row label="Hover capable" value={window.matchMedia('(hover: hover)').matches ? 'YES' : 'NO'} />
                        <Row
                            label="Pointer type"
                            value={
                                window.matchMedia('(pointer: fine)').matches
                                    ? 'fine (mouse)'
                                    : window.matchMedia('(pointer: coarse)').matches
                                      ? 'coarse (touch/remote)'
                                      : 'none'
                            }
                        />
                    </div>

                    {/* User Agent */}
                    <div
                        style={{
                            background: '#0a0a0a',
                            borderRadius: 16,
                            border: '1px solid #1a1a1a',
                            overflow: 'hidden',
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                padding: '12px 24px',
                                background: '#111',
                                fontSize: 16,
                                color: '#ffd700',
                                fontWeight: 700,
                                letterSpacing: 2,
                            }}
                        >
                            🔍 USER AGENT
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ fontSize: 18, color: '#888', marginBottom: 8 }}>
                                Client (navigator.userAgent):
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    color: '#ffd700',
                                    fontFamily: 'monospace',
                                    lineHeight: 1.6,
                                    wordBreak: 'break-all',
                                }}
                            >
                                {data.ua}
                            </div>
                        </div>
                        <div style={{ padding: '20px 24px', borderTop: '1px solid #222' }}>
                            <div style={{ fontSize: 18, color: '#888', marginBottom: 8 }}>Server (request header):</div>
                            <div
                                style={{
                                    fontSize: 16,
                                    color: '#3b82f6',
                                    fontFamily: 'monospace',
                                    lineHeight: 1.6,
                                    wordBreak: 'break-all',
                                }}
                            >
                                {serverUa}
                            </div>
                        </div>
                    </div>

                    {/* Force TV mode button */}
                    <div style={{ marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <a
                            href="/store/catalog?tv=1"
                            style={{
                                display: 'inline-block',
                                padding: '20px 40px',
                                background: '#ffd700',
                                color: '#000',
                                fontWeight: 900,
                                fontSize: 22,
                                borderRadius: 12,
                                textDecoration: 'none',
                                letterSpacing: 1,
                            }}
                        >
                            → OPEN CATALOG (TV FORCED ON)
                        </a>
                        <a
                            href="/store/catalog?tv=0"
                            style={{
                                display: 'inline-block',
                                padding: '20px 40px',
                                background: '#1e293b',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: 22,
                                borderRadius: 12,
                                textDecoration: 'none',
                                letterSpacing: 1,
                                border: '2px solid #334155',
                            }}
                        >
                            → OPEN CATALOG (DESKTOP FORCED)
                        </a>
                        <a
                            href="/store/catalog"
                            style={{
                                display: 'inline-block',
                                padding: '20px 40px',
                                background: '#0a0a0a',
                                color: '#888',
                                fontWeight: 900,
                                fontSize: 22,
                                borderRadius: 12,
                                textDecoration: 'none',
                                letterSpacing: 1,
                                border: '2px solid #222',
                            }}
                        >
                            → OPEN CATALOG (AUTO)
                        </a>
                    </div>

                    {/* 🔴 Force Reload Section */}
                    <div
                        style={{
                            marginTop: 40,
                            padding: '28px 32px',
                            background: '#0d0d0d',
                            borderRadius: 16,
                            border: `2px solid ${reloadStatus === 'sent' ? '#22c55e' : reloadStatus === 'error' ? '#ef4444' : '#3b1a1a'}`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 16,
                                color: '#ffd700',
                                fontWeight: 700,
                                letterSpacing: 2,
                                marginBottom: 16,
                            }}
                        >
                            📡 REMOTE TV CONTROL
                        </div>
                        <div style={{ fontSize: 18, color: '#888', marginBottom: 20 }}>
                            TV browser har 30 second mein check karta hai. Button press karne par sab TVs reload honge.
                        </div>
                        <button
                            onClick={triggerReload}
                            disabled={reloadStatus === 'sent'}
                            style={{
                                padding: '20px 48px',
                                background: reloadStatus === 'sent' ? '#052e16' : '#7f1d1d',
                                color: reloadStatus === 'sent' ? '#22c55e' : '#fca5a5',
                                border: `2px solid ${reloadStatus === 'sent' ? '#22c55e' : '#ef4444'}`,
                                borderRadius: 12,
                                fontSize: 22,
                                fontWeight: 900,
                                cursor: reloadStatus === 'sent' ? 'not-allowed' : 'pointer',
                                letterSpacing: 1,
                            }}
                        >
                            {reloadStatus === 'sent'
                                ? '✅ Signal Sent — TVs Reload in ~30s'
                                : reloadStatus === 'error'
                                  ? '❌ Error — Retry'
                                  : '🔄 Force Reload All TVs'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
