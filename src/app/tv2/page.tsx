import Link from 'next/link';

export default function TV2IndexPage() {
    return (
        <div className="page-container pb-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
                <h1 className="text-2xl font-black text-slate-900">TV2 Preview</h1>
                <p className="text-sm text-slate-600">
                    Is test shell me Home, Catalog, aur PDP flows TV-mode me validate karo.
                </p>
                <div className="flex items-center gap-3">
                    <Link href="/tv2/home" className="px-4 py-2 rounded-xl bg-[#F4B000] text-black text-sm font-black">
                        Open Home
                    </Link>
                    <Link
                        href="/tv2/catalog"
                        className="px-4 py-2 rounded-xl bg-[#F4B000] text-black text-sm font-black"
                    >
                        Open Catalog
                    </Link>
                    <Link href="/tv2/pdp" className="px-4 py-2 rounded-xl bg-[#F4B000] text-black text-sm font-black">
                        Open PDP
                    </Link>
                </div>
            </div>
        </div>
    );
}
