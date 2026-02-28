import Link from 'next/link';
import { fetchCatalogV2 } from '@/lib/server/catalogFetcherV2';
import { slugify } from '@/utils/slugs';

export default async function TV2PDPLauncherPage() {
    const items = await fetchCatalogV2('MH');
    const topItems = items.slice(0, 12);

    return (
        <div className="page-container pb-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                <h2 className="text-xl font-black text-slate-900">TV2 PDP Launcher</h2>
                <p className="text-sm text-slate-600 mt-1">
                    Sample products select karo aur PDP open karke TV behavior test karo.
                </p>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {topItems.map(item => {
                        const href = `/store/${slugify(item.make)}/${slugify(item.model)}/${slugify(item.variant)}`;
                        return (
                            <Link
                                key={item.id}
                                href={href}
                                className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-3"
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {item.make}
                                </p>
                                <p className="text-base font-black text-slate-900 leading-tight mt-1">{item.model}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                                    {item.variant}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
