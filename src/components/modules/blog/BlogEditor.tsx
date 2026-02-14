// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, ArrowLeft, Send, Image as ImageIcon, Tag, Clock, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface BlogEditorProps {
    postId?: string;
    initialData?: BlogsData;
}

interface BlogsData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author_name: string;
    image_url: string;
    tags: string[];
    read_time: string;
    is_published: boolean;
}

export default function BlogEditor({ postId }: { postId?: string }) {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug;
    const [loading, setLoading] = useState(postId ? true : false);
    const [saving, setSaving] = useState(false);

    const [data, setData] = useState<BlogsData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author_name: '',
        image_url: '',
        tags: [],
        read_time: '5 min read',
        is_published: false,
    });

    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (postId) {
            const fetchPost = async () => {
                const supabase = createClient();
                const { data: post, error } = await supabase.from('blog_posts').select('*').eq('id', postId).single();

                if (!error && post) {
                    setData(post);
                }
                setLoading(false);
            };
            fetchPost();
        }
    }, [postId]);

    const handleSave = async (publish: boolean = false) => {
        setSaving(true);
        const supabase = createClient();

        const postData = {
            ...data,
            is_published: publish ? true : data.is_published,
            published_at: publish ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        };

        let error;
        if (postId) {
            const { error: err } = await supabase.from('blog_posts').update(postData).eq('id', postId);
            error = err;
        } else {
            const { error: err } = await supabase.from('blog_posts').insert([postData]);
            error = err;
        }

        if (!error) {
            router.push(`/app/${slug}/dashboard/blog`);
        } else {
            alert('Error saving post: ' + error.message);
        }
        setSaving(false);
    };

    const generateSlug = () => {
        setData({
            ...data,
            slug: data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''),
        });
    };

    if (loading)
        return (
            <div className="p-20 text-center uppercase font-black tracking-widest animate-pulse">Loading Editor...</div>
        );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/app/${slug}/dashboard/blog`}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-all"
                >
                    <ArrowLeft size={14} />
                    Back to List
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300"
                    >
                        <Save size={14} />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-brand-primary text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl dark:shadow-brand-primary/20"
                    >
                        <Send size={14} />
                        {postId ? 'Update & Publish' : 'Publish Post'}
                    </button>
                </div>
            </div>

            {/* Main Editor Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Article Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter an engaging title..."
                                value={data.title}
                                onBlur={generateSlug}
                                onChange={e => setData({ ...data, title: e.target.value })}
                                className="w-full text-3xl font-black bg-transparent border-none placeholder:text-slate-200 dark:placeholder:text-slate-700 focus:ring-0 outline-none uppercase tracking-tighter"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="url-friendly-slug"
                                        value={data.slug}
                                        onChange={e => setData({ ...data, slug: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider outline-none focus:border-brand-primary/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Read Time
                                    </label>
                                    <input
                                        type="text"
                                        value={data.read_time}
                                        onChange={e => setData({ ...data, read_time: e.target.value })}
                                        className="w-32 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 tracking-wider outline-none focus:border-brand-primary/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Short Excerpt
                            </label>
                            <textarea
                                placeholder="A brief summary for card previews..."
                                value={data.excerpt}
                                onChange={e => setData({ ...data, excerpt: e.target.value })}
                                rows={3}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-brand-primary/50 transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Article Content (Markdown)
                                </label>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    MD Supported
                                </span>
                            </div>
                            <textarea
                                placeholder="Write your story here..."
                                value={data.content}
                                onChange={e => setData({ ...data, content: e.target.value })}
                                rows={20}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-[2rem] py-6 px-8 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-brand-primary/50 transition-all leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-8">
                    {/* Featured Image */}
                    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-lg">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={14} className="text-brand-primary" />
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                Featured Image
                            </h4>
                        </div>
                        <div className="aspect-video bg-slate-100 dark:bg-black/40 rounded-2xl overflow-hidden border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center relative group">
                            {data.image_url ? (
                                <img src={data.image_url} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <div className="text-center p-6">
                                    <ImageIcon size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        No Image Selected
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Image URL
                            </label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={data.image_url}
                                onChange={e => setData({ ...data, image_url: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl py-3 px-4 text-[9px] font-bold text-slate-600 dark:text-slate-400 tracking-wider outline-none focus:border-brand-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-lg">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-brand-primary" />
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    Author
                                </h4>
                            </div>
                            <input
                                type="text"
                                placeholder="Author Name"
                                value={data.author_name}
                                onChange={e => setData({ ...data, author_name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Tag size={14} className="text-brand-primary" />
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    Tags
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {data.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[8px] font-black uppercase tracking-widest"
                                    >
                                        {tag}
                                        <X
                                            size={10}
                                            className="cursor-pointer"
                                            onClick={() => setData({ ...data, tags: data.tags.filter(t => t !== tag) })}
                                        />
                                    </span>
                                ))}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Add tag and press Enter"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && tagInput.trim()) {
                                            if (!data.tags.includes(tagInput.trim())) {
                                                setData({ ...data, tags: [...data.tags, tagInput.trim()] });
                                            }
                                            setTagInput('');
                                        }
                                    }}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold text-slate-600 dark:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// @ts-nocheck
