import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const make = searchParams.get('make') || 'Brand';
    const model = searchParams.get('model') || 'Model';
    const variant = searchParams.get('variant') || 'Variant';

    const toTitleCase = (str: string) =>
        str
            .split(/[\s-]+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');

    const title = `${toTitleCase(make)} ${toTitleCase(model)}`;
    const subtitle = toTitleCase(variant);

    return new ImageResponse(
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#09090b',
                backgroundImage:
                    'radial-gradient(circle at 25% 25%, #1a1a2e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1a1a2e 0%, transparent 50%)',
            }}
        >
            {/* Accent Bar */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '8px',
                    background: 'linear-gradient(90deg, #FF5F1F 0%, #FF8A50 100%)',
                }}
            />

            {/* Logo */}
            <div
                style={{
                    position: 'absolute',
                    top: '40px',
                    left: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#FF5F1F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: 'white',
                    }}
                >
                    B
                </div>
                <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: '600' }}>BookMyBike</span>
            </div>

            {/* Main Content */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '0 60px',
                }}
            >
                <h1
                    style={{
                        fontSize: '72px',
                        fontWeight: '800',
                        color: '#ffffff',
                        margin: '0 0 16px 0',
                        lineHeight: 1.1,
                        letterSpacing: '-2px',
                    }}
                >
                    {title}
                </h1>
                <p
                    style={{
                        fontSize: '36px',
                        fontWeight: '500',
                        color: '#FF5F1F',
                        margin: '0 0 24px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '4px',
                    }}
                >
                    {subtitle}
                </p>
                <p
                    style={{
                        fontSize: '22px',
                        color: '#a1a1aa',
                        margin: 0,
                    }}
                >
                    Best On-Road Price • Compare Dealers • Book Online
                </p>
            </div>

            {/* Bottom Bar */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    color: '#71717a',
                    fontSize: '18px',
                }}
            >
                <span>🏍️ Two-Wheelers</span>
                <span>•</span>
                <span>💰 Best Prices</span>
                <span>•</span>
                <span>🚀 Quick Booking</span>
            </div>
        </div>,
        {
            width: 1200,
            height: 630,
        }
    );
}
