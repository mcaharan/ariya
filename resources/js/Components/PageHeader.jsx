import { Link } from '@inertiajs/react';

export default function PageHeader({ headerImage, backHref, icon, title, children }) {
    if (headerImage) {
        return (
            <div className="relative shrink-0">
                <img
                    src={`/storage/${headerImage}`}
                    alt={title}
                    className="w-full object-cover"
                    style={{ maxHeight: '140px' }}
                />
                <div className="absolute inset-0 bg-black/10" />
                {backHref && (
                    <div className="absolute top-3 left-4">
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Link>
                    </div>
                )}
                {children && (
                    <div className="absolute top-3 right-4">{children}</div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
            <div className="relative flex items-center justify-center">
                {backHref && (
                    <div className="absolute left-0">
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Link>
                    </div>
                )}
                <div className="flex flex-col items-center gap-1">
                    {icon
                        ? <img src={icon} alt={title} className="h-14 object-contain" />
                        : <img src="/images/tracker.png" alt="Tracker" className="h-14 object-contain" />
                    }
                    <h1 className="text-2xl text-gray-800 tracking-wide" style={{ fontFamily: 'Conthrax, sans-serif' }}>
                        {title}
                    </h1>
                </div>
                {children && (
                    <div className="absolute right-0">{children}</div>
                )}
            </div>
        </div>
    );
}
