'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Share2, MessageCircle, MapPin, Menu, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Mock Data for Stories
const STORIES = [
    {
        id: '1',
        name: 'HONDA ACTIVA 6G',
        tagline: "India's most loved scooter. Smart features & enhanced mileage.",
        price: '₹2,499/mo',
        rating: 5,
        reviews: '4.2k',
        comments: 840,
        image: '/images/templates/t3_night.png',
        color: 'from-indigo-900/40',
        tags: ['Featured', 'Best Seller'],
        badges: [
            { text: 'LOWEST EMI 📉', rotate: 6, top: '25%', right: '2rem' },
            { text: '⚡ Delivery in 4 hrs', rotate: 0, top: '33%', left: '2rem' }
        ]
    },
    {
        id: '2',
        name: 'ATHER 450X',
        tagline: "The super scooter. Warp mode on. 0-40 in 3.3s.",
        price: '₹3,100/mo',
        rating: 5,
        reviews: '2.1k',
        comments: 312,
        image: '/images/ocean_bg.jpg', // Using existing asset or generic
        color: 'from-emerald-900/40',
        tags: ['Electric', 'High Performance'],
        badges: [
            { text: '🚀 WARP MODE', rotate: -6, top: '20%', right: '2rem' },
            { text: '165km Range 🔋', rotate: 3, top: '40%', left: '2rem' }
        ]
    },
    {
        id: '3',
        name: 'RE HUNTER 350',
        tagline: "Maximum motorcycle per rupee. Pure motorcycling tailored.",
        price: '₹4,200/mo',
        rating: 4,
        reviews: '8.5k',
        comments: 1205,
        image: '/images/templates/t3_day.png',
        color: 'from-orange-900/40',
        tags: ['Cruiser', 'Trending'],
        badges: [
            { text: '🔥 HOT SELLER', rotate: 8, top: '22%', right: '1.5rem' },
            { text: 'Pure Sound 🔊', rotate: -3, top: '45%', left: '2rem' }
        ]
    }
];

const StoryItem = ({ story, isActive, toggleLike, isLiked }) => {
    const router = useRouter();

    return (
        <div className="h-screen w-full relative snap-start flex-shrink-0 overflow-hidden bg-neutral-900">
            {/* Background Image / Video Placeholder */}
            <div className="absolute inset-0 z-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${story.color} to-black/80 z-10 transition-all duration-1000`} />
                <Image
                    src={story.image}
                    alt={story.name}
                    fill
                    className={`object-cover transition-transform duration-[5s] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                    priority={isActive}
                />
            </div>

            {/* Overlays/Badges */}
            <AnimatePresence>
                {isActive && story.badges.map((badge, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ scale: 0, opacity: 0, rotate: badge.rotate * 2 }}
                        animate={{ scale: 1, opacity: 1, rotate: badge.rotate }}
                        transition={{ delay: 0.5 + (idx * 0.2), type: 'spring' }}
                        className="absolute bg-white/90 backdrop-blur text-black px-4 py-2 rounded-xl font-black z-20 shadow-xl border-2 border-white/50"
                        style={{ top: badge.top, right: badge.right, left: badge.left }}
                    >
                        {badge.text}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Right Sidebar Actions */}
            <div className="absolute bottom-32 right-4 flex flex-col gap-6 items-center z-40">
                <div className="flex flex-col items-center gap-1 group">
                    <button
                        onClick={() => toggleLike(story.id)}
                        className={`w-12 h-12 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 ${isLiked ? 'bg-red-500/80 border-red-500' : 'bg-black/40 hover:bg-black/60'}`}
                    >
                        <Heart size={24} className={`text-white transition-all ${isLiked ? 'fill-white' : ''}`} />
                    </button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{story.reviews}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button className="w-12 h-12 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all">
                        <MessageCircle size={24} className="text-white" />
                    </button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{story.comments}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: story.name,
                                    text: `Check out the ${story.name} on BookMyBike!`,
                                    url: window.location.href,
                                }).catch(console.error);
                            }
                        }}
                        className="w-12 h-12 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
                    >
                        <Share2 size={24} className="text-white" />
                    </button>
                    <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Share</span>
                </div>
            </div>

            {/* Bottom Info Gradient - Adjusted for Bottom Nav */}
            <div className="absolute bottom-16 left-0 right-0 z-30 p-6 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                        {story.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-[#F4B000] rounded text-[10px] font-black text-black uppercase tracking-wide">{tag}</span>
                        ))}
                        <div className="flex text-[#F4B000] drop-shadow-sm">
                            {[...Array(story.rating)].map((_, i) => <span key={i} className="text-xs">★</span>)}
                        </div>
                    </div>

                    <h2 className="text-4xl font-black italic text-white leading-none mb-2 drop-shadow-lg">{story.name}</h2>
                    <p className="text-base text-zinc-300 line-clamp-2 max-w-[80%] mb-4 drop-shadow-md">{story.tagline}</p>

                    <button
                        onClick={() => router.push('/m/store')}
                        className="w-full h-14 bg-[#F4B000] rounded-2xl font-black text-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(244,176,0,0.4)] hover:shadow-[0_0_30px_rgba(244,176,0,0.6)] animate-pulse transition-all active:scale-95"
                    >
                        Check Availability <MapPin size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const MobileTemplate1 = () => {
    const [muted, setMuted] = useState(true);
    const [likedStories, setLikedStories] = useState<string[]>([]);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleLike = (id: string) => {
        setLikedStories(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleScroll = () => {
        if (containerRef.current) {
            const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
            setActiveStoryIndex(index);
        }
    };

    return (
        <div className="bg-black h-screen w-full relative overflow-hidden font-sans">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 p-4 pt-14 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex flex-col pointer-events-auto">
                    <span className="text-xl font-black italic tracking-tighter text-white">BOOKMY.BIKE</span>
                    <span className="text-[10px] text-white/80 font-mono tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE_FEED
                    </span>
                </div>
                <div className="flex gap-4 pointer-events-auto">
                    <button
                        onClick={() => setMuted(!muted)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-all"
                    >
                        {muted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-all">
                        <Search size={18} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Stories Feed Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {STORIES.map((story, index) => (
                    <StoryItem
                        key={story.id}
                        story={story}
                        isActive={activeStoryIndex === index}
                        toggleLike={toggleLike}
                        isLiked={likedStories.includes(story.id)}
                    />
                ))}
            </div>

            {/* Scroll Indicator (if not last) */}
            <AnimatePresence>
                {activeStoryIndex < STORIES.length - 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: [0, 10, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 text-white/50 pointer-events-none"
                    >
                        <ChevronDown size={32} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
