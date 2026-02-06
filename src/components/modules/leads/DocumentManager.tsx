'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    getMemberDocuments,
    uploadMemberDocumentAction,
    deleteMemberDocumentAction,
    getSignedUrlAction,
    updateMemberDocumentAction,
} from '@/actions/crm';
import {
    FileText,
    Upload,
    Trash2,
    Loader2,
    Eye,
    Check,
    AlertCircle,
    Plus,
    X,
    FileImage,
    Scissors,
    Type,
    Layers,
    Square,
} from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import ImageEditor from './ImageEditor';
import { Button } from '@/components/ui/button';

interface Document {
    id: string;
    path: string;
    file_type: string;
    purpose: string;
    metadata: any;
    created_at: string;
}

interface DocumentManagerProps {
    memberId: string;
    tenantId: string;
}

export default function DocumentManager({ memberId, tenantId }: DocumentManagerProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editingImages, setEditingImages] = useState<string[] | null>(null);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const categories = [
        'PAN Card',
        'Aadhar Card',
        'Light Bill',
        'Voting Card',
        'Passport',
        'Electricity Bill',
        'LIC Policy',
        'Phone Bill',
        'Bank Statement',
        'Bank Passbook',
    ];

    const supabase = createClient();

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const data = await getMemberDocuments(memberId);
            setDocuments(data);

            // Fetch signed URLs for all documents
            const urls: Record<string, string> = {};
            await Promise.all(
                data.map(async (doc: Document) => {
                    try {
                        const url = await getSignedUrlAction(doc.path);
                        urls[doc.id] = url;
                    } catch (e) {
                        console.error('Error fetching signed URL for', doc.id, e);
                    }
                })
            );
            setSignedUrls(urls);
        } catch (error) {
            toast.error('Failed to sync documents');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) fetchDocuments();
    }, [memberId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of files) {
                await uploadFile(file, file.type);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const uploadFile = async (file: Blob | File, fileType: string) => {
        // ... (existing upload logic remains similar but used for direct upload now)
        try {
            let fileToUpload = file;
            if (fileType.startsWith('image/')) {
                const options = {
                    maxSizeMB: 1, // Larger limit for Phase 1 (speed)
                    maxWidthOrHeight: 2560,
                    useWebWorker: true,
                    fileType: 'image/webp',
                };
                try {
                    fileToUpload = await imageCompression(file as File, options);
                } catch (e) {
                    // Fallback to original if compression fails
                    fileToUpload = file;
                }
            }

            // 2. Upload to Storage
            const fileName = `${memberId}/ASSET_${Date.now()}.${fileType === 'application/pdf' ? 'pdf' : 'webp'}`;
            const { data: storageData, error: storageError } = await supabase.storage
                .from('id_documents')
                .upload(fileName, fileToUpload);

            if (storageError) throw storageError;

            // 3. Save to DB
            const asset = await uploadMemberDocumentAction({
                memberId,
                tenantId,
                path: storageData.path,
                fileType: fileType.startsWith('image/') ? 'image/webp' : fileType,
                purpose: 'ID_PROOF', // Default purpose for direct upload
                metadata: {
                    originalName: (file as File).name || 'document.bin',
                    size: fileToUpload.size,
                },
            });

            // 4. Get signed URL for the new asset
            const signedUrl = await getSignedUrlAction(asset.path);
            setSignedUrls(prev => ({ ...prev, [asset.id]: signedUrl }));

            setDocuments(prev => [asset, ...prev]);
            toast.success('Asset archived');
        } catch (error) {
            console.error(error);
            toast.error('Upload failed');
        }
    };

    const handleStitchBatch = async () => {
        if (selectedDocIds.length < 2) {
            toast.error('Select at least 2 items to stitch');
            return;
        }

        setIsUploading(true);
        try {
            const selectedDocs = documents.filter(d => selectedDocIds.includes(d.id));

            // 1. Load images into Blobs
            const blobs = await Promise.all(
                selectedDocs.map(async doc => {
                    const url = getViewUrl(doc.path, doc.id);
                    const response = await fetch(url);
                    return response.blob();
                })
            );

            // 2. Load into images for canvas
            const loadedImages = await Promise.all(
                blobs.map(async blob => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    const url = URL.createObjectURL(blob);
                    img.src = url;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    return { img, url };
                })
            );

            // 3. Prepare Scaling & Canvas
            const targetWidth = Math.max(...loadedImages.map(item => item.img.width));
            const scaledItems = loadedImages.map(item => {
                const ratio = targetWidth / item.img.width;
                return {
                    img: item.img,
                    url: item.url,
                    w: targetWidth,
                    h: item.img.height * ratio,
                };
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No 2d context');

            const gap = 40;
            const totalHeight = scaledItems.reduce((sum, item) => sum + item.h, 0) + gap * (scaledItems.length - 1);

            canvas.width = targetWidth;
            canvas.height = totalHeight;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let currentY = 0;
            scaledItems.forEach((item, index) => {
                ctx.drawImage(item.img, 0, currentY, item.w, item.h);
                currentY += item.h + (index < scaledItems.length - 1 ? gap : 0);
                URL.revokeObjectURL(item.url);
            });

            // 4. Final Blob
            const stitchedBlob = await new Promise<Blob>(resolve => {
                canvas.toBlob(b => resolve(b!), 'image/webp', 0.85);
            });

            // 5. Upload & Update
            const fileName = `${memberId}/STITCH_${Date.now()}.webp`;
            const { data: storageData, error: storageError } = await supabase.storage
                .from('id_documents')
                .upload(fileName, stitchedBlob);

            if (storageError) throw storageError;

            const asset = await uploadMemberDocumentAction({
                memberId,
                tenantId,
                path: storageData.path,
                fileType: 'image/webp',
                purpose: 'STITCHED_DOC',
                metadata: {
                    originalName: 'stitched_document.webp',
                    size: stitchedBlob.size,
                },
            });

            const signedUrl = await getSignedUrlAction(asset.path);
            setSignedUrls(prev => ({ ...prev, [asset.id]: signedUrl }));
            setDocuments(prev => [asset, ...prev]);

            toast.success('Items successfully stitched');
            setSelectedDocIds([]);
            setIsSelectMode(false);
        } catch (error) {
            console.error(error);
            toast.error('Stitching failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditComplete = async (blob: Blob) => {
        setIsUploading(true);
        try {
            // 1. Upload updated image
            const fileName = `${memberId}/ETD_${Date.now()}.webp`;
            const { data: storageData, error: storageError } = await supabase.storage
                .from('id_documents')
                .upload(fileName, blob);

            if (storageError) throw storageError;

            if (editingDocId) {
                // PHASE 2: Update existing
                const asset = await updateMemberDocumentAction(editingDocId, {
                    path: storageData.path,
                    file_type: 'image/webp',
                });

                const signedUrl = await getSignedUrlAction(asset.path);
                setSignedUrls(prev => ({ ...prev, [asset.id]: signedUrl }));
                setDocuments(prev => prev.map(d => (d.id === asset.id ? asset : d)));
                toast.success('Document updated');
            } else {
                // PHASE 3: Stitching result (new document)
                const asset = await uploadMemberDocumentAction({
                    memberId,
                    tenantId,
                    path: storageData.path,
                    fileType: 'image/webp',
                    purpose: 'STITCHED_DOC',
                    metadata: {
                        originalName: 'stitched_identity.webp',
                        size: blob.size,
                    },
                });
                const signedUrl = await getSignedUrlAction(asset.path);
                setSignedUrls(prev => ({ ...prev, [asset.id]: signedUrl }));
                setDocuments(prev => [asset, ...prev]);
                toast.success('Stitched document created');
                setSelectedDocIds([]);
                setIsSelectMode(false);
            }
        } catch (error) {
            toast.error('Operation failed');
        } finally {
            setIsUploading(false);
            setEditingImages(null);
            setEditingDocId(null);
        }
    };

    const handleDelete = async (id: string, path: string) => {
        try {
            await deleteMemberDocumentAction(id);
            await supabase.storage.from('id_documents').remove([path]);
            setDocuments(prev => prev.filter(d => d.id !== id));
            toast.success('Document purged');
        } catch (error) {
            toast.error('Purge failed');
        }
    };

    const getViewUrl = (path: string, docId: string) => {
        return signedUrls[docId] || '#';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Identity <span className="text-indigo-500">Vault</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Immutable Document Protocol
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            List
                        </button>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSelectMode(!isSelectMode)}
                        className={`text-[10px] font-black uppercase tracking-widest ${isSelectMode ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400'}`}
                    >
                        <Layers size={14} className="mr-2" />
                        {isSelectMode ? 'Exit Selection' : 'Batch Actions'}
                    </Button>
                </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
                {/* Document List */}
                {isLoading
                    ? Array(2)
                          .fill(0)
                          .map((_, i) => (
                              <div
                                  key={i}
                                  className="h-64 rounded-[2.5rem] bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 animate-pulse"
                              />
                          ))
                    : documents.map(doc => {
                          const isSelected = selectedDocIds.includes(doc.id);
                          if (viewMode === 'list') {
                              return (
                                  <div
                                      key={doc.id}
                                      className={`group flex items-center justify-between p-4 bg-white dark:bg-white/5 border rounded-2xl transition-all shadow-sm ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-100 dark:border-white/5 hover:border-indigo-500/20'}`}
                                  >
                                      <div className="flex items-center gap-4">
                                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-black/20 flex items-center justify-center">
                                              {doc.file_type.includes('image') ? (
                                                  <img
                                                      src={getViewUrl(doc.path, doc.id)}
                                                      alt={doc.purpose}
                                                      className="w-full h-full object-cover"
                                                  />
                                              ) : (
                                                  <FileText size={24} className="text-slate-400" />
                                              )}
                                          </div>
                                          <div>
                                              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                                                  {doc.purpose}
                                              </div>
                                              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                                                  {doc.metadata?.originalName || 'document.bin'}
                                              </h4>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          {isSelectMode ? (
                                              <button
                                                  onClick={() => {
                                                      setSelectedDocIds(prev =>
                                                          prev.includes(doc.id)
                                                              ? prev.filter(id => id !== doc.id)
                                                              : [...prev, doc.id]
                                                      );
                                                  }}
                                                  className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                                              >
                                                  <Check size={16} />
                                              </button>
                                          ) : (
                                              <button
                                                  onClick={() => setViewingDoc(doc)}
                                                  className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                                              >
                                                  <Eye size={16} />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              );
                          }
                          return (
                              <div
                                  key={doc.id}
                                  className={`group relative h-64 bg-slate-50 dark:bg-white/5 border rounded-[2.5rem] overflow-hidden transition-all shadow-sm ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-white/5'}`}
                              >
                                  {isSelectMode && (
                                      <button
                                          onClick={() => {
                                              setSelectedDocIds(prev =>
                                                  prev.includes(doc.id)
                                                      ? prev.filter(id => id !== doc.id)
                                                      : [...prev, doc.id]
                                              );
                                          }}
                                          className={`absolute top-6 left-6 z-30 p-2 rounded-xl border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/20 border-white/20 text-white'}`}
                                      >
                                          {isSelected ? <Check size={16} /> : <div className="w-4 h-4" />}
                                      </button>
                                  )}

                                  {doc.file_type.includes('image') ? (
                                      <img
                                          src={getViewUrl(doc.path, doc.id)}
                                          alt={doc.purpose}
                                          className="w-full h-full object-contain bg-slate-200 dark:bg-black/50 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                      />
                                  ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center">
                                          <FileText
                                              size={64}
                                              className="text-slate-200 dark:text-slate-700 group-hover:text-indigo-500 transition-colors mb-4"
                                          />
                                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                                              PDF DOCUMENT
                                          </span>
                                      </div>
                                  )}

                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-100 p-8 flex flex-col justify-end transition-opacity">
                                      <div className="flex items-center justify-between">
                                          <div>
                                              <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2 inline-block">
                                                  {doc.purpose}
                                              </div>
                                              <p className="text-xs font-bold text-white uppercase tracking-tighter truncate max-w-[120px]">
                                                  {doc.metadata?.originalName || 'document.bin'}
                                              </p>
                                          </div>
                                          <div className="flex gap-2">
                                              <button
                                                  onClick={() => setViewingDoc(doc)}
                                                  className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                                              >
                                                  <Eye size={16} />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}

                {/* Upload Trigger Moved to End */}
                {!isSelectMode && (
                    <label
                        className={`group relative h-64 border-2 border-dashed border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-indigo-500/[0.02] overflow-hidden ${viewMode === 'list' ? 'h-32' : ''}`}
                    >
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,application/pdf"
                            multiple
                        />
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Initialize Upload
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 mt-1 uppercase">
                            Image/PDF [MAX 10MB]
                        </span>
                    </label>
                )}
            </div>

            {editingImages && (
                <ImageEditor
                    images={editingImages}
                    onCancel={() => setEditingImages(null)}
                    onComplete={handleEditComplete}
                />
            )}

            {isSelectMode && selectedDocIds.length > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl flex items-center gap-2">
                        <div className="px-6 py-2 border-r border-white/10">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {selectedDocIds.length} Picked
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            className="h-14 px-6 rounded-2xl text-white hover:bg-white/5 transition-all flex items-center gap-3"
                            onClick={handleStitchBatch}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Scissors size={18} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isUploading ? 'Stitching...' : 'Stitch Items'}
                            </span>
                        </Button>

                        <div className="relative group/ren">
                            <Button
                                variant="ghost"
                                className="h-14 px-6 rounded-2xl text-white hover:bg-white/5 transition-all flex items-center gap-3"
                            >
                                <Type size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Categorize</span>
                            </Button>

                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded-2xl p-4 hidden group-hover/ren:block w-72 shadow-2xl">
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Type name for selected..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        onKeyDownCapture={async e => {
                                            if (e.key === 'Enter') {
                                                const val = (e.currentTarget as HTMLInputElement).value;
                                                if (val) {
                                                    for (const id of selectedDocIds) {
                                                        await updateMemberDocumentAction(id, { purpose: val });
                                                    }
                                                    toast.success('Batch Categorized');
                                                    fetchDocuments();
                                                    setSelectedDocIds([]);
                                                }
                                            }
                                        }}
                                    />
                                    <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={async () => {
                                                    for (const id of selectedDocIds) {
                                                        await updateMemberDocumentAction(id, { purpose: cat });
                                                    }
                                                    toast.success('Batch Categorized');
                                                    fetchDocuments();
                                                    setSelectedDocIds([]);
                                                }}
                                                className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl text-left"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            className="h-14 px-6 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all flex items-center gap-3"
                            onClick={() => setSelectedDocIds([])}
                        >
                            <X size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Clear</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* HIGH-FIDELITY DOCUMENT ENLARGED VIEWER */}
            {viewingDoc && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
                    <button
                        onClick={() => setViewingDoc(null)}
                        className="absolute top-8 right-8 text-white/40 hover:text-white p-4 hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-6xl h-full flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">
                                    Archived Identity Asset
                                </div>
                                <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase italic">
                                    {viewingDoc.purpose}
                                </h4>
                            </div>

                            <div className="flex items-center gap-4">
                                {viewingDoc.file_type.includes('image') && (
                                    <Button
                                        onClick={() => {
                                            const url = getViewUrl(viewingDoc.path, viewingDoc.id);
                                            setEditingImages([url]);
                                            setEditingDocId(viewingDoc.id);
                                            setViewingDoc(null);
                                        }}
                                        className="bg-white/10 hover:bg-indigo-600 text-white h-12 px-6 rounded-2xl flex items-center gap-3 transition-all"
                                    >
                                        <Scissors size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Crop / Adjust
                                        </span>
                                    </Button>
                                )}

                                <div className="relative">
                                    <Button
                                        onClick={() => setIsRenameOpen(!isRenameOpen)}
                                        className="bg-white/10 hover:bg-indigo-600 text-white h-12 px-6 rounded-2xl flex items-center gap-3 transition-all"
                                    >
                                        <Type size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Rename Asset
                                        </span>
                                    </Button>
                                    {isRenameOpen && (
                                        <div className="absolute top-full mt-4 right-0 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 w-72">
                                            <div className="space-y-4">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Type custom name..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                    onKeyDownCapture={async e => {
                                                        if (e.key === 'Enter') {
                                                            const val = (e.currentTarget as HTMLInputElement).value;
                                                            if (val) {
                                                                await updateMemberDocumentAction(viewingDoc.id, {
                                                                    purpose: val,
                                                                });
                                                                toast.success('Asset Recataloged');
                                                                setViewingDoc({ ...viewingDoc, purpose: val });
                                                                fetchDocuments();
                                                                setIsRenameOpen(false);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                    {categories.map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={async () => {
                                                                await updateMemberDocumentAction(viewingDoc.id, {
                                                                    purpose: cat,
                                                                });
                                                                toast.success('Asset Recataloged');
                                                                setViewingDoc({ ...viewingDoc, purpose: cat });
                                                                fetchDocuments();
                                                                setIsRenameOpen(false);
                                                            }}
                                                            className="p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl text-left"
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to purge this asset?')) {
                                            handleDelete(viewingDoc.id, viewingDoc.path);
                                            setViewingDoc(null);
                                        }
                                    }}
                                    className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white h-12 px-6 rounded-2xl flex items-center gap-3 transition-all"
                                >
                                    <Trash2 size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Purge Asset
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 w-full bg-black/40 rounded-[3rem] border border-white/5 overflow-hidden flex items-center justify-center relative">
                            {viewingDoc.file_type.includes('image') ? (
                                <img
                                    src={getViewUrl(viewingDoc.path, viewingDoc.id)}
                                    alt={viewingDoc.purpose}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <embed
                                    src={getViewUrl(viewingDoc.path, viewingDoc.id)}
                                    type="application/pdf"
                                    className="w-full h-full"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
