'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { BLOG_POSTS } from '@/data/blogData';

export default function BlogListingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* HEROS SECTION */}
            <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2670&auto=format&fit=crop"
                        alt="Blog Hero"
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>

                <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-[#F4B000]/20 text-[#F4B000] border border-[#F4B000]/30 text-xs font-black tracking-widest uppercase mb-6 backdrop-blur-sm"
                    >
                        The Journal
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
                    >
                        Stories from the{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4B000] to-[#FFD700]">
                            Fast Lane
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        Discover the latest in automotive innovation, industry insights, and the future of mobility.
                    </motion.p>
                </div>
            </section>

            {/* CONTENT GRID */}
            <section className="py-20 page-container -mt-20 relative z-30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOG_POSTS.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300"
                        >
                            {/* Image */}
                            <div className="relative h-64 overflow-hidden">
                                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10" />
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                    {post.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white rounded-lg shadow-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 flex flex-col flex-1">
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-[#F4B000]" />
                                        {post.date}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-[#F4B000]" />
                                        {post.readTime}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-[#F4B000] transition-colors">
                                    {post.title}
                                </h2>

                                <p className="text-slate-500 dark:text-slate-400 line-clamp-3 mb-8 text-sm leading-relaxed flex-1 font-medium">
                                    {post.excerpt}
                                </p>

                                <Link
                                    href={`/blog/${post.slug}`}
                                    className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] group/link"
                                >
                                    Read Article
                                    <ArrowRight
                                        size={16}
                                        className="transform group-hover/link:translate-x-1 transition-transform text-[#F4B000]"
                                    />
                                </Link>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>
        </div>
    );
}
