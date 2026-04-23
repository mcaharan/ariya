import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';

function normalizeStorage(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith('/storage/')) return path;
    if (path.startsWith('storage/')) return '/' + path;
    return '/storage/' + path;
}

export default function Ariya({ child, type, title, items = [], headerImage = null }) {
    return (
        <AuthenticatedLayout>
            <Head title={`${title} — ${child.name}`} />

            <div className="min-h-[calc(100vh-64px)] bg-gray-100">

                <PageHeader
                    headerImage={headerImage}
                    backHref={route('children.show', child.id)}
                    title={title}
                />

                {/* Icon grid */}
                <div className="px-8 py-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <svg className="h-16 w-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <p className="text-sm">No items yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-5">
                            {items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route('children.ariya.gallery', { child: child.id, ariyaItem: item.id })}
                                    className="group flex flex-col items-center justify-center cursor-pointer"
                                    style={{ width: 'calc(18% - 18px)' }}
                                >
                                    <img
                                        src={normalizeStorage(item.icon_path)}
                                        alt={item.title}
                                        className="w-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                                    />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
