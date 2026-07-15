import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

function initials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-blue-600',
];

function getGradient(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[h];
}

function ChildSelector({ assignedChildren }) {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center justify-start pt-16 px-6 pb-12">

            <div className="mb-10 text-center">
                <p className="text-lg font-semibold text-gray-700">Select a child to get started</p>
            </div>

            {assignedChildren.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No child assigned yet</p>
                    <p className="text-sm text-gray-400">Contact your administrator to get access.</p>
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-5 max-w-3xl">
                    {assignedChildren.map((child) => {
                        const src = normalizePhoto(child.photo);
                        const grad = getGradient(child.name);
                        return (
                            <a
                                key={child.id}
                                href={route('children.show', child.id)}
                                className="group flex flex-col items-center gap-3 rounded-2xl bg-white border border-gray-200 px-6 py-6 w-40 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                            >
                                <div className="relative">
                                    {src ? (
                                        <img src={src} alt={child.name} className="h-20 w-20 rounded-xl object-cover shadow-sm ring-2 ring-white group-hover:ring-indigo-100 transition-all" />
                                    ) : (
                                        <div className={`flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-2xl font-black text-white shadow-sm`}>
                                            {initials(child.name)}
                                        </div>
                                    )}
                                    <span className="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full border-2 border-white bg-emerald-400"/>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 text-center leading-tight w-full group-hover:text-indigo-700 transition-colors">
                                    {child.name}
                                </span>
                                <span className="text-[11px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
                                    Open →
                                </span>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ assignedChildren = [], isSuperadmin = false }) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            {isSuperadmin ? (
                <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-gray-800">Welcome, {user.name}</p>
                    <p className="text-sm text-gray-400 mt-2">Select a menu item from the sidebar.</p>
                </div>
            ) : (
                <ChildSelector assignedChildren={assignedChildren} />
            )}
        </AuthenticatedLayout>
    );
}
