import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

function normalizeStoragePath(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith('/storage/')) return path;
    if (path.startsWith('storage/')) return '/' + path;
    if (path.startsWith('/')) return '/storage' + path;
    return '/storage/' + path;
}

function isYouTubeUrl(url) {
    return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeEmbedUrl(url) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

const ALL_ITEMS = [
    { image: 'emg.png',        label: 'Emergency',      href: '#', content_type: 'link' },
    { image: 'mt-m.png',       label: 'Mandatory Tasks', href: '#', content_type: 'link' },
    { image: 'f-c.png',        label: 'Face Sheet',      href: '#', content_type: 'link' },
    { image: 'at.png',         label: 'Ariya Status',    href: '#', content_type: 'link' },
    { image: 'arts.png',       label: 'Ariya Behavior',  href: '#', content_type: 'link' },
    { image: 'm.png',          label: 'Medication',      href: '#', content_type: 'link' },
    { image: 'sleep.png',      label: 'Sleep',           href: '#', content_type: 'link' },
    { image: 't.png',          label: 'Task',            href: '#', content_type: 'link' },
    { image: 'team.png',       label: 'Team',            href: '#', content_type: 'link' },
    { image: 'ariya-team.png', label: 'Ariya Team',      href: '#', content_type: 'link' },
];

const MODULE_ROUTES = {
    'emg.png':        (childId) => route('children.emergency', childId),
    'mt-m.png':       (childId) => route('children.mandatory-tasks', childId),
    'at.png':         (childId) => route('children.ariya', { child: childId, type: 'status' }),
    'arts.png':       (childId) => route('children.gallery', { child: childId, section: 'ariya-art' }),
    'm.png':          (childId) => route('children.medication', childId),
    't.png':          (childId) => route('children.team-training', childId),
    'team.png':       (childId) => route('children.ariya-team', childId),
    'ariya-team.png': (childId) => route('children.ariya-team', childId),
};

export default function ChildLanding({ child, menuItems = [] }) {
    const [modal, setModal] = useState(null); // { type, value, label }

    const photoSrc = normalizePhoto(child.photo);

    const items = (menuItems.length > 0 ? menuItems : ALL_ITEMS).map((item) => ({
        ...item,
        href: MODULE_ROUTES[item.image]?.(child.id) ?? item.href ?? '#',
    }));

    function handleItemClick(e, item) {
        // Face sheet: open admin-uploaded PDF inline
        if (item.image === 'f-c.png') {
            e.preventDefault();
            if (child.face_sheet_pdf) {
                const src = normalizeStoragePath(child.face_sheet_pdf);
                setModal({ type: 'pdf', value: src, label: 'Face Sheet' });
            }
            return;
        }

        const type = item.content_type || 'link';
        const value = item.content_value || item.href || '#';

        // Preset route override (e.g. emergency page)
        if (MODULE_ROUTES[item.image]) {
            return; // let the <a> href navigate normally
        }

        if (type === 'link') {
            if (value && value !== '#') {
                window.open(value, '_blank', 'noopener,noreferrer');
            }
            e.preventDefault();
            return;
        }

        e.preventDefault();

        if (type === 'pdf') {
            const src = normalizeStoragePath(value);
            if (src) setModal({ type: 'pdf', value: src, label: item.label });
            return;
        }

        setModal({ type, value, label: item.label });
    }

    function closeModal() {
        setModal(null);
    }

    function getItemImageSrc(item) {
        if (item.icon_path) return normalizeStoragePath(item.icon_path);
        if (item.image) return `/images/dashboard/${item.image}`;
        return null;
    }

    return (
        <AuthenticatedLayout>
            <Head title={child.name} />

            <div className="min-h-[calc(100vh-64px)] bg-gray-100">

                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="relative flex items-center justify-center">

                        {/* Child photo + name */}
                        <div className="absolute left-0 flex flex-col items-center gap-1">
                            {photoSrc ? (
                                <img
                                    src={photoSrc}
                                    alt={child.name}
                                    className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-blue-400 to-indigo-500 text-2xl font-bold text-white shadow-sm">
                                    {child.name.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">{child.name}</span>
                        </div>

                        {/* Ariya | TRACKER logo */}
                        <div className="flex items-center gap-4">
                            <img src="/images/tracker.png" alt="Tracker" className="h-14 object-contain" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6">

                    {/* Icon grid — 5 per row, last row centered */}
                    <div className="flex flex-wrap justify-center gap-5">
                        {items.map((item, idx) => {
                            const imgSrc = getItemImageSrc(item);
                            const isPresetRoute = !!MODULE_ROUTES[item.image];
                            const imgEl = imgSrc && (
                                <img
                                    src={imgSrc}
                                    alt={item.label}
                                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                                />
                            );
                            const cls = "group flex items-center justify-center cursor-pointer";
                            const sty = { width: 'calc(20% - 20px)' };

                            if (isPresetRoute) {
                                return (
                                    <Link
                                        key={item.id ?? item.image ?? idx}
                                        href={item.href}
                                        className={cls}
                                        style={sty}
                                    >
                                        {imgEl}
                                    </Link>
                                );
                            }

                            return (
                                <button
                                    key={item.id ?? item.image ?? idx}
                                    type="button"
                                    onClick={(e) => handleItemClick(e, item)}
                                    className={cls}
                                    style={sty}
                                >
                                    {imgEl}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Modal */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                            <h2 className="text-base font-semibold text-gray-800">{modal.label}</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal body */}
                        {modal.type === 'pdf' ? (
                            <iframe
                                src={modal.value}
                                className="w-full border-0"
                                style={{ height: '80vh' }}
                                title={modal.label}
                            />
                        ) : (
                            <div className="p-4">
                                {modal.type === 'video' && (() => {
                                    if (isYouTubeUrl(modal.value)) {
                                        const embedUrl = getYouTubeEmbedUrl(modal.value);
                                        return (
                                            <div className="aspect-video w-full">
                                                <iframe
                                                    src={embedUrl}
                                                    className="h-full w-full rounded"
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                />
                                            </div>
                                        );
                                    }
                                    const src = normalizeStoragePath(modal.value);
                                    return (
                                        <video
                                            src={src}
                                            controls
                                            autoPlay
                                            className="w-full rounded max-h-[70vh]"
                                        />
                                    );
                                })()}

                                {modal.type === 'image' && (
                                    <img
                                        src={normalizeStoragePath(modal.value)}
                                        alt={modal.label}
                                        className="max-h-[75vh] w-full object-contain rounded"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
