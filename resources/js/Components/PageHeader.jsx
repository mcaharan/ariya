import { Link } from '@inertiajs/react';

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

export default function PageHeader({ headerImage, backHref, icon, title, child, children }) {
    const conthrax = { fontFamily: 'Conthrax, sans-serif', fontWeight: 600 };
    const photoSrc = child ? normalizePhoto(child.photo) : null;

    const centerImg = headerImage
        ? `/storage/${headerImage}`
        : (icon || '/images/tracker.png');

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 overflow-hidden">
            {/* 3-column grid: left=child, center=image, right=back */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>

                {/* Left: back button */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {backHref && (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            style={conthrax}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Link>
                    )}
                </div>

                {/* Center: admin-uploaded image or tracker logo */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={centerImg}
                        alt={title || 'Header'}
                        style={{ maxHeight: '64px', objectFit: 'contain' }}
                    />
                </div>

                {/* Right: child photo + name */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {child && (
                        <>
                            {photoSrc ? (
                                <img
                                    src={photoSrc}
                                    alt={child.name}
                                    className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                                />
                            ) : (
                                <div
                                    className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-blue-400 to-indigo-500 text-2xl font-bold text-white shadow-sm"
                                    style={conthrax}
                                >
                                    {child.name.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm font-medium text-gray-700" style={conthrax}>{child.name}</span>
                        </>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
