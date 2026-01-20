'use client';

import React from 'react';
import { ProductVariant } from '@/types/productMaster';
import { Edit, Trash2, Plus, Filter, Search } from 'lucide-react';
import SlideOver from '@/components/ui/SlideOver';
import ProductForm from './ProductForm';

interface ProductListProps {
    title: string;
    products: ProductVariant[];
    type: 'VEHICLE' | 'ACCESSORY' | 'SERVICE';
}

export default function ProductList({ title, products, type }: ProductListProps) {
    const [search, setSearch] = React.useState('');
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState<ProductVariant | null>(null);

    // Filter Logic
    const filtered = products.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Label, SKU, Model..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 font-medium">
                        <Filter size={18} />
                        Filters
                    </button>
                    <button
                        onClick={() => { setSelectedProduct(null); setIsCreateOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all"
                    >
                        <Plus size={18} />
                        Add {title}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border boundary-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-white/10 text-xs uppercase text-gray-500 dark:text-slate-400 font-semibold tracking-wider">
                                <th className="px-6 py-4">Product Label / SKU</th>
                                <th className="px-6 py-4">Make & Model</th>
                                <th className="px-6 py-4">Variant / Spec</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                        No products found. Match query or add new.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{product.label}</div>
                                            <div className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1">{product.sku}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700">{product.make}</div>
                                            <div className="text-xs text-gray-500">{product.model}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {product.variant}
                                            </span>
                                            {product.color && (
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-gray-400" /> {/* Mock Color dot */}
                                                    {product.color}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.status === 'ACTIVE'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setSelectedProduct(product); setIsCreateOpen(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {/* Delete disabled by default for Master often, but adding Icon for now */}
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Panel */}
            <SlideOver
                isOpen={isCreateOpen}
                onClose={() => { setIsCreateOpen(false); setSelectedProduct(null); }}
                title={selectedProduct ? `Edit ${title}` : `Create New ${title}`}
                width="2xl"
            >
                <div className="">
                    <ProductForm
                        type={type}
                        initialData={selectedProduct}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </div>
            </SlideOver>
        </div>
    );
}
