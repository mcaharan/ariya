import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';


function getImageSrc(item) {
    if (item.icon_path) return `/storage/${item.icon_path}`;
    return `/images/dashboard/emergency/${item.image}`;
}

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

function PopupContent({ item }) {
    const type = item.content_type || 'text';
    const value = item.content_value;

    if (type === 'text') {
        return item.content ? (
            <p className="text-gray-600 text-base whitespace-pre-line">{item.content}</p>
        ) : null;
    }

    if (type === 'image') {
        const src = normalizeStorage(value);
        return src ? <img src={src} alt={item.title} className="max-h-64 w-full object-contain rounded-lg" /> : null;
    }

    if (type === 'pdf') {
        const src = normalizeStorage(value);
        return src ? (
            <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Open PDF
            </a>
        ) : null;
    }

    if (type === 'video') {
        if (!value) return null;
        if (isYouTube(value)) {
            const embed = youtubeEmbed(value);
            return embed ? (
                <div className="aspect-video w-full">
                    <iframe src={embed} className="h-full w-full rounded-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
            ) : null;
        }
        const src = normalizeStorage(value);
        return <video src={src} controls autoPlay className="w-full rounded-lg max-h-64" />;
    }

    if (type === 'link') {
        const src = normalizeStorage(value) || value;
        return src ? (
            <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Open Link
            </a>
        ) : null;
    }

    return null;
}


export default function Emergency({ child, emergencyItems = [], headerImage = null }) {
    const [popup, setPopup] = useState(null);

    return (
        <AuthenticatedLayout>
            <Head title={`Emergency — ${child.name}`} />

            <div className="min-h-[calc(100vh-64px)] bg-gray-100">

                <PageHeader
                    headerImage={headerImage}
                    backHref={route('children.show', child.id)}
                    title={child.emergency_title || 'Emergency'}
                />

                {/* Image grid */}
                <div className="px-8 py-6">
                    <div className="flex flex-wrap justify-center gap-5">
                        {emergencyItems.map((item, idx) => (
                            <button
                                key={item.id ?? item.image ?? idx}
                                onClick={() => setPopup(item)}
                                className="group flex items-center justify-center cursor-pointer"
                                style={{ width: 'calc(18% - 18px)' }}
                            >
                                <img
                                    src={getImageSrc(item)}
                                    alt={item.title}
                                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Popup */}
            {popup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setPopup(null)} />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-8 flex flex-col items-center text-center">
                        {/* Icon circle overlapping top */}
                        <div className="absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-white">
                            <img src={getImageSrc(popup)} alt={popup.title} className="h-10 w-10 object-contain" />
                        </div>

                        <div className="mt-8 w-full space-y-4">
                            <h2 className="text-lg font-bold text-gray-900">{popup.title}</h2>
                            <PopupContent item={popup} />
                        </div>

                        <button
                            onClick={() => setPopup(null)}
                            className="mt-6 rounded-lg border border-gray-300 px-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
