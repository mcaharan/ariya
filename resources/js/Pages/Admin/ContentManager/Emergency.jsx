import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/Toast';
import { EMERGENCY_CONTENT_TYPES } from './constants';

function EmergencyItemForm({ f, setF, onSubmit, onCancel, submitLabel }) {
    const needsFile = (type) => type === 'image' || type === 'pdf';
    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-red-200 bg-red-50 p-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Title *</label>
                    <TextInput className="w-full mt-0.5" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Popup title" required />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500">Icon image {submitLabel === 'Add' ? '*' : '(replace)'}</label>
                    <input type="file" accept="image/*" className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, icon: e.target.files[0] })} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Content Type *</label>
                    <select className="w-full mt-0.5 rounded-md border-gray-300 text-sm shadow-sm" value={f.content_type} onChange={(e) => setF({ ...f, content_type: e.target.value })}>
                        {EMERGENCY_CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    {needsFile(f.content_type) ? (
                        <>
                            <label className="text-xs font-medium text-gray-500">Upload {f.content_type === 'pdf' ? 'PDF' : 'Image'}</label>
                            <input type="file" accept={f.content_type === 'pdf' ? '.pdf' : 'image/*'} className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, content_file: e.target.files[0] })} />
                        </>
                    ) : f.content_type === 'text' ? (
                        <div className="opacity-0 pointer-events-none" />
                    ) : (
                        <>
                            <label className="text-xs font-medium text-gray-500">{f.content_type === 'video' ? 'Video URL' : 'Link URL'}</label>
                            <TextInput className="w-full mt-0.5" value={f.content_url} onChange={(e) => setF({ ...f, content_url: e.target.value })} placeholder="https://..." />
                        </>
                    )}
                </div>
            </div>
            {f.content_type === 'text' && (
                <div>
                    <label className="text-xs font-medium text-gray-500">Text Content</label>
                    <textarea className="w-full mt-0.5 rounded-md border-gray-300 shadow-sm text-sm" rows={3} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="Popup content text" />
                </div>
            )}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Sort Order</label>
                    <input type="number" min="0" className="w-16 rounded border-gray-300 text-center text-sm shadow-sm" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Active</label>
                    <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${f.is_active ? 'bg-red-500' : 'bg-gray-300'}`}>
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

export function EmergencyTitleEditor({ child }) {
    const toast = useToast();
    const [title, setTitle] = useState(child.emergency_title || 'Emergency');
    useEffect(() => setTitle(child.emergency_title || 'Emergency'), [child]);
    const save = () => router.post(route('children.emergency-title', child.id), { emergency_title: title }, { preserveScroll: true, onSuccess: () => toast('Title saved.') });
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Emergency" />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

export function CustomEmergencyItems({ child }) {
    const toast = useToast();
    const blank = { title: '', content: '', content_type: 'text', content_url: '', content_file: null, icon: null, sort_order: 99, is_active: true };
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const customItems = (child.emergency_items || []).filter((i) => i.icon_path);
    const needsFile = (type) => type === 'image' || type === 'pdf';
    const buildFd = (f) => {
        const fd = new FormData();
        fd.append('title', f.title);
        fd.append('content', f.content || '');
        fd.append('content_type', f.content_type);
        fd.append('sort_order', f.sort_order);
        fd.append('is_active', f.is_active ? '1' : '0');
        if (f.icon) fd.append('icon', f.icon);
        if (needsFile(f.content_type) && f.content_file) fd.append('content_file', f.content_file);
        else fd.append('content_url', f.content_url || '');
        return fd;
    };
    const submit = (e) => {
        e.preventDefault();
        router.post(route('children.emergency-items.store', child.id), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); toast('Item added.'); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.emergency-items.update', { child: child.id, emergencyItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => { setEditingId(null); toast('Item updated.'); } });
    };
    const del = (itemId) => {
        if (!confirm('Delete this emergency item?')) return;
        router.delete(route('children.emergency-items.destroy', { child: child.id, emergencyItem: itemId }), { preserveScroll: true, onSuccess: () => toast('Item deleted.') });
    };
    return (
        <div className="space-y-2">
            {customItems.map((item) => (
                editingId === item.id ? (
                    <EmergencyItemForm key={item.id} f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" />
                ) : (
                    <div key={item.id} className={`flex items-center gap-3 rounded-lg border p-2.5 ${item.is_active ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <img src={`/storage/${item.icon_path}`} className="h-9 w-9 rounded object-contain" />
                        <span className="flex-1 text-sm font-medium text-gray-700">{item.title}</span>
                        <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-500">{item.content_type || 'text'}</span>
                        <span className="text-xs text-gray-400">#{item.sort_order}</span>
                        <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ title: item.title, content: item.content || '', content_type: item.content_type || 'text', content_url: item.content_value || '', content_file: null, icon: null, sort_order: item.sort_order, is_active: item.is_active }); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => del(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                )
            ))}
            {adding ? (
                <EmergencyItemForm f={form} setF={setForm} onSubmit={submit} onCancel={() => setAdding(false)} submitLabel="Add" />
            ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-red-200 py-3 text-sm text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Custom Emergency Item
                </button>
            )}
        </div>
    );
}
