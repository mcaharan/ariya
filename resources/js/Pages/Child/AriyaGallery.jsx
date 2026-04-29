import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';

function normalizeStorage(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith('/storage/')) return path;
    if (path.startsWith('storage/')) return '/' + path;
    return '/storage/' + path;
}

function isYouTube(url) {
    return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbed(url) {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function VideoCard({ item }) {
    if (isYouTube(item.video_url)) {
        const embed = youtubeEmbed(item.video_url);
        if (!embed) return null;
        return (
            <div className="break-inside-avoid rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-video w-full">
                    <iframe
                        src={embed}
                        className="h-full w-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                </div>
                {item.caption && (
                    <div className="bg-white px-3 py-1.5 text-xs text-gray-600">{item.caption}</div>
                )}
            </div>
        );
    }
    return (
        <div className="break-inside-avoid rounded-xl overflow-hidden shadow-sm">
            <video src={item.video_url} controls className="w-full" />
            {item.caption && (
                <div className="bg-white px-3 py-1.5 text-xs text-gray-600">{item.caption}</div>
            )}
        </div>
    );
}

export default function AriyaGallery({ child, ariyaItem, type, items = [], headerImage = null }) {
    const imageItems = items.filter((i) => i.image && !i.video_url);
    const [lightbox, setLightbox] = useState(null);

    const prev = () => setLightbox((i) => (i - 1 + imageItems.length) % imageItems.length);
    const next = () => setLightbox((i) => (i + 1) % imageItems.length);

    return (
        <AuthenticatedLayout>
            <Head title={`${ariyaItem.title} — ${child.name}`} />

            <div className="min-h-[calc(100vh-64px)] bg-gray-100">

                <PageHeader
                    headerImage={headerImage}
                    backHref={route('children.ariya', { child: child.id, type })}
                    title={ariyaItem.title}
                />

                {/* Content */}
                <div className="p-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <svg className="h-16 w-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">No content yet</p>
                        </div>
                    ) : (
                        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                            {items.map((item, idx) => (
                                item.video_url ? (
                                    <VideoCard key={item.id} item={item} />
                                ) : (
                                    <div
                                        key={item.id}
                                        className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                        onClick={() => setLightbox(imageItems.indexOf(item))}
                                    >
                                        <img
                                            src={normalizeStorage(item.image)}
                                            alt={item.caption || ''}
                                            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {item.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-sm font-medium truncate">{item.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox (images only) */}
            {lightbox !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10"
                        onClick={() => setLightbox(null)}
                    >
                        &times;
                    </button>

                    {imageItems.length > 1 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-2"
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                        >
                            <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    <div className="max-w-5xl max-h-[90vh] px-16" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={normalizeStorage(imageItems[lightbox]?.image)}
                            alt={imageItems[lightbox]?.caption || ''}
                            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                        />
                        {imageItems[lightbox]?.caption && (
                            <p className="text-center text-white/80 text-sm mt-3">{imageItems[lightbox].caption}</p>
                        )}
                        <p className="text-center text-white/40 text-xs mt-1">{lightbox + 1} / {imageItems.length}</p>
                    </div>

                    {imageItems.length > 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-2"
                            onClick={(e) => { e.stopPropagation(); next(); }}
                        >
                            <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
