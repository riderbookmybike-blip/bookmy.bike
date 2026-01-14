'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { BlogPost } from '@/data/blogData';

export default function BlogPostClient({ post }: { post: BlogPost }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const nextProgress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
            setProgress(nextProgress);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div
                className="fixed top-0 left-0 h-1 bg-indigo-600 z-50 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
            />

            {/* HEADER */}
            <header className="relative h-[60vh] min-h-[500px]">
                <div className="absolute inset-0">
                    <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 h-full max-w-4xl mx-auto px-6 flex flex-col justify-end pb-20">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors group">
                        <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">Back to Journal</span>
                    </Link>

                    <div className="flex flex-wrap gap-3 mb-6">
                        {post.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-500/25">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-6 text-slate-300 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {post.author.charAt(0)}
                            </div>
                            <span>{post.author}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-500" />
                        <span className="flex items-center gap-2">
                            <Calendar size={16} />
                            {post.date}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-500" />
                        <span className="flex items-center gap-2">
                            <Clock size={16} />
                            {post.readTime}
                        </span>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <main className="max-w-4xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 relative">
                {/* ARTICLE BODY */}
                <article className="prose prose-lg dark:prose-invert prose-slate max-w-none
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                    prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-loose
                    prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400
                    prose-li:marker:text-indigo-500
                ">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </article>

                {/* SIDEBAR / SHARE */}
                <aside className="lg:w-16 flex lg:flex-col items-center gap-4 h-fit lg:sticky lg:top-32">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest lg:-rotate-90 whitespace-nowrap mb-4 hidden lg:block">
                        Share Article
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all">
                        <Facebook size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-500 hover:text-white hover:border-transparent transition-all">
                        <Twitter size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-blue-700 hover:text-white hover:border-transparent transition-all">
                        <Linkedin size={18} />
                    </button>
                    <div className="w-full h-px lg:w-px lg:h-12 bg-slate-200 dark:bg-white/10 my-2" />
                    <button className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform">
                        <Share2 size={18} />
                    </button>
                </aside>
            </main>

            {/* FOOTER CTA */}
            <section className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Want more updates?</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Subscribe to our newsletter to get the latest automotive insights delivered to your inbox.</p>
                    <div className="flex gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                        <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
