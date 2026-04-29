import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/Toast';

export function MandatoryTitleEditor({ child }) {
    const toast = useToast();
    const [title, setTitle] = useState(child.mandatory_title || 'Mandatory Tasks');
    useEffect(() => setTitle(child.mandatory_title || 'Mandatory Tasks'), [child]);
    const save = () => router.post(route('children.mandatory-title', child.id), { mandatory_title: title }, { preserveScroll: true, onSuccess: () => toast('Title saved.') });
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mandatory Tasks" />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

function MandatoryItemForm({ f, setF, onSubmit, onCancel, submitLabel }) {
    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Image {submitLabel === 'Add' ? '*' : '(replace)'}</label>
                    <input type="file" accept="image/*" className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, image: e.target.files[0] })} required={submitLabel === 'Add'} />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500">Caption (optional)</label>
                    <TextInput className="w-full mt-0.5" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Image caption" />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Sort Order</label>
                    <input type="number" min="0" className="w-16 rounded border-gray-300 text-center text-sm shadow-sm" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Active</label>
                    <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${f.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
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

export function MandatoryItemsManager({ child }) {
    const toast = useToast();
    const blank = { image: null, title: '', sort_order: 0, is_active: true };
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const items = (child.mandatory_items || []);
    const buildFd = (f) => {
        const fd = new FormData();
        if (f.image) fd.append('image', f.image);
        fd.append('title', f.title || '');
        fd.append('sort_order', f.sort_order);
        fd.append('is_active', f.is_active ? '1' : '0');
        return fd;
    };
    const submit = (e) => {
        e.preventDefault();
        router.post(route('children.mandatory-items.store', child.id), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); toast('Image added.'); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.mandatory-items.update', { child: child.id, mandatoryItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => { setEditingId(null); toast('Image updated.'); } });
    };
    const del = (id) => {
        if (!confirm('Delete this image?')) return;
        router.delete(route('children.mandatory-items.destroy', { child: child.id, mandatoryItem: id }), { preserveScroll: true, onSuccess: () => toast('Image deleted.') });
    };
    return (
        <div className="space-y-3">
            {items.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {items.map((item) => (
                        editingId === item.id ? (
                            <div key={item.id} className="col-span-3">
                                <MandatoryItemForm f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" />
                            </div>
                        ) : (
                            <div key={item.id} className={`relative rounded-lg overflow-hidden border-2 ${item.is_active ? 'border-indigo-300' : 'border-gray-200 opacity-50'}`}>
                                <img src={`/storage/${item.image}`} alt={item.title || ''} className="w-full h-28 object-cover" />
                                {item.title && <div className="px-2 py-1 bg-white text-xs text-gray-600 truncate">{item.title}</div>}
                                <div className="absolute top-1 right-1 flex gap-1">
                                    <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ image: null, title: item.title || '', sort_order: item.sort_order, is_active: item.is_active }); }} className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-indigo-600 shadow hover:bg-white">Edit</button>
                                    <button type="button" onClick={() => del(item.id)} className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-red-500 shadow hover:bg-white">Del</button>
                                </div>
                                <div className="absolute top-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">#{item.sort_order}</div>
                            </div>
                        )
                    ))}
                </div>
            )}
            {adding ? (
                <MandatoryItemForm f={form} setF={setForm} onSubmit={submit} onCancel={() => setAdding(false)} submitLabel="Add" />
            ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-200 py-3 text-sm text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Upload Image
                </button>
            )}
        </div>
    );
}
