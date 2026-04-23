import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ assignedChildren = [], isSuperadmin = false }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {isSuperadmin ? (
                                <div>Welcome Superadmin. Use the left menu to manage users and children.</div>
                            ) : (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Choose Child</h3>

                                    {assignedChildren.length === 0 ? (
                                        <p className="text-gray-600">No child is assigned to your account yet.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-4">
                                            {assignedChildren.map((child) => {
                                                let src = null;
                                                if (child.photo) {
                                                    src = child.photo;
                                                    if (!/^https?:\/\//.test(src)) {
                                                        if (src.startsWith('/storage/')) {
                                                            // ok
                                                        } else if (src.startsWith('storage/')) {
                                                            src = '/' + src;
                                                        } else if (src.startsWith('/')) {
                                                            src = '/storage' + src;
                                                        } else {
                                                            src = '/storage/' + src;
                                                        }
                                                    }
                                                }
                                                return (
                                                    <a
                                                        key={child.id}
                                                        href={route('children.show', child.id)}
                                                        className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 w-28 hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all"
                                                    >
                                                        {src ? (
                                                            <img src={src} alt={child.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow" />
                                                        ) : (
                                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xl font-bold text-white shadow">
                                                                {child.name.slice(0, 1).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-medium text-gray-700 text-center leading-tight truncate w-full text-center">{child.name}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
