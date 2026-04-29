import { router } from '@inertiajs/react';
import { PAGE_HEADER_SLOTS } from './constants';

export function PageHeadersManager({ child }) {
    const headers = (child.page_headers || []);
    const getHeader = (key) => headers.find((h) => h.page_key === key);
    const upload = (key, file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('page_key', key);
        fd.append('header_image', file);
        router.post(route('children.page-headers.update', child.id), fd, { forceFormData: true, preserveScroll: true });
    };
    const remove = (key) => {
        if (!confirm('Remove this header image?')) return;
        router.delete(route('children.page-headers.destroy', { child: child.id, pageKey: key }), { preserveScroll: true });
    };
    return (
        <div className="space-y-3">
            {PAGE_HEADER_SLOTS.map(({ key, label }) => {
                const existing = getHeader(key);
                return (
                    <div key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                        <div className="shrink-0 w-24 h-14 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                            {existing?.header_image ? (
                                <img src={`/storage/${existing.header_image}`} alt={label} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-gray-400">No image</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{label}</p>
                            <input type="file" accept="image/*" className="mt-1 block w-full text-xs text-gray-500" onChange={(e) => upload(key, e.target.files[0])} />
                        </div>
                        {existing?.header_image && (
                            <button type="button" onClick={() => remove(key)} className="shrink-0 text-xs text-red-500 hover:text-red-700">Remove</button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
