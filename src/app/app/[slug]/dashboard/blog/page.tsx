'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye, Calendar, User, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
type BlogPost = {
    id: string;
    title: string;
    author_name?: string | null;
    image_url?: string | null;
    is_published?: boolean | null;
    created_at?: string | null;
    excerpt?: string | null;
};

export default function BlogManagementPage() {
    const params = useParams();
    const slug = params.slug;
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPosts = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await (supabase as any)
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPosts(data as BlogPost[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter(
        p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        Blog <span className="text-brand-primary italic">Management</span>
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                        Create, Edit and Publish articles for BookMyBike
                    </p>
                </div>
                <Link
                    href={`/app/${slug}/dashboard/blog/new`}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-brand-primary text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 dark:shadow-brand-primary/20"
                >
                    <Plus size={16} />
                    New Article
                </Link>
            </div>

            {/* Stats & Filter Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 relative group">
                    <Search
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search by title or author..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2rem] py-5 pl-16 pr-8 text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                    />
                </div>
                <div className="bg-slate-900 dark:bg-brand-primary rounded-[2rem] p-5 flex flex-col justify-center items-center shadow-lg">
                    <span className="text-[10px] font-black text-slate-400 dark:text-black/60 uppercase tracking-widest">
                        Total Posts
                    </span>
                    <span className="text-2xl font-black text-white dark:text-black">{posts.length}</span>
                </div>
            </div>

            {/* Posts Grid/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    Array(6)
                        .fill(0)
                        .map((_, i) => (
                            <div
                                key={i}
                                className="h-96 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] animate-pulse"
                            />
                        ))
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <div
                            key={post.id}
                            className="group flex flex-col bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500"
                        >
                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                {post.image_url ? (
                                    <img
                                        src={post.image_url}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Eye size={48} className="opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span
                                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                                            post.is_published ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                                        }`}
                                    >
                                        {post.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <Calendar size={12} className="text-brand-primary" />
                                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : '—'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <User size={12} className="text-brand-primary" />
                                        {post.author_name || 'Admin'}
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-brand-primary transition-colors line-clamp-2 uppercase">
                                    {post.title}
                                </h3>

                                <div className="mt-auto pt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                                    <Link
                                        href={`/app/${slug}/dashboard/blog/${post.id}`}
                                        className="flex items-center gap-2 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:text-brand-primary transition-colors"
                                    >
                                        <Edit2 size={14} />
                                        Edit Post
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-brand-primary transition-colors">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center text-slate-300">
                            <Plus size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                No articles found
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Start by creating your first blog post
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
