import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/Toast';

import { ALL_MENU_ITEMS, CONTENT_TYPES, SECTIONS, IMAGE_TO_SECTION } from './ContentManager/constants';
import { EmergencyTitleEditor, CustomEmergencyItems } from './ContentManager/Emergency';
import { MandatoryTitleEditor, MandatoryItemsManager } from './ContentManager/MandatoryTasks';
import { FaceSheetManager } from './ContentManager/FaceSheet';
import { AriyaItemsManager, AriyaArtManager } from './ContentManager/AriyaSection';
import { TeamTitleEditor, CustomTeamItems } from './ContentManager/TeamTraining';
import { MedSlotsManager } from './ContentManager/Medication';
import { PageHeadersManager } from './ContentManager/PageHeaders';
import { AriyaTeamManager } from './ContentManager/AriyaTeamSection';

/* ── Helpers ── */

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

/* ── Dashboard Menu ── */

function MenuItemForm({ f, setF, onSubmit, onCancel, submitLabel }) {
    const needsFile = (type) => type === 'image' || type === 'pdf';
    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Label *</label>
                    <TextInput className="w-full mt-0.5" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Menu label" required />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500">Content Type *</label>
                    <select className="w-full mt-0.5 rounded-md border-gray-300 text-sm shadow-sm" value={f.content_type} onChange={(e) => setF({ ...f, content_type: e.target.value })}>
                        {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Icon image (optional)</label>
                    <input type="file" accept="image/*" className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, icon: e.target.files[0] })} />
                </div>
                <div>
                    {(needsFile(f.content_type)) ? (
                        <>
                            <label className="text-xs font-medium text-gray-500">Upload {f.content_type === 'pdf' ? 'PDF' : 'Image'}</label>
                            <input type="file" accept={f.content_type === 'pdf' ? '.pdf' : 'image/*'} className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, content_file: e.target.files[0] })} />
                        </>
                    ) : (
                        <>
                            <label className="text-xs font-medium text-gray-500">{f.content_type === 'video' ? 'Video URL' : 'Link URL'}</label>
                            <TextInput className="w-full mt-0.5" value={f.content_url} onChange={(e) => setF({ ...f, content_url: e.target.value })} placeholder="https://..." />
                        </>
                    )}
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

function CustomMenuItems({ child }) {
    const blank = { label: '', content_type: 'link', content_url: '', content_file: null, icon: null, sort_order: 99, is_active: true };
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const customItems = (child.menu_items || []).filter((i) => i.icon_path);
    const needsFile = (type) => type === 'image' || type === 'pdf';
    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('label', form.label);
        fd.append('content_type', form.content_type);
        fd.append('sort_order', form.sort_order);
        fd.append('is_active', form.is_active ? '1' : '0');
        if (form.icon) fd.append('icon', form.icon);
        if (needsFile(form.content_type) && form.content_file) fd.append('content_file', form.content_file);
        else fd.append('content_url', form.content_url || '');
        router.post(route('children.menu-items.store', child.id), fd, { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('label', editForm.label);
        fd.append('content_type', editForm.content_type);
        fd.append('sort_order', editForm.sort_order);
        fd.append('is_active', editForm.is_active ? '1' : '0');
        fd.append('_method', 'POST');
        if (editForm.icon) fd.append('icon', editForm.icon);
        if (needsFile(editForm.content_type) && editForm.content_file) fd.append('content_file', editForm.content_file);
        else fd.append('content_url', editForm.content_url || '');
        router.post(route('children.menu-items.update', { child: child.id, menuItem: editingId }), fd, { preserveScroll: true, forceFormData: true, onSuccess: () => setEditingId(null) });
    };
    const del = (itemId) => {
        if (!confirm('Delete this custom menu item?')) return;
        router.delete(route('children.menu-items.destroy', { child: child.id, menuItem: itemId }), { preserveScroll: true });
    };
    return (
        <div className="space-y-2">
            {customItems.map((item) => (
                editingId === item.id ? (
                    <MenuItemForm key={item.id} f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" />
                ) : (
                    <div key={item.id} className={`flex items-center gap-3 rounded-lg border p-2.5 ${item.is_active ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        {item.icon_path ? (
                            <img src={`/storage/${item.icon_path}`} className="h-9 w-9 rounded object-contain" />
                        ) : (
                            <div className="h-9 w-9 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>
                        )}
                        <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-500">{item.content_type}</span>
                        <span className="text-xs text-gray-400">#{item.sort_order}</span>
                        <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ label: item.label, content_type: item.content_type, content_url: item.content_value || '', content_file: null, icon: null, sort_order: item.sort_order, is_active: item.is_active }); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => del(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                )
            ))}
            {adding ? (
                <MenuItemForm f={form} setF={setForm} onSubmit={submit} onCancel={() => setAdding(false)} submitLabel="Add" />
            ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Custom Item
                </button>
            )}
        </div>
    );
}

function DashboardMenuPanel({ child }) {
    const toast = useToast();

    // Only show items that have a saved DB record OR have never been saved yet (first load).
    // Items explicitly removed via × stay gone after save — they won't reappear on reload
    // because buildItems only includes them if they exist in child.menu_items.
    const buildItems = (existing) => {
        if (existing.length === 0) {
            return ALL_MENU_ITEMS.map((m) => ({ id: null, image: m.image, label: m.label, icon_path: null, is_active: false, sort_order: 99 }));
        }
        return existing
            .filter((i) => !i.icon_path)
            .map((i) => ({ id: i.id, image: i.image, label: i.label, icon_path: i.icon_path, is_active: i.is_active, sort_order: i.sort_order }));
    };

    // Items from ALL_MENU_ITEMS not currently in the list (available to restore)
    const buildAvailable = (currentImages, existing) =>
        existing.length === 0
            ? []
            : ALL_MENU_ITEMS.filter((m) => !currentImages.includes(m.image));

    const [items, setItems] = useState(() => buildItems(child.menu_items || []));
    const [dirty, setDirty] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);

    useEffect(() => {
        setItems(buildItems(child.menu_items || []));
        setDirty(false);
    }, [child]);

    const available = buildAvailable(items.map(i => i.image), child.menu_items || []);

    const restore = (m) => {
        setItems(prev => [...prev, { image: m.image, label: m.label, is_active: false, sort_order: 99 }]);
        setDirty(true);
    };

    const update = (image, field, value) => {
        setItems(prev => prev.map(i => i.image === image ? { ...i, [field]: value } : i));
        setDirty(true);
    };

    const remove = (image) => {
        if (!confirm('Remove this menu item?')) return;
        setItems(prev => prev.filter(i => i.image !== image));
        setDirty(true);
    };

    const onDragStart = (idx) => setDragIdx(idx);
    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        setItems(prev => {
            const next = [...prev];
            const [moved] = next.splice(dragIdx, 1);
            next.splice(idx, 0, moved);
            return next;
        });
        setDragIdx(idx);
        setDirty(true);
    };
    const onDragEnd = () => setDragIdx(null);

    const save = () => {
        const payload = items.map((m, idx) => ({ image: m.image, label: m.label, href: '#', sort_order: idx, is_active: m.is_active }));
        router.post(route('children.menu-items.sync', child.id), { items: payload }, { preserveScroll: true, onSuccess: () => { setDirty(false); toast('Menu saved.'); } });
    };

    const uploadIcon = (item, file) => {
        if (!item.id || !file) return;
        const fd = new FormData();
        fd.append('icon', file);
        fd.append('label', item.label);
        fd.append('content_type', 'link');
        fd.append('sort_order', item.sort_order);
        fd.append('is_active', item.is_active ? '1' : '0');
        fd.append('_method', 'POST');
        router.post(route('children.menu-items.update', { child: child.id, menuItem: item.id }), fd, { preserveScroll: true, forceFormData: true, onSuccess: () => toast('Icon updated.') });
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preset Items</p>
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.image}
                            draggable
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDragEnd={onDragEnd}
                            className={`rounded-lg border p-2.5 cursor-grab active:cursor-grabbing transition-opacity ${dragIdx === idx ? 'opacity-50' : ''} ${item.is_active ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
                        >
                            <div className="grid grid-cols-[20px_48px_1fr_auto_56px_24px] items-center gap-3">
                                <svg className="h-4 w-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/></svg>
                                {/* Icon preview */}
                                <div className="relative group/icon">
                                    <img
                                        src={item.icon_path ? `/storage/${item.icon_path}` : `/images/dashboard/${item.image}`}
                                        className="h-10 w-10 object-contain rounded"
                                        alt=""
                                    />
                                    {item.id && (
                                        <label className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 group-hover/icon:opacity-100 transition-opacity cursor-pointer" title="Change icon">
                                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadIcon(item, e.target.files[0])} />
                                        </label>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => update(item.image, 'label', e.target.value)}
                                    className="rounded border-gray-300 text-sm shadow-sm w-full"
                                />
                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 whitespace-nowrap">
                                    → {IMAGE_TO_SECTION[item.image] || '—'}
                                </span>
                                <div className="flex justify-center">
                                    <button type="button" onClick={() => update(item.image, 'is_active', !item.is_active)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <button type="button" onClick={() => remove(item.image)} className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors" title="Remove">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                            {!item.id && (
                                <p className="mt-1.5 ml-[68px] text-[10px] text-amber-600">Save preset items first to enable icon upload.</p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-end gap-3">
                    {dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
                    <PrimaryButton onClick={save}>Save Preset Items</PrimaryButton>
                </div>
                {available.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400">Removed:</span>
                        {available.map((m) => (
                            <button key={m.image} type="button" onClick={() => restore(m)} className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                                <img src={`/images/dashboard/${m.image}`} className="h-4 w-4 object-contain" alt="" />
                                {m.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Custom Items</p>
                <CustomMenuItems child={child} />
            </div>
        </div>
    );
}

/* ── Section Panel ── */

function SectionPanel({ sectionKey, child, scheduleUsers }) {
    const wrap = (content) => (
        <div className="flex-1 overflow-y-auto p-6">{content}</div>
    );
    switch (sectionKey) {
        case 'dashboard-menu':
            return <div className="flex-1 overflow-y-auto p-6"><DashboardMenuPanel child={child} /></div>;
        case 'emergency':
            return wrap(<><EmergencyTitleEditor child={child} /><div className="border-t my-4" /><CustomEmergencyItems child={child} /></>);
        case 'mandatory-tasks':
            return wrap(<><MandatoryTitleEditor child={child} /><div className="border-t my-4" /><MandatoryItemsManager child={child} /></>);
        case 'face-sheet':
            return wrap(<FaceSheetManager child={child} />);
        case 'ariya-tube':
            return wrap(<AriyaItemsManager child={child} type="status" />);
        case 'ariya-art':
            return wrap(<AriyaArtManager child={child} />);
        case 'sleep':
            return wrap(<AriyaItemsManager child={child} type="sleep" />);
        case 'team-training':
            return wrap(<><TeamTitleEditor child={child} /><div className="border-t my-4" /><CustomTeamItems child={child} /></>);
        case 'medication':
            return wrap(<MedSlotsManager child={child} />);
        case 'page-headers':
            return wrap(<PageHeadersManager child={child} />);
        case 'ariya-team':
            return <div className="flex-1 overflow-hidden flex flex-col"><AriyaTeamManager child={child} users={scheduleUsers} /></div>;
        default:
            return wrap(<p className="text-sm text-gray-400">Select a section.</p>);
    }
}

/* ── Main Page ── */

export default function ContentManager({ children = [], scheduleUsers = [] }) {
    const [selectedChild, setSelectedChild] = useState(children[0] ?? null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [search, setSearch] = useState('');
    const filteredChildren = search.trim()
        ? children.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : children;

    useEffect(() => {
        if (!selectedChild) return;
        const fresh = children.find(c => c.id === selectedChild.id);
        if (fresh) setSelectedChild(fresh);
    }, [children]);

    if (selectedChild && selectedSection === 'ariya-team') {
        return (
            <AuthenticatedLayout>
                <Head title="Ariya Team Schedule" />
                <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shrink-0">
                        <button
                            type="button"
                            onClick={() => setSelectedSection(null)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                            Back
                        </button>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm font-semibold text-gray-700">{selectedChild.name}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm text-gray-500">Ariya Team Schedule</span>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <AriyaTeamManager child={selectedChild} users={scheduleUsers} />
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Content Manager" />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">

                {/* Panel 1: Children */}
                <div className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
                    <div className="px-3 py-3 border-b border-gray-100 shrink-0 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Children</p>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="w-full rounded-md border-gray-300 text-xs shadow-sm placeholder-gray-400 py-1.5"
                        />
                    </div>
                    <div className="flex-1 py-2">
                        {filteredChildren.map((c) => {
                            const photo = normalizePhoto(c.photo);
                            const active = selectedChild?.id === c.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => { setSelectedChild(c); setSelectedSection(null); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${active ? 'bg-indigo-50 border-r-2 border-indigo-500' : 'hover:bg-gray-50'}`}
                                >
                                    {photo ? (
                                        <img src={photo} alt={c.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {c.name[0].toUpperCase()}
                                        </div>
                                    )}
                                    <p className={`text-sm font-medium truncate ${active ? 'text-indigo-700' : 'text-gray-800'}`}>{c.name}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Panel 2: Sections */}
                {selectedChild && (
                    <div className="w-48 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
                        <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sections</p>
                        </div>
                        <div className="flex-1 py-2">
                            {SECTIONS.map((s) => {
                                const active = selectedSection === s.key;
                                return (
                                    <button
                                        key={s.key}
                                        onClick={() => setSelectedSection(s.key)}
                                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${active ? 'bg-white border-r-2 border-indigo-500' : 'hover:bg-white/60'}`}
                                    >
                                        {s.image ? (
                                            <img src={`/images/dashboard/${s.image}`} alt={s.label} className="h-6 w-6 object-contain shrink-0" />
                                        ) : (
                                            <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center shrink-0">
                                                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                                            </div>
                                        )}
                                        <span className={`text-sm font-medium truncate ${active ? 'text-indigo-700' : 'text-gray-700'}`}>{s.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Panel 3: Content */}
                {selectedChild && selectedSection ? (
                    <SectionPanel
                        key={`${selectedChild.id}-${selectedSection}`}
                        sectionKey={selectedSection}
                        child={selectedChild}
                        scheduleUsers={scheduleUsers}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-400">
                            {!selectedChild ? 'Select a child to get started.' : 'Select a section to manage content.'}
                        </p>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
