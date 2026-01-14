import { notFound } from 'next/navigation';
import BlogPostClient from '@/components/blog/BlogPostClient';
import { BLOG_POSTS } from '@/data/blogData';

export const dynamicParams = false;

export function generateStaticParams() {
    return BLOG_POSTS.map(post => ({ slug: post.slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const rawSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const normalizedSlug = decodeURIComponent(rawSlug || '').toLowerCase();
    const post = BLOG_POSTS.find(p => p.slug.toLowerCase() === normalizedSlug);

    if (!post) {
        return notFound();
    }

    return <BlogPostClient post={post} />;
}
