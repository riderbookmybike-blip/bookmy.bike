import React from 'react';

interface ChromelessVideoProps {
    videoId: string;
    className?: string;
}

export default function ChromelessVideo({ videoId, className = '' }: ChromelessVideoProps) {
    // YouTube Embed Parameters for "Chromeless" look
    // controls=0: Hide bottom player bar
    // modestbranding=1: Minimize YouTube logo
    // rel=0: Show related videos from same channel only (limits competitor ads)
    // showinfo=0: Hide title bar (deprecated but good to have)
    // iv_load_policy=3: Hide annotations
    // autoplay=1 & mute=1: Essential for background header feel
    // loop=1: Loop forever
    // playlist={videoId}: Required for looping single video
    const embedParams = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        controls: '0',
        modestbranding: '1',
        rel: '0',
        showinfo: '0',
        iv_load_policy: '3',
        loop: '1',
        playlist: videoId,
        playsinline: '1', // Important for iOS
        disablekb: '1', // Disable keyboard controls
    });

    return (
        <div className={`relative overflow-hidden w-full h-full ${className}`}>
            {/* The Video Iframe */}
            <div className="absolute inset-0 w-full h-full scale-[1.35] pointer-events-none">
                {/* scale-135 is a trick to crop out the black bars/titles usually found on edges */}
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`}
                    title="Product Background Video"
                    className="w-full h-full object-cover"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ pointerEvents: 'none' }} // Double insurance against clicks
                />
            </div>

            {/* Transparent Overlay - The "Shield" */}
            {/* Prevents hovering to see title or clicking pause */}
            <div className="absolute inset-0 z-10 bg-transparent" />

            {/* Optional: Subtle Gradient Overlay for text readability if we place text over it later */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-20" />
        </div>
    );
}
