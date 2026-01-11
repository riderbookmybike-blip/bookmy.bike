import Link from 'next/link';

export default function AccessDenied() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans text-slate-900 dark:bg-slate-950 dark:text-white">
            <h1 className="mb-4 text-6xl font-black uppercase tracking-tighter">403</h1>
            <h2 className="mb-8 text-2xl font-bold uppercase tracking-widest">Access Denied</h2>
            <p className="mb-8 max-w-md text-center text-sm font-medium leading-relaxed text-slate-500">
                You are authenticated, but you do not have permission to access this portal.
            </p>
            <Link
                href="/logout"
                className="rounded-full bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-indigo-600 dark:bg-white dark:text-black dark:hover:bg-indigo-400"
            >
                Switch Account // Login
            </Link>
        </div>
    );
}
