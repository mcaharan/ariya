import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

/* ── Constants ── */

const ALL_MENU_ITEMS = [
    { image: 'emg.png',        label: 'Emergency' },
    { image: 'mt-m.png',       label: 'Mandatory Tasks' },
    { image: 'f-c.png',        label: 'Face Sheet' },
    { image: 'at.png',         label: 'Ariya Status' },
    { image: 'arts.png',       label: 'Ariya Behavior' },
    { image: 'm.png',          label: 'Medication' },
    { image: 'sleep.png',      label: 'Sleep' },
    { image: 't.png',          label: 'Task' },
    { image: 'team.png',       label: 'Team' },
];

const CONTENT_TYPES = [
    { value: 'link',  label: 'Link (URL)' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
];

const EMERGENCY_CONTENT_TYPES = [
    { value: 'text',  label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
    { value: 'video', label: 'Video URL' },
    { value: 'link',  label: 'Link URL' },
];

const TEAM_CONTENT_TYPES = [
    { value: 'text',  label: 'Text' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
    { value: 'video', label: 'Video URL' },
    { value: 'link',  label: 'Link URL' },
    { value: 'quiz',  label: 'Quiz' },
    { value: 'map',   label: 'Map to Menu' },
];

const SCHED_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SCHED_DAY_HDR = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEK_DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TEAM_GREEN = '#1a9e6b';

const PAGE_HEADER_SLOTS = [
    { key: 'emergency',       label: 'Emergency' },
    { key: 'mandatory-tasks', label: 'Mandatory Tasks' },
    { key: 'medication',      label: 'Medication' },
    { key: 'team-training',   label: 'Team Training' },
    { key: 'ariya-status',    label: 'Ariya Tube' },
    { key: 'ariya-behavior',  label: 'Ariya Art' },
];

const SECTIONS = [
    { key: 'dashboard-menu',  label: 'Dashboard Menu',  image: null },
    { key: 'emergency',       label: 'Emergency',        image: 'emg.png' },
    { key: 'mandatory-tasks', label: 'Mandatory Tasks',  image: 'mt-m.png' },
    { key: 'face-sheet',      label: 'Face Sheet',       image: 'f-c.png' },
    { key: 'ariya-tube',      label: 'Ariya Tube',       image: 'at.png' },
    { key: 'ariya-art',       label: 'Ariya Art',        image: 'arts.png' },
    { key: 'sleep',           label: 'Sleep',            image: 'sleep.png' },
    { key: 'team-training',   label: 'Team Training',    image: 't.png' },
    { key: 'medication',      label: 'Medication',       image: 'm.png' },
    { key: 'page-headers',    label: 'Page Headers',     image: null },
];

/* ── Helpers ── */

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

function fmt12(t) {
    const [h, m] = t.split(':').map(Number);
    const p = h < 12 ? 'am' : 'pm';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${p}`;
}

function calcDur(s, e) {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let diff = toMin(e) - toMin(s);
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60), m = diff % 60;
    return m === 0 ? `${h} hrs` : `${h} hrs ${m} mins`;
}

function getDayAbbr(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return WEEK_DAY_ABBR[d.getDay()];
}

/* ── Quiz Editor ── */

function QuizEditor({ value, onChange }) {
    const parse = (v) => {
        try { const q = JSON.parse(v); return Array.isArray(q) ? q : []; } catch { return []; }
    };
    const [questions, setQuestions] = useState(() => parse(value));
    const update = (qs) => { setQuestions(qs); onChange(JSON.stringify(qs)); };
    const addQ = () => update([...questions, { question: '', options: ['', ''], correct: 0 }]);
    const removeQ = (i) => update(questions.filter((_, idx) => idx !== i));
    const updateQ = (i, field, val) => update(questions.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
    const addOption = (i) => update(questions.map((q, idx) => idx === i ? { ...q, options: [...q.options, ''] } : q));
    const removeOption = (qi, oi) => update(questions.map((q, idx) => {
        if (idx !== qi) return q;
        const opts = q.options.filter((_, i) => i !== oi);
        return { ...q, options: opts, correct: Math.min(q.correct, opts.length - 1) };
    }));
    const updateOption = (qi, oi, val) => update(questions.map((q, idx) => {
        if (idx !== qi) return q;
        return { ...q, options: q.options.map((o, i) => i === oi ? val : o) };
    }));
    return (
        <div className="space-y-2">
            {questions.map((q, qi) => (
                <div key={qi} className="rounded border border-blue-200 bg-white p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 shrink-0">Q{qi + 1}</span>
                        <input className="flex-1 rounded border-gray-300 text-sm shadow-sm" value={q.question} onChange={(e) => updateQ(qi, 'question', e.target.value)} placeholder="Question text" />
                        <button type="button" onClick={() => removeQ(qi)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                    </div>
                    <div className="space-y-1 pl-5">
                        {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                                <input type="radio" name={`correct_${qi}`} checked={q.correct === oi} onChange={() => updateQ(qi, 'correct', oi)} title="Mark correct" className="accent-green-500" />
                                <input className="flex-1 rounded border-gray-300 text-xs shadow-sm" value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                                {q.options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(qi, oi)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addOption(qi)} className="text-xs text-blue-500 hover:text-blue-700">+ Add option</button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addQ} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Add Question
            </button>
        </div>
    );
}

/* ── Menu Item Form ── */

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
                    {needsFile(f.content_type) ? (
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
    const del = (itemId) => router.delete(route('children.menu-items.destroy', { child: child.id, menuItem: itemId }), { preserveScroll: true });
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

/* ── Emergency ── */

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

function EmergencyTitleEditor({ child }) {
    const [title, setTitle] = useState(child.emergency_title || 'Emergency');
    useEffect(() => setTitle(child.emergency_title || 'Emergency'), [child]);
    const save = () => router.post(route('children.emergency-title', child.id), { emergency_title: title }, { preserveScroll: true });
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Emergency" />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

function CustomEmergencyItems({ child }) {
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
        router.post(route('children.emergency-items.store', child.id), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.emergency-items.update', { child: child.id, emergencyItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => setEditingId(null) });
    };
    const del = (itemId) => router.delete(route('children.emergency-items.destroy', { child: child.id, emergencyItem: itemId }), { preserveScroll: true });
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

/* ── Mandatory Tasks ── */

function MandatoryTitleEditor({ child }) {
    const [title, setTitle] = useState(child.mandatory_title || 'Mandatory Tasks');
    useEffect(() => setTitle(child.mandatory_title || 'Mandatory Tasks'), [child]);
    const save = () => router.post(route('children.mandatory-title', child.id), { mandatory_title: title }, { preserveScroll: true });
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

function MandatoryItemsManager({ child }) {
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
        router.post(route('children.mandatory-items.store', child.id), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.mandatory-items.update', { child: child.id, mandatoryItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => setEditingId(null) });
    };
    const del = (id) => router.delete(route('children.mandatory-items.destroy', { child: child.id, mandatoryItem: id }), { preserveScroll: true });
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

/* ── Face Sheet ── */

function FaceSheetManager({ child }) {
    const [file, setFile] = useState(null);
    const inputRef = useRef(null);
    const hasPdf = !!child.face_sheet_pdf;
    const upload = () => {
        if (!file) return;
        const fd = new FormData();
        fd.append('pdf', file);
        router.post(route('children.face-sheet', child.id), fd, { forceFormData: true, preserveScroll: true, onSuccess: () => { setFile(null); if (inputRef.current) inputRef.current.value = ''; } });
    };
    const remove = () => {
        if (!confirm('Remove the current face sheet PDF?')) return;
        router.delete(route('children.face-sheet.destroy', child.id), { preserveScroll: true });
    };
    return (
        <div className="space-y-4">
            {hasPdf && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">PDF uploaded</p>
                        <a href={`/storage/${child.face_sheet_pdf}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline truncate block">View current PDF</a>
                    </div>
                    <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Remove</button>
                </div>
            )}
            <div className="flex items-center gap-3">
                <input ref={inputRef} type="file" accept=".pdf" className="flex-1 text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" onChange={(e) => setFile(e.target.files[0] || null)} />
                <PrimaryButton onClick={upload} disabled={!file}>{hasPdf ? 'Replace' : 'Upload'}</PrimaryButton>
            </div>
        </div>
    );
}

/* ── Ariya Items ── */

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

function AriyaItemsManager({ child, type }) {
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
    const del = (id) => router.delete(route('children.ariya-items.destroy', { child: child.id, ariyaItem: id }), { preserveScroll: true });
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

function AriyaArtManager({ child }) {
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
    const del = (id) => router.delete(route('children.gallery.destroy', { child: child.id, section, galleryItem: id }), { preserveScroll: true });
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

/* ── Team Training ── */

function TeamTitleEditor({ child }) {
    const [title, setTitle] = useState(child.team_title || 'Team Training');
    useEffect(() => setTitle(child.team_title || 'Team Training'), [child]);
    const save = () => router.post(route('children.team-title', child.id), { team_title: title }, { preserveScroll: true });
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team Training" />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

function TeamItemForm({ f, setF, onSubmit, onCancel, submitLabel, teamItems = [] }) {
    const needsFile = (type) => type === 'image' || type === 'pdf';
    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
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
            <div>
                <label className="text-xs font-medium text-gray-500">Page Header Image <span className="font-normal text-gray-400">(shown at top of quiz/inner page)</span></label>
                <input type="file" accept="image/*" className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, header_image: e.target.files[0] })} />
                {f.existing_header && (
                    <div className="mt-1 flex items-center gap-2">
                        <img src={`/storage/${f.existing_header}`} alt="header" className="h-8 rounded object-contain border border-gray-200" />
                        <span className="text-xs text-gray-400">Current header</span>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Content Type *</label>
                    <select className="w-full mt-0.5 rounded-md border-gray-300 text-sm shadow-sm" value={f.content_type} onChange={(e) => setF({ ...f, content_type: e.target.value, content_url: '' })}>
                        {TEAM_CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    {needsFile(f.content_type) ? (
                        <>
                            <label className="text-xs font-medium text-gray-500">Upload {f.content_type === 'pdf' ? 'PDF' : 'Image'}</label>
                            <input type="file" accept={f.content_type === 'pdf' ? '.pdf' : 'image/*'} className="mt-0.5 block w-full text-xs" onChange={(e) => setF({ ...f, content_file: e.target.files[0] })} />
                        </>
                    ) : f.content_type === 'text' || f.content_type === 'quiz' ? (
                        <div className="opacity-0 pointer-events-none" />
                    ) : f.content_type === 'map' ? (
                        <>
                            <label className="text-xs font-medium text-gray-500">Map to Menu *</label>
                            <select className="w-full mt-0.5 rounded-md border-gray-300 text-sm shadow-sm" value={f.content_url} onChange={(e) => setF({ ...f, content_url: e.target.value })} required>
                                <option value="">— select menu —</option>
                                {teamItems.map((ti) => <option key={ti.id} value={ti.id}>{ti.title}</option>)}
                            </select>
                        </>
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
            {f.content_type === 'quiz' && (
                <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Quiz Questions <span className="text-gray-400 font-normal">(radio = correct answer)</span></label>
                    <QuizEditor value={f.content_url} onChange={(json) => setF({ ...f, content_url: json })} />
                </div>
            )}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Sort Order</label>
                    <input type="number" min="0" className="w-16 rounded border-gray-300 text-center text-sm shadow-sm" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Active</label>
                    <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${f.is_active ? 'bg-blue-500' : 'bg-gray-300'}`}>
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

function TeamSubItemsManager({ child, teamItem }) {
    const blank = { title: '', content: '', content_type: 'text', content_url: '', content_file: null, icon: null, header_image: null, existing_header: null, sort_order: 99, is_active: true };
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const subItems = teamItem.sub_items || [];
    const needsFile = (type) => type === 'image' || type === 'pdf';
    const buildFd = (f) => {
        const fd = new FormData();
        fd.append('title', f.title);
        fd.append('content', f.content || '');
        fd.append('content_type', f.content_type);
        fd.append('sort_order', f.sort_order);
        fd.append('is_active', f.is_active ? '1' : '0');
        if (f.icon) fd.append('icon', f.icon);
        if (f.header_image) fd.append('header_image', f.header_image);
        if (needsFile(f.content_type) && f.content_file) fd.append('content_file', f.content_file);
        else fd.append('content_url', f.content_url || '');
        return fd;
    };
    const submit = (e) => {
        e.preventDefault();
        router.post(route('children.team-sub-items.store', { child: child.id, teamItem: teamItem.id }), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.team-sub-items.update', { child: child.id, teamItem: teamItem.id, subItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => setEditingId(null) });
    };
    const del = (subId) => router.delete(route('children.team-sub-items.destroy', { child: child.id, teamItem: teamItem.id, subItem: subId }), { preserveScroll: true });
    return (
        <div className="pl-4 border-l-2 border-blue-200 space-y-2 mt-2">
            {subItems.map((sub) => (
                editingId === sub.id ? (
                    <TeamItemForm key={sub.id} f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" teamItems={child.team_items || []} />
                ) : (
                    <div key={sub.id} className={`flex items-center gap-3 rounded-lg border p-2 ${sub.is_active ? 'border-blue-100 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                        {sub.icon_path ? <img src={`/storage/${sub.icon_path}`} className="h-7 w-7 rounded object-contain" /> : <div className="h-7 w-7 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>}
                        <span className="flex-1 text-xs font-medium text-gray-700">{sub.title}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{sub.content_type}</span>
                        <button type="button" onClick={() => { setEditingId(sub.id); setEditForm({ title: sub.title, content: sub.content || '', content_type: sub.content_type || 'text', content_url: sub.content_value || '', content_file: null, icon: null, header_image: null, existing_header: sub.header_image || null, sort_order: sub.sort_order, is_active: sub.is_active }); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => del(sub.id)} className="text-xs text-red-500 hover:underline">Del</button>
                    </div>
                )
            ))}
            {adding ? (
                <TeamItemForm f={form} setF={setForm} onSubmit={submit} onCancel={() => setAdding(false)} submitLabel="Add Sub-Item" teamItems={child.team_items || []} />
            ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 py-1">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add menu item
                </button>
            )}
        </div>
    );
}

function CustomTeamItems({ child }) {
    const blank = { title: '', content: '', content_type: 'text', content_url: '', content_file: null, icon: null, header_image: null, existing_header: null, sort_order: 99, is_active: true };
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(blank);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const items = (child.team_items || []);
    const needsFile = (type) => type === 'image' || type === 'pdf';
    const buildFd = (f) => {
        const fd = new FormData();
        fd.append('title', f.title);
        fd.append('content', f.content || '');
        fd.append('content_type', f.content_type);
        fd.append('sort_order', f.sort_order);
        fd.append('is_active', f.is_active ? '1' : '0');
        if (f.icon) fd.append('icon', f.icon);
        if (f.header_image) fd.append('header_image', f.header_image);
        if (needsFile(f.content_type) && f.content_file) fd.append('content_file', f.content_file);
        else fd.append('content_url', f.content_url || '');
        return fd;
    };
    const submit = (e) => {
        e.preventDefault();
        router.post(route('children.team-items.store', child.id), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.team-items.update', { child: child.id, teamItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => setEditingId(null) });
    };
    const del = (id) => router.delete(route('children.team-items.destroy', { child: child.id, teamItem: id }), { preserveScroll: true });
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div key={item.id}>
                    {editingId === item.id ? (
                        <TeamItemForm f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" teamItems={items.filter(i => i.id !== editingId)} />
                    ) : (
                        <div className={`flex items-center gap-3 rounded-lg border p-2.5 ${item.is_active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                            {item.icon_path ? <img src={`/storage/${item.icon_path}`} className="h-9 w-9 rounded object-contain" /> : <div className="h-9 w-9 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>}
                            <span className="flex-1 text-sm font-medium text-gray-700">{item.title}</span>
                            <span className="text-xs text-gray-400">#{item.sort_order}</span>
                            <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="text-xs text-blue-600 hover:underline">
                                {expandedId === item.id ? 'Hide' : `Menus (${(item.sub_items || []).length})`}
                            </button>
                            <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ title: item.title, content: item.content || '', content_type: item.content_type || 'text', content_url: item.content_value || '', content_file: null, icon: null, header_image: null, existing_header: item.header_image || null, sort_order: item.sort_order, is_active: item.is_active }); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                            <button type="button" onClick={() => del(item.id)} className="text-xs text-red-500 hover:underline">Del</button>
                        </div>
                    )}
                    {expandedId === item.id && <TeamSubItemsManager child={child} teamItem={item} />}
                </div>
            ))}
            {adding ? (
                <TeamItemForm f={form} setF={setForm} onSubmit={submit} onCancel={() => setAdding(false)} submitLabel="Add" teamItems={items} />
            ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-200 py-3 text-sm text-blue-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Team Training Item
                </button>
            )}
        </div>
    );
}

/* ── Medication ── */

function MedSlotForm({ f, setF, onSubmit, onCancel, submitLabel }) {
    return (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Time Label *</label>
                    <TextInput className="w-full mt-0.5" value={f.time_label} onChange={(e) => setF({ ...f, time_label: e.target.value })} placeholder="e.g. Morning" required />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500">Sub Label</label>
                    <TextInput className="w-full mt-0.5" value={f.sub_label} onChange={(e) => setF({ ...f, sub_label: e.target.value })} placeholder="e.g. 8:00 AM" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-gray-500">Sort Order</label>
                    <TextInput type="number" className="w-full mt-0.5" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
                </div>
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="rounded border-gray-300 text-indigo-600" />
                        <span className="text-xs font-medium text-gray-500">Active</span>
                    </label>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100">Cancel</button>
                <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
            </div>
        </form>
    );
}

function MedItemForm({ slotId, childId, onDone }) {
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const submit = (e) => {
        e.preventDefault();
        if (!name.trim() || !dosage.trim()) return;
        router.post(route('children.med-items.store', { child: childId, slot: slotId }), { name, dosage, sort_order: 99 }, { preserveScroll: true, onSuccess: () => { setName(''); setDosage(''); onDone?.(); } });
    };
    return (
        <form onSubmit={submit} className="flex items-center gap-2 mt-2">
            <TextInput className="flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Med name" required />
            <TextInput className="flex-1" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage" required />
            <PrimaryButton type="submit">Add</PrimaryButton>
        </form>
    );
}

function MedSlotsManager({ child }) {
    const slots = (child.med_slots || []);
    const emptySlotForm = { time_label: '', sub_label: '', sort_order: 99, is_active: true };
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState(emptySlotForm);
    const [editingSlot, setEditingSlot] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [expandedSlot, setExpandedSlot] = useState(null);
    const addSlot = (e) => {
        e.preventDefault();
        router.post(route('children.med-slots.store', child.id), addForm, { preserveScroll: true, onSuccess: () => { setAddForm(emptySlotForm); setShowAdd(false); } });
    };
    const saveSlot = (e) => {
        e.preventDefault();
        router.post(route('children.med-slots.update', { child: child.id, slot: editingSlot }), editForm, { preserveScroll: true, onSuccess: () => { setEditingSlot(null); setEditForm(null); } });
    };
    const delSlot = (id) => {
        if (!confirm('Delete this slot and all its medications?')) return;
        router.delete(route('children.med-slots.destroy', { child: child.id, slot: id }), { preserveScroll: true });
    };
    const delItem = (slotId, itemId) => router.delete(route('children.med-items.destroy', { child: child.id, slot: slotId, item: itemId }), { preserveScroll: true });
    return (
        <div className="space-y-4">
            {slots.map((slot) => (
                <div key={slot.id} className="rounded-lg border border-gray-200 overflow-hidden">
                    {editingSlot === slot.id ? (
                        <div className="p-4">
                            <MedSlotForm f={editForm} setF={setEditForm} onSubmit={saveSlot} onCancel={() => { setEditingSlot(null); setEditForm(null); }} submitLabel="Save" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <div>
                                    <span className="font-semibold text-sm text-gray-800">{slot.time_label}</span>
                                    {slot.sub_label && <span className="ml-2 text-xs text-gray-500">{slot.sub_label}</span>}
                                    {!slot.is_active && <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500">Inactive</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => { setEditingSlot(slot.id); setEditForm({ time_label: slot.time_label, sub_label: slot.sub_label || '', sort_order: slot.sort_order, is_active: slot.is_active }); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                                    <button type="button" onClick={() => setExpandedSlot(expandedSlot === slot.id ? null : slot.id)} className="text-xs text-gray-500 hover:underline">
                                        {expandedSlot === slot.id ? 'Hide' : 'Meds'}
                                    </button>
                                    <button type="button" onClick={() => delSlot(slot.id)} className="text-xs text-red-500 hover:underline">Del</button>
                                </div>
                            </div>
                            {expandedSlot === slot.id && (
                                <div className="p-4 space-y-2">
                                    {(slot.items || []).map((item) => (
                                        <div key={item.id} className="flex items-center gap-0 rounded-full overflow-hidden ring-1 ring-gray-200 self-start w-fit">
                                            <span className="bg-red-900 text-white text-xs font-bold px-3 py-1 uppercase">{item.name}</span>
                                            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1">{item.dosage}</span>
                                            <button type="button" onClick={() => delItem(slot.id, item.id)} className="bg-gray-100 text-red-400 text-xs px-2 py-1 hover:text-red-600">×</button>
                                        </div>
                                    ))}
                                    {(slot.items || []).length === 0 && <p className="text-xs text-gray-400 italic">No medications yet.</p>}
                                    <MedItemForm slotId={slot.id} childId={child.id} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}
            {showAdd ? (
                <MedSlotForm f={addForm} setF={setAddForm} onSubmit={addSlot} onCancel={() => { setShowAdd(false); setAddForm(emptySlotForm); }} submitLabel="Add Slot" />
            ) : (
                <button type="button" onClick={() => setShowAdd(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Time Slot
                </button>
            )}
        </div>
    );
}

/* ── Page Headers ── */

function PageHeadersManager({ child }) {
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

/* ── Ariya Team Manager ── */

function AriyaTeamManager({ child, users }) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const pad2 = (n) => String(n).padStart(2, '0');
    const toDateStr = (y, m, d) => `${y}-${pad2(m+1)}-${pad2(d)}`;

    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [view, setView] = useState('list');
    const [addDate, setAddDate] = useState(todayStr);
    const [addUser, setAddUser] = useState('');
    const [addStart, setAddStart] = useState('08:00');
    const [addEnd, setAddEnd] = useState('17:00');
    const [adding, setAdding] = useState(false);
    const [calUrl, setCalUrl] = useState(child.ariya_team_calendar_url || '');
    const [showUrlEditor, setShowUrlEditor] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => { setCalUrl(child.ariya_team_calendar_url || ''); }, [child.ariya_team_calendar_url]);

    const monthStr = `${calYear}-${pad2(calMonth+1)}`;
    const allSchedules = child.team_schedules || [];
    const monthSchedules = allSchedules
        .filter(s => (s.shift_date || '').startsWith(monthStr))
        .sort((a, b) => ((a.shift_date||'') < (b.shift_date||'') ? -1 : 1));

    const firstDow = new Date(calYear, calMonth, 1).getDay();
    const dim = new Date(calYear, calMonth+1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);

    const byDate = {};
    allSchedules.forEach(s => {
        const k = (s.shift_date || '').substring(0, 10);
        if (!byDate[k]) byDate[k] = [];
        byDate[k].push(s);
    });

    const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
    const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };

    const addShift = (dateOverride) => {
        const date = dateOverride || addDate;
        if (!date || !addStart || !addEnd) return;
        setAdding(true);
        router.post(route('children.team-schedules.store', child.id), { user_id: addUser || null, shift_date: date, start_time: addStart, end_time: addEnd, sort_order: 0, is_active: true }, { preserveScroll: true, onFinish: () => setAdding(false) });
    };

    const del = (id) => {
        if (!confirm('Delete this shift?')) return;
        router.delete(route('children.team-schedules.destroy', { child: child.id, schedule: id }), { preserveScroll: true });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.team-schedules.update', { child: child.id, schedule: editingId }), editForm, { preserveScroll: true, onSuccess: () => setEditingId(null) });
    };

    const saveUrl = () => router.post(route('children.ariya-team.calendar-url', child.id), { calendar_url: calUrl }, { preserveScroll: true });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 shrink-0 flex-wrap">
                <button type="button" onClick={prevMonth} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    {calMonth === 0 ? SCHED_MONTHS[11] : SCHED_MONTHS[calMonth-1]}
                </button>
                <h2 className="text-base font-bold text-gray-800 min-w-[150px] text-center">{SCHED_MONTHS[calMonth]} {calYear}</h2>
                <button type="button" onClick={nextMonth} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    {calMonth === 11 ? SCHED_MONTHS[0] : SCHED_MONTHS[calMonth+1]}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
                <div className="flex-1"/>
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">{monthSchedules.length} shifts this month</span>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                    <button type="button" onClick={() => setView('list')} className={`px-3 py-1.5 transition-colors ${view === 'list' ? 'bg-white text-gray-800 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}>List</button>
                    <button type="button" onClick={() => setView('calendar')} className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${view === 'calendar' ? 'bg-white text-gray-800 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}>Calendar</button>
                </div>
                <button type="button" onClick={() => setShowUrlEditor(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showUrlEditor ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>School Calendar URL</button>
            </div>

            {showUrlEditor && (
                <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200 shrink-0">
                    <label className="text-xs font-semibold text-amber-700 shrink-0">School Calendar URL</label>
                    <input type="url" className="flex-1 rounded-lg border-amber-300 text-sm shadow-sm focus:border-amber-400 focus:ring-amber-400" value={calUrl} onChange={e => setCalUrl(e.target.value)} placeholder="https://..." />
                    <button type="button" onClick={saveUrl} className="rounded-lg bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold hover:bg-amber-600 transition-colors">Save</button>
                </div>
            )}

            <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-gray-200 shrink-0 flex-wrap">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Add Shift</span>
                <input type="date" className="rounded-lg border-gray-300 text-sm shadow-sm" value={addDate} onChange={e => setAddDate(e.target.value)} />
                <select className="rounded-lg border-gray-300 text-sm shadow-sm flex-1 min-w-[160px]" value={addUser} onChange={e => setAddUser(e.target.value)}>
                    <option value="">— TBD (unassigned) —</option>
                    {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                    <input type="time" className="rounded-lg border-gray-300 text-sm shadow-sm" value={addStart} onChange={e => setAddStart(e.target.value)} />
                    <span className="text-gray-400 text-sm">→</span>
                    <input type="time" className="rounded-lg border-gray-300 text-sm shadow-sm" value={addEnd} onChange={e => setAddEnd(e.target.value)} />
                </div>
                {addStart && addEnd && <span className="text-xs text-gray-400 shrink-0 w-20 text-center">{calcDur(addStart, addEnd)}</span>}
                <button type="button" onClick={() => addShift()} disabled={adding || !addDate || !addStart || !addEnd} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition-opacity shrink-0" style={{ background: TEAM_GREEN }}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                    {adding ? 'Adding…' : 'Add Shift'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {view === 'list' ? (
                    monthSchedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                            <svg className="h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            <p className="text-sm font-medium">No shifts in {SCHED_MONTHS[calMonth]} {calYear}</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Day</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff Member</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Start</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">End</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</th>
                                    <th className="px-5 py-3 w-24"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {monthSchedules.map(s =>
                                    editingId === s.id ? (
                                        <tr key={s.id} className="bg-emerald-50">
                                            <td colSpan={7} className="px-5 py-3">
                                                <form onSubmit={submitEdit} className="flex items-center gap-3 flex-wrap">
                                                    <input type="date" required className="rounded-lg border-gray-300 text-sm shadow-sm" value={editForm.shift_date} onChange={e => setEditForm({...editForm, shift_date: e.target.value})} />
                                                    <select className="rounded-lg border-gray-300 text-sm shadow-sm flex-1 min-w-[160px]" value={editForm.user_id || ''} onChange={e => setEditForm({...editForm, user_id: e.target.value || null})}>
                                                        <option value="">— TBD —</option>
                                                        {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>
                                                    <input type="time" required className="rounded-lg border-gray-300 text-sm shadow-sm" value={editForm.start_time} onChange={e => setEditForm({...editForm, start_time: e.target.value})} />
                                                    <span className="text-gray-400">→</span>
                                                    <input type="time" required className="rounded-lg border-gray-300 text-sm shadow-sm" value={editForm.end_time} onChange={e => setEditForm({...editForm, end_time: e.target.value})} />
                                                    <PrimaryButton type="submit">Save</PrimaryButton>
                                                    <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                                                </form>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={s.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="px-5 py-3 font-semibold text-gray-800">{(s.shift_date || '').substring(0,10)}</td>
                                            <td className="px-5 py-3 text-gray-500">{getDayAbbr((s.shift_date||'').substring(0,10))}</td>
                                            <td className="px-5 py-3">
                                                {s.user?.name ? (
                                                    <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400"/><span className="font-medium text-gray-800">{s.user.name}</span></span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-400"/><span className="font-medium text-red-500">TBD</span></span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-emerald-700 font-medium">{s.start_time ? fmt12(s.start_time) : '—'}</td>
                                            <td className="px-5 py-3 text-emerald-700 font-medium">{s.end_time ? fmt12(s.end_time) : '—'}</td>
                                            <td className="px-5 py-3 text-gray-400">{s.start_time && s.end_time ? calcDur(s.start_time, s.end_time) : '—'}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button type="button" onClick={() => { setEditingId(s.id); setEditForm({ user_id: s.user_id || '', shift_date: (s.shift_date||'').substring(0,10), start_time: s.start_time || '08:00', end_time: s.end_time || '17:00', sort_order: s.sort_order || 0, is_active: s.is_active ?? true }); }} className="text-xs font-medium text-indigo-600 hover:underline">Edit</button>
                                                    <button type="button" onClick={() => del(s.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )
                ) : (
                    <div>
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                            {SCHED_DAY_HDR.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{d.slice(0,3)}</div>)}
                        </div>
                        <div className="grid grid-cols-7">
                            {cells.map((day, idx) => {
                                if (day === null) return <div key={`e-${idx}`} className={`min-h-[100px] bg-gray-50/50 border-b border-gray-100 ${idx % 7 !== 6 ? 'border-r' : ''} border-gray-100`} />;
                                const ds = toDateStr(calYear, calMonth, day);
                                const dayShifts = byDate[ds] || [];
                                const isToday = ds === todayStr;
                                return (
                                    <div key={ds} onClick={() => addShift(ds)} title="Click to add shift" className={`min-h-[100px] border-b border-gray-100 p-2 cursor-pointer hover:bg-emerald-50/30 transition-colors group/cell ${idx % 7 !== 6 ? 'border-r border-gray-100' : ''}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'text-white' : 'text-gray-600'}`} style={isToday ? { background: TEAM_GREEN } : {}}>{day}</span>
                                            <span className="opacity-0 group-hover/cell:opacity-100 text-xs text-emerald-500 font-bold transition-opacity">+</span>
                                        </div>
                                        <div className="space-y-1">
                                            {dayShifts.map(s => (
                                                <div key={s.id} onClick={e => e.stopPropagation()} className="group/shift relative rounded bg-emerald-50 border-l-2 border-emerald-400 px-1.5 py-1">
                                                    <p className={`text-xs font-semibold truncate leading-tight ${s.user?.name ? 'text-gray-800' : 'text-red-500'}`}>{s.user?.name || 'TBD'}</p>
                                                    <p className="text-emerald-600 leading-tight" style={{fontSize:'10px'}}>{fmt12(s.start_time)}–{fmt12(s.end_time)}</p>
                                                    <button type="button" onClick={() => del(s.id)} className="absolute top-0.5 right-0.5 opacity-0 group-hover/shift:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6 px-5 py-2.5 bg-gray-50 border-t border-gray-200 shrink-0 text-xs text-gray-400">
                <span>{allSchedules.length} total shifts</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400"/>Assigned</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-400"/>TBD</span>
            </div>
        </div>
    );
}

/* ── Dashboard Menu Panel (preset + custom) ── */

const IMAGE_TO_SECTION = {
    'emg.png':         'Emergency',
    'mt-m.png':        'Mandatory Tasks',
    'f-c.png':         'Face Sheet',
    'at.png':          'Ariya Tube',
    'arts.png':        'Ariya Art',
    'm.png':           'Medication',
    'sleep.png':       'Sleep',
    't.png':           'Team Training',
    'team.png':        'Team',
};

function DashboardMenuPanel({ child }) {
    const [selectedMenuItems, setSelectedMenuItems] = useState(() => {
        const existing = child.menu_items || [];
        return ALL_MENU_ITEMS.map((m) => {
            const saved = existing.find((i) => i.image === m.image);
            return { image: m.image, label: m.label, is_active: saved?.is_active ?? false, sort_order: saved?.sort_order ?? 99 };
        });
    });

    useEffect(() => {
        const existing = child.menu_items || [];
        setSelectedMenuItems(ALL_MENU_ITEMS.map((m) => {
            const saved = existing.find((i) => i.image === m.image);
            return { image: m.image, label: m.label, is_active: saved?.is_active ?? false, sort_order: saved?.sort_order ?? 99 };
        }));
    }, [child]);

    const update = (image, field, value) =>
        setSelectedMenuItems(prev => prev.map(i => i.image === image ? { ...i, [field]: value } : i));

    const remove = (image) =>
        setSelectedMenuItems(prev => prev.filter(i => i.image !== image));

    const save = () => {
        const items = selectedMenuItems.map(m => ({ image: m.image, label: m.label, href: '#', sort_order: m.sort_order, is_active: m.is_active }));
        router.post(route('children.menu-items.sync', child.id), { items }, { preserveScroll: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preset Items</p>
                <div className="space-y-2">
                    {selectedMenuItems.map((item) => (
                        <div key={item.image} className={`grid grid-cols-[40px_1fr_auto_80px_56px_24px] items-center gap-3 rounded-lg border p-2.5 ${item.is_active ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                            <img src={`/images/dashboard/${item.image}`} className="h-9 w-9 object-contain" />
                            <input
                                type="text"
                                value={item.label}
                                onChange={(e) => update(item.image, 'label', e.target.value)}
                                className="rounded border-gray-300 text-sm shadow-sm w-full"
                            />
                            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 whitespace-nowrap">
                                → {IMAGE_TO_SECTION[item.image] || '—'}
                            </span>
                            <input type="number" min="0" value={item.sort_order} onChange={(e) => update(item.image, 'sort_order', parseInt(e.target.value) || 0)} className="w-full rounded border-gray-300 text-center text-sm shadow-sm" />
                            <div className="flex justify-center">
                                <button type="button" onClick={() => update(item.image, 'is_active', !item.is_active)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <button type="button" onClick={() => remove(item.image)} className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors" title="Remove">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex justify-end">
                    <PrimaryButton onClick={save}>Save Preset Items</PrimaryButton>
                </div>
            </div>
            <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Custom Items</p>
                <CustomMenuItems child={child} />
            </div>
        </div>
    );
}

/* ── Section Panel router ── */

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
        default:
            return wrap(<p className="text-sm text-gray-400">Select a section.</p>);
    }
}

/* ── Main Page ── */

export default function ContentManager({ children = [], scheduleUsers = [] }) {
    const [selectedChild, setSelectedChild] = useState(children[0] ?? null);
    const [selectedSection, setSelectedSection] = useState(null);

    useEffect(() => {
        if (!selectedChild) return;
        const fresh = children.find(c => c.id === selectedChild.id);
        if (fresh) setSelectedChild(fresh);
    }, [children]);

    return (
        <AuthenticatedLayout>
            <Head title="Content Manager" />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">

                {/* Panel 1: Children */}
                <div className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
                    <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Children</p>
                    </div>
                    <div className="flex-1 py-2">
                        {children.map((c) => {
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

                {/* Panel 2: Sections (only when child selected) */}
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

                {/* Panel 3: Management content */}
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
