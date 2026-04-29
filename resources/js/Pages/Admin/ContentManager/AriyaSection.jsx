import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/Toast';

function AriyaImageRow({ childId, item }) {
    const [mode, setMode] = useState(null);
    const [imgFile, setImgFile] = useState(null);
    const [caption, setCaption] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const del = (imgId) => router.delete(route('children.ariya-images.destroy', { child: childId, ariyaItem: item.id, ariyaImage: imgId }), { preserveScroll: true });
    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        if (mode === 'image' && imgFile) fd.append('image', imgFile);
        if (mode === 'video') fd.append('video_url', videoUrl);
        fd.append('caption', caption);
        router.post(route('children.ariya-images.store', { child: childId, ariyaItem: item.id }), fd, { forceFormData: true, preserveScroll: true, onSuccess: () => { setMode(null); setImgFile(null); setCaption(''); setVideoUrl(''); } });
    };
    return (
        <div className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
            {(item.images || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {(item.images || []).map((img) => (
                        <div key={img.id} className="relative rounded overflow-hidden bg-gray-100">
                            {img.video_url ? (
                                <div className="flex items-center justify-center h-16 bg-black/10">
                                    <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                            ) : (
                                <img src={`/storage/${img.image}`} alt={img.caption || ''} className="w-full h-16 object-cover" />
                            )}
                            <button type="button" onClick={() => del(img.id)} className="absolute top-0.5 right-0.5 rounded bg-red-600/80 px-1 py-0.5 text-white text-xs hover:bg-red-700">×</button>
                        </div>
                    ))}
                </div>
            )}
            {mode ? (
                <form onSubmit={submit} className="space-y-2">
                    {mode === 'image' ? (
                        <input type="file" accept="image/*" className="block w-full text-xs" onChange={(e) => setImgFile(e.target.files[0])} />
                    ) : (
                        <TextInput className="w-full text-xs" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube URL or direct video URL" />
                    )}
                    <div className="flex items-center gap-2">
                        <TextInput className="flex-1 text-xs" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" />
                        <PrimaryButton>Add</PrimaryButton>
                        <button type="button" onClick={() => setMode(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                </form>
            ) : (
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setMode('image')} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Add image
                    </button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={() => setMode('video')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Add video URL
                    </button>
                </div>
            )}
        </div>
    );
}

function AriyaItemForm({ f, setF, onSubmit, onCancel, submitLabel }) {
    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-teal-200 bg-teal-50 p-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Title *</label>
                    <TextInput className="w-full mt-0.5" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Item title" required />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500">Icon image *</label>
                    <input type="file" accept="image/*" className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, icon: e.target.files[0] })} />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Sort</label>
                    <input type="number" min="0" className="w-16 rounded border-gray-300 text-center text-sm shadow-sm" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Active</label>
                    <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${f.is_active ? 'bg-teal-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${f.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                <div className="flex-1" />
                <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                <PrimaryButton>{submitLabel}</PrimaryButton>
            </div>
        </form>
    );
}

export function AriyaItemsManager({ child, type }) {
    const blank = { title: '', icon: null, sort_order: 0, is_active: true };
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const items = (child.ariya_items || []).filter((i) => i.type === type);
    const buildFd = (f) => {
        const fd = new FormData();
        fd.append('title', f.title);
        if (f.icon) fd.append('icon', f.icon);
        fd.append('sort_order', f.sort_order);
        fd.append('is_active', f.is_active ? '1' : '0');
        return fd;
    };
    const submit = (e) => {
        e.preventDefault();
        router.post(route('children.ariya-items.store', { child: child.id, type }), buildFd(form), { forceFormData: true, preserveScroll: true, onSuccess: () => { setAdding(false); setForm(blank); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.ariya-items.update', { child: child.id, ariyaItem: editingId }), buildFd(editForm), { forceFormData: true, preserveScroll: true, onSuccess: () => setEditingId(null) });
    };
    const del = (id) => {
        if (!confirm('Delete this item?')) return;
        router.delete(route('children.ariya-items.destroy', { child: child.id, ariyaItem: id }), { preserveScroll: true });
    };
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.id}>
                    {editingId === item.id ? (
                        <AriyaItemForm f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" />
                    ) : (
                        <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${item.is_active ? 'border-teal-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                            {item.icon_path && <img src={`/storage/${item.icon_path}`} alt={item.title} className="h-10 w-10 object-contain rounded" />}
                            <span className="flex-1 text-sm font-medium text-gray-700">{item.title}</span>
                            <span className="text-xs text-gray-400">#{item.sort_order}</span>
                            <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="text-xs text-indigo-500 hover:text-indigo-700">
                                {expandedId === item.id ? 'Hide images' : `Images (${(item.images || []).length})`}
                            </button>
                            <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ title: item.title, icon: null, sort_order: item.sort_order, is_active: item.is_active }); }} className="text-xs text-indigo-600 hover:text-indigo-800">Edit</button>
                            <button type="button" onClick={() => del(item.id)} className="text-xs text-red-500 hover:text-red-700">Del</button>
                        </div>
                    )}
                    {expandedId === item.id && editingId !== item.id && <AriyaImageRow childId={child.id} item={item} />}
                </div>
            ))}
            {adding ? (
                <AriyaItemForm f={form} setF={setForm} onSubmit={submit} onCancel={() => setAdding(false)} submitLabel="Add Item" />
            ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-teal-200 py-3 text-sm text-teal-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Menu Item
                </button>
            )}
        </div>
    );
}

export function AriyaArtManager({ child }) {
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState('');
    const inputRef = useRef(null);
    const section = 'ariya-art';
    const items = (child.gallery_items || []).filter((i) => i.section === section);
    const submit = (e) => {
        e.preventDefault();
        if (!file) return;
        const fd = new FormData();
        fd.append('image', file);
        fd.append('title', caption);
        router.post(route('children.gallery.store', { child: child.id, section }), fd, { forceFormData: true, preserveScroll: true, onSuccess: () => { setFile(null); setCaption(''); if (inputRef.current) inputRef.current.value = ''; } });
    };
    const del = (id) => {
        if (!confirm('Delete this image?')) return;
        router.delete(route('children.gallery.destroy', { child: child.id, section, galleryItem: id }), { preserveScroll: true });
    };
    return (
        <div className="space-y-4">
            {items.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {items.map((item) => (
                        <div key={item.id} className="relative rounded-lg overflow-hidden border-2 border-purple-200">
                            <img src={`/storage/${item.image}`} alt={item.title || ''} className="w-full h-28 object-cover" />
                            {item.title && <div className="px-2 py-1 bg-white text-xs text-gray-600 truncate">{item.title}</div>}
                            <button type="button" onClick={() => del(item.id)} className="absolute top-1 right-1 rounded bg-white/90 px-1.5 py-0.5 text-xs text-red-500 shadow hover:bg-white">Del</button>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={submit} className="flex items-center gap-3 rounded-lg border border-dashed border-purple-200 bg-purple-50 p-3">
                <input ref={inputRef} type="file" accept="image/*" className="flex-1 text-xs" onChange={(e) => setFile(e.target.files[0] || null)} />
                <TextInput className="w-32" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" />
                <PrimaryButton disabled={!file}>Upload</PrimaryButton>
            </form>
        </div>
    );
}
