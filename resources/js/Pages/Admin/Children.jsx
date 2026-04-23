import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';


const ALL_MENU_ITEMS = [
    { image: 'emg.png',   label: 'Emergency' },
    { image: 'mt-m.png',  label: 'Mandatory Tasks' },
    { image: 'f-c.png',   label: 'Face Sheet' },
    { image: 'at.png',    label: 'Ariya Status' },
    { image: 'arts.png',  label: 'Ariya Behavior' },
    { image: 'm.png',     label: 'Medication' },
    { image: 'sleep.png', label: 'Sleep' },
    { image: 't.png',     label: 'Task' },
    { image: 'team.png',  label: 'Team' },
];

const CONTENT_TYPES = [
    { value: 'link',  label: 'Link (URL)' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
    { value: 'pdf',   label: 'PDF' },
];

/* ── Top-level form components so React never remounts them on re-render ── */

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
                    <textarea
                        className="w-full mt-0.5 rounded-md border-gray-300 shadow-sm text-sm"
                        rows={3}
                        value={f.content}
                        onChange={(e) => setF({ ...f, content: e.target.value })}
                        placeholder="Popup content text"
                    />
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

/* ── Custom menu items (CRUD) ── */

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
        router.post(route('children.menu-items.store', child.id), fd, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { setAdding(false); setForm(blank); },
        });
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
        router.post(route('children.menu-items.update', { child: child.id, menuItem: editingId }), fd, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setEditingId(null),
        });
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

/* ── Emergency page title editor ── */

function EmergencyTitleEditor({ child }) {
    const [title, setTitle] = useState(child.emergency_title || 'Emergency');

    const save = () => {
        router.post(route('children.emergency-title', child.id), { emergency_title: title }, { preserveScroll: true });
    };

    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput
                className="flex-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Emergency"
            />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

/* ── Face sheet PDF manager ── */

function FaceSheetManager({ child }) {
    const [file, setFile] = useState(null);
    const inputRef = useRef(null);

    const hasPdf = !!child.face_sheet_pdf;

    const upload = () => {
        if (!file) return;
        const fd = new FormData();
        fd.append('pdf', file);
        router.post(route('children.face-sheet', child.id), fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setFile(null); if (inputRef.current) inputRef.current.value = ''; },
        });
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
                        <a
                            href={`/storage/${child.face_sheet_pdf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline truncate block"
                        >
                            View current PDF
                        </a>
                    </div>
                    <button onClick={remove} className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">Remove</button>
                </div>
            )}

            <div className="flex items-center gap-3">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    className="flex-1 text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <PrimaryButton onClick={upload} disabled={!file}>
                    {hasPdf ? 'Replace' : 'Upload'}
                </PrimaryButton>
            </div>
        </div>
    );
}

/* ── Mandatory Tasks page title editor ── */

function MandatoryTitleEditor({ child }) {
    const [title, setTitle] = useState(child.mandatory_title || 'Mandatory Tasks');

    const save = () => {
        router.post(route('children.mandatory-title', child.id), { mandatory_title: title }, { preserveScroll: true });
    };

    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput
                className="flex-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mandatory Tasks"
            />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

/* ── Custom emergency items (CRUD) ── */

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
        router.post(route('children.emergency-items.store', child.id), buildFd(form), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { setAdding(false); setForm(blank); },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.emergency-items.update', { child: child.id, emergencyItem: editingId }), buildFd(editForm), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setEditingId(null),
        });
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

/* ── Mandatory task image manager ── */

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
        router.post(route('children.mandatory-items.store', child.id), buildFd(form), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => { setAdding(false); setForm(blank); },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.mandatory-items.update', { child: child.id, mandatoryItem: editingId }), buildFd(editForm), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => setEditingId(null),
        });
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
                                {item.title && (
                                    <div className="px-2 py-1 bg-white text-xs text-gray-600 truncate">{item.title}</div>
                                )}
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

/* ── Ariya items manager (nested: icon grid → image gallery) ── */

function AriyaImageRow({ childId, item }) {
    const [mode, setMode] = useState(null); // null | 'image' | 'video'
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
        router.post(route('children.ariya-images.store', { child: childId, ariyaItem: item.id }), fd, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { setMode(null); setImgFile(null); setCaption(''); setVideoUrl(''); },
        });
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
        router.post(route('children.ariya-items.store', { child: child.id, type }), buildFd(form), {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { setAdding(false); setForm(blank); },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.ariya-items.update', { child: child.id, ariyaItem: editingId }), buildFd(editForm), {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
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
                    {expandedId === item.id && editingId !== item.id && (
                        <AriyaImageRow childId={child.id} item={item} />
                    )}
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

/* ── Ariya Art direct gallery manager ── */

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
        router.post(route('children.gallery.store', { child: child.id, section }), fd, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { setFile(null); setCaption(''); if (inputRef.current) inputRef.current.value = ''; },
        });
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

/* ── Team Training manager ── */

function TeamTitleEditor({ child }) {
    const [title, setTitle] = useState(child.team_title || 'Team Training');
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
                                {teamItems.map((ti) => (
                                    <option key={ti.id} value={ti.id}>{ti.title}</option>
                                ))}
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
        router.post(route('children.team-sub-items.store', { child: child.id, teamItem: teamItem.id }), buildFd(form), {
            preserveScroll: true, forceFormData: true,
            onSuccess: () => { setAdding(false); setForm(blank); },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.team-sub-items.update', { child: child.id, teamItem: teamItem.id, subItem: editingId }), buildFd(editForm), {
            preserveScroll: true, forceFormData: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const del = (subId) => router.delete(route('children.team-sub-items.destroy', { child: child.id, teamItem: teamItem.id, subItem: subId }), { preserveScroll: true });

    return (
        <div className="pl-4 border-l-2 border-blue-200 space-y-2 mt-2">
            {subItems.map((sub) => (
                editingId === sub.id ? (
                    <TeamItemForm key={sub.id} f={editForm} setF={setEditForm} onSubmit={submitEdit} onCancel={() => setEditingId(null)} submitLabel="Update" teamItems={child.team_items || []} />
                ) : (
                    <div key={sub.id} className={`flex items-center gap-3 rounded-lg border p-2 ${sub.is_active ? 'border-blue-100 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                        {sub.icon_path
                            ? <img src={`/storage/${sub.icon_path}`} className="h-7 w-7 rounded object-contain" />
                            : <div className="h-7 w-7 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>
                        }
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
        router.post(route('children.team-items.store', child.id), buildFd(form), {
            preserveScroll: true, forceFormData: true,
            onSuccess: () => { setAdding(false); setForm(blank); },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.team-items.update', { child: child.id, teamItem: editingId }), buildFd(editForm), {
            preserveScroll: true, forceFormData: true,
            onSuccess: () => setEditingId(null),
        });
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
                            {item.icon_path
                                ? <img src={`/storage/${item.icon_path}`} className="h-9 w-9 rounded object-contain" />
                                : <div className="h-9 w-9 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">?</div>
                            }
                            <span className="flex-1 text-sm font-medium text-gray-700">{item.title}</span>
                            <span className="text-xs text-gray-400">#{item.sort_order}</span>
                            <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="text-xs text-blue-600 hover:underline">
                                {expandedId === item.id ? 'Hide' : `Menus (${(item.sub_items || []).length})`}
                            </button>
                            <button type="button" onClick={() => { setEditingId(item.id); setEditForm({ title: item.title, content: item.content || '', content_type: item.content_type || 'text', content_url: item.content_value || '', content_file: null, icon: null, header_image: null, existing_header: item.header_image || null, sort_order: item.sort_order, is_active: item.is_active }); }} className="text-xs text-indigo-600 hover:underline">Edit</button>
                            <button type="button" onClick={() => del(item.id)} className="text-xs text-red-500 hover:underline">Del</button>
                        </div>
                    )}
                    {expandedId === item.id && (
                        <TeamSubItemsManager child={child} teamItem={item} />
                    )}
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

/* ── Medication Slots Manager ── */

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
        router.post(
            route('children.med-items.store', { child: childId, slot: slotId }),
            { name, dosage, sort_order: 99 },
            { preserveScroll: true, onSuccess: () => { setName(''); setDosage(''); onDone?.(); } }
        );
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
        router.post(
            route('children.med-slots.store', child.id),
            addForm,
            { preserveScroll: true, onSuccess: () => { setAddForm(emptySlotForm); setShowAdd(false); } }
        );
    };

    const saveSlot = (e) => {
        e.preventDefault();
        router.post(
            route('children.med-slots.update', { child: child.id, slot: editingSlot }),
            editForm,
            { preserveScroll: true, onSuccess: () => { setEditingSlot(null); setEditForm(null); } }
        );
    };

    const delSlot = (id) => {
        if (!confirm('Delete this slot and all its medications?')) return;
        router.delete(route('children.med-slots.destroy', { child: child.id, slot: id }), { preserveScroll: true });
    };

    const delItem = (slotId, itemId) => {
        router.delete(route('children.med-items.destroy', { child: child.id, slot: slotId, item: itemId }), { preserveScroll: true });
    };

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

/* ── Action menu (three-dot) ── */

/* ── Page Headers Manager ── */

const PAGE_HEADER_SLOTS = [
    { key: 'emergency',       label: 'Emergency' },
    { key: 'mandatory-tasks', label: 'Mandatory Tasks' },
    { key: 'medication',      label: 'Medication' },
    { key: 'team-training',   label: 'Team Training' },
    { key: 'ariya-status',    label: 'Ariya Tube' },
    { key: 'ariya-behavior',  label: 'Ariya Art' },
];

function PageHeadersManager({ child }) {
    const headers = (child.page_headers || []);
    const getHeader = (key) => headers.find((h) => h.page_key === key);

    const upload = (key, file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('page_key', key);
        fd.append('header_image', file);
        router.post(route('children.page-headers.update', child.id), fd, {
            forceFormData: true,
            preserveScroll: true,
        });
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
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-1 block w-full text-xs text-gray-500"
                                onChange={(e) => upload(key, e.target.files[0])}
                            />
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

function ActionMenu({ child, onEdit, onDelete, onMapUsers, onDashboardMenu, onEmergency, onMandatory, onFaceSheet, onAriyaStatus, onAriyaBehavior, onMedication, onTeamTraining, onPageHeaders }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const actions = [
        { label: 'Edit',             icon: '✏️', onClick: onEdit,          color: 'text-gray-700' },
        { label: 'Map Users',        icon: '👥', onClick: onMapUsers,      color: 'text-emerald-700' },
        { label: 'Dashboard Menu',   icon: '🗂️', onClick: onDashboardMenu, color: 'text-indigo-700' },
        { label: 'Mandatory Tasks',  icon: '📋', onClick: onMandatory,      color: 'text-indigo-600' },
        { label: 'Face Sheet',       icon: '📄', onClick: onFaceSheet,      color: 'text-blue-700' },
        { label: 'Ariya Tube',       icon: '📊', onClick: onAriyaStatus,   color: 'text-teal-700' },
        { label: 'Ariya Art',        icon: '🎨', onClick: onAriyaBehavior, color: 'text-purple-700' },
        { label: 'Medication',       icon: '💊', onClick: onMedication,    color: 'text-pink-700' },
        { label: 'Team Training',    icon: '👥', onClick: onTeamTraining,  color: 'text-blue-700' },
        { label: 'Emergency',        icon: '🚨', onClick: onEmergency,      color: 'text-red-700' },
        { label: 'Page Headers',     icon: '🖼️', onClick: onPageHeaders,   color: 'text-violet-700' },
        { label: 'Delete',           icon: '🗑️', onClick: onDelete,        color: 'text-red-600' },
    ];

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 top-9 z-30 w-44 rounded-lg bg-white shadow-lg ring-1 ring-black/5 py-1">
                    {actions.map((a) => (
                        <button key={a.label} onClick={() => { a.onClick(); setOpen(false); }} className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 ${a.color}`}>
                            <span>{a.icon}</span>
                            {a.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Shared modal wrapper ── */

function Modal({ title, subtitle, onClose, children, footer }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
                {footer && <div className="border-t border-gray-100 px-6 py-4 flex gap-3">{footer}</div>}
            </div>
        </div>
    );
}

/* ── Page ── */

export default function Children({ children, assignableUsers = [], isSuperadmin = false }) {
    const { data, setData, post, processing, reset, errors } = useForm({ name: '', photo: null, user_ids: [] });
    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({ id: null, name: '', photo: null });

    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [mappingByChild, setMappingByChild] = useState(() => {
        const init = {};
        children.forEach((c) => { init[c.id] = (c.users || []).map((u) => u.id); });
        return init;
    });
    const [showMapModalFor, setShowMapModalFor] = useState(null);
    const [deleteConfirmFor, setDeleteConfirmFor] = useState(null);
    const [menuModalFor, setMenuModalFor] = useState(null);
    const [selectedMenuItems, setSelectedMenuItems] = useState([]);
    const [emergencyModalFor, setEmergencyModalFor] = useState(null);
    const [mandatoryModalFor, setMandatoryModalFor] = useState(null);
    const [faceSheetModalFor, setFaceSheetModalFor] = useState(null);
    const [ariyaStatusModalFor, setAriyaStatusModalFor] = useState(null);
    const [ariyaBehaviorModalFor, setAriyaBehaviorModalFor] = useState(null);
    const [medicationModalFor, setMedicationModalFor] = useState(null);
    const [teamModalFor, setTeamModalFor] = useState(null);
    const [pageHeadersModalFor, setPageHeadersModalFor] = useState(null);

    function submit(e) {
        e.preventDefault();
        post(route('children.store'), { onSuccess: () => { reset(); setShowCreate(false); } });
    }

    const openEdit = (c) => { setEditData({ id: c.id, name: c.name || '', photo: null }); setShowEdit(true); };
    const closeEdit = () => { resetEdit(); setShowEdit(false); };
    const submitEdit = (e) => { e.preventDefault(); putEdit(route('children.update', editData.id), { onSuccess: closeEdit }); };

    const toggleMappingUser = (childId, userId) => {
        const cur = mappingByChild[childId] || [];
        setMappingByChild({ ...mappingByChild, [childId]: cur.includes(userId) ? cur.filter((id) => id !== userId) : [...cur, userId] });
    };
    const saveMapping = (childId) => router.post(route('children.sync-users', childId), { user_ids: mappingByChild[childId] || [] }, { preserveScroll: true });

    const openMenuModal = (c) => {
        const existing = c.menu_items || [];
        setSelectedMenuItems(
            ALL_MENU_ITEMS.map((m) => {
                const saved = existing.find((i) => i.image === m.image);
                return { image: m.image, label: m.label, is_active: saved ? saved.is_active : false, sort_order: saved ? saved.sort_order : 99 };
            })
        );
        setMenuModalFor(c);
    };
    const updatePresetMenuItem = (image, field, value) => setSelectedMenuItems((prev) => prev.map((i) => i.image === image ? { ...i, [field]: value } : i));
    const saveMenuItems = () => {
        const items = selectedMenuItems.map((m) => ({ image: m.image, label: m.label, href: '#', sort_order: m.sort_order, is_active: m.is_active }));
        router.post(route('children.menu-items.sync', menuModalFor.id), { items }, { preserveScroll: true, onSuccess: () => setMenuModalFor(null) });
    };

    const openEmergencyModal = (c) => setEmergencyModalFor(c);

    /* Keep emergencyModalFor in sync with fresh children prop after Inertia reloads */
    useEffect(() => {
        if (!emergencyModalFor) return;
        const fresh = children.find((c) => c.id === emergencyModalFor.id);
        if (fresh) setEmergencyModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!menuModalFor) return;
        const fresh = children.find((c) => c.id === menuModalFor.id);
        if (fresh) setMenuModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!mandatoryModalFor) return;
        const fresh = children.find((c) => c.id === mandatoryModalFor.id);
        if (fresh) setMandatoryModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!faceSheetModalFor) return;
        const fresh = children.find((c) => c.id === faceSheetModalFor.id);
        if (fresh) setFaceSheetModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!ariyaStatusModalFor) return;
        const fresh = children.find((c) => c.id === ariyaStatusModalFor.id);
        if (fresh) setAriyaStatusModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!ariyaBehaviorModalFor) return;
        const fresh = children.find((c) => c.id === ariyaBehaviorModalFor.id);
        if (fresh) setAriyaBehaviorModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!medicationModalFor) return;
        const fresh = children.find((c) => c.id === medicationModalFor.id);
        if (fresh) setMedicationModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!teamModalFor) return;
        const fresh = children.find((c) => c.id === teamModalFor.id);
        if (fresh) setTeamModalFor(fresh);
    }, [children]);

    useEffect(() => {
        if (!pageHeadersModalFor) return;
        const fresh = children.find((c) => c.id === pageHeadersModalFor.id);
        if (fresh) setPageHeadersModalFor(fresh);
    }, [children]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Child Management</h2>}>
            <Head title="Children" />

            <div className="space-y-6 p-6">

                {isSuperadmin && (
                    <div className="flex justify-end">
                        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Add Child
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {children.map((c) => {
                        const photoSrc = c.photo ? `/storage/${c.photo}` : null;
                        return (
                            <div key={c.id} className="relative rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    {photoSrc ? (
                                        <img src={photoSrc} alt={c.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100" />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-lg font-bold text-white">
                                            {c.name.slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                                        <p className="text-xs text-gray-400">{(c.users || []).length} user{(c.users || []).length !== 1 ? 's' : ''} assigned</p>
                                    </div>
                                    {isSuperadmin && (
                                        <ActionMenu
                                            child={c}
                                            onEdit={() => openEdit(c)}
                                            onDelete={() => setDeleteConfirmFor(c.id)}
                                            onMapUsers={() => setShowMapModalFor(c.id)}
                                            onDashboardMenu={() => openMenuModal(c)}
                                            onMandatory={() => setMandatoryModalFor(c)}
                                            onFaceSheet={() => setFaceSheetModalFor(c)}
                                            onAriyaStatus={() => setAriyaStatusModalFor(c)}
                                            onAriyaBehavior={() => setAriyaBehaviorModalFor(c)}
                                            onMedication={() => setMedicationModalFor(c)}
                                            onTeamTraining={() => setTeamModalFor(c)}
                                            onEmergency={() => openEmergencyModal(c)}
                                            onPageHeaders={() => setPageHeadersModalFor(c)}
                                        />
                                    )}
                                </div>

                                {(c.users || []).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Assigned Users</p>
                                        <div className="flex flex-wrap gap-1">
                                            {c.users.map((u) => (
                                                <span key={u.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{u.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Dashboard Menu</p>
                                    <div className="flex flex-wrap gap-1">
                                        {(c.menu_items || []).length > 0 ? (
                                            c.menu_items.map((m, idx) => (
                                                m.icon_path
                                                    ? <img key={idx} src={`/storage/${m.icon_path}`} title={m.label} className="h-7 w-7 object-contain rounded" />
                                                    : <img key={idx} src={`/images/dashboard/${m.image}`} title={m.label} className="h-7 w-7 object-contain" />
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">All items shown</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <Modal title="Add Child" onClose={() => setShowCreate(false)}
                    footer={<><PrimaryButton disabled={processing} onClick={submit}>Create</PrimaryButton><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button></>}
                >
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <TextInput className="w-full mt-1" placeholder="Child name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Photo (optional)</label>
                            <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={(e) => setData('photo', e.target.files[0])} />
                        </div>
                        {assignableUsers.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-gray-700">Assign users</label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {assignableUsers.map((u) => (
                                        <label key={u.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                            <input type="checkbox" className="rounded border-gray-300 text-indigo-600" checked={data.user_ids.includes(u.id)} onChange={() => setData('user_ids', data.user_ids.includes(u.id) ? data.user_ids.filter((x) => x !== u.id) : [...data.user_ids, u.id])} />
                                            <span>{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </Modal>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <Modal title="Edit Child" onClose={closeEdit}
                    footer={<><PrimaryButton disabled={editProcessing} onClick={submitEdit}>Save</PrimaryButton><button type="button" onClick={closeEdit} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button></>}
                >
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Name</label>
                            <TextInput className="w-full mt-1" value={editData.name} onChange={(e) => setEditData('name', e.target.value)} />
                            <InputError message={editErrors.name} className="mt-1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Replace Photo (optional)</label>
                            <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={(e) => setEditData('photo', e.target.files[0])} />
                        </div>
                    </form>
                </Modal>
            )}

            {/* Map Users Modal */}
            {showMapModalFor && (
                <Modal title="Map Users" subtitle="Select users assigned to this child" onClose={() => setShowMapModalFor(null)}
                    footer={<><PrimaryButton onClick={() => { saveMapping(showMapModalFor); setShowMapModalFor(null); }}>Save</PrimaryButton><button type="button" onClick={() => setShowMapModalFor(null)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button></>}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {assignableUsers.length === 0 ? <p className="text-sm text-gray-500">No assignable users.</p> : assignableUsers.map((u) => (
                            <label key={u.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" className="rounded border-gray-300 text-indigo-600" checked={(mappingByChild[showMapModalFor] || []).includes(u.id)} onChange={() => toggleMappingUser(showMapModalFor, u.id)} />
                                <span>{u.name} <span className="text-gray-400">· {u.role}</span></span>
                            </label>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Dashboard Menu Modal */}
            {menuModalFor && (
                <Modal title="Dashboard Menu" subtitle={`Manage items for ${menuModalFor.name}`} onClose={() => setMenuModalFor(null)} footer={null}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preset Items</p>
                            <div className="space-y-2">
                                {selectedMenuItems.map((item) => (
                                    <div key={item.image} className={`grid grid-cols-[40px_1fr_80px_56px] items-center gap-3 rounded-lg border p-2.5 ${item.is_active ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                                        <img src={`/images/dashboard/${item.image}`} className="h-9 w-9 object-contain" />
                                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                        <input type="number" min="0" value={item.sort_order} onChange={(e) => updatePresetMenuItem(item.image, 'sort_order', parseInt(e.target.value) || 0)} className="w-full rounded border-gray-300 text-center text-sm shadow-sm" />
                                        <div className="flex justify-center">
                                            <button type="button" onClick={() => updatePresetMenuItem(item.image, 'is_active', !item.is_active)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-end">
                                <PrimaryButton onClick={saveMenuItems}>Save Preset Items</PrimaryButton>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Custom Items</p>
                            <CustomMenuItems child={menuModalFor} />
                        </div>
                    </div>
                </Modal>
            )}

            {/* Mandatory Tasks Modal */}
            {mandatoryModalFor && (
                <Modal title="Mandatory Tasks Gallery" subtitle={`Upload images for ${mandatoryModalFor.name}`} onClose={() => setMandatoryModalFor(null)} footer={null}>
                    <MandatoryTitleEditor child={mandatoryModalFor} />
                    <div className="border-t my-4" />
                    <MandatoryItemsManager child={mandatoryModalFor} />
                </Modal>
            )}

            {/* Face Sheet Modal */}
            {faceSheetModalFor && (
                <Modal title="Face Sheet PDF" subtitle={`Manage face sheet for ${faceSheetModalFor.name}`} onClose={() => setFaceSheetModalFor(null)} footer={null}>
                    <FaceSheetManager child={faceSheetModalFor} />
                </Modal>
            )}

            {/* Ariya Tube Modal */}
            {ariyaStatusModalFor && (
                <Modal title="Ariya Tube" subtitle={`Manage menu items for ${ariyaStatusModalFor.name}`} onClose={() => setAriyaStatusModalFor(null)} footer={null}>
                    <AriyaItemsManager child={ariyaStatusModalFor} type="status" />
                </Modal>
            )}

            {/* Ariya Art Modal */}
            {ariyaBehaviorModalFor && (
                <Modal title="Ariya Art" subtitle={`Manage gallery images for ${ariyaBehaviorModalFor.name}`} onClose={() => setAriyaBehaviorModalFor(null)} footer={null}>
                    <AriyaArtManager child={ariyaBehaviorModalFor} />
                </Modal>
            )}

            {/* Team Training Modal */}
            {teamModalFor && (
                <Modal title="Team Training" subtitle={`Manage items for ${teamModalFor.name}`} onClose={() => setTeamModalFor(null)} footer={null}>
                    <TeamTitleEditor child={teamModalFor} />
                    <div className="border-t my-4" />
                    <CustomTeamItems child={teamModalFor} />
                </Modal>
            )}

            {/* Medication Modal */}
            {medicationModalFor && (
                <Modal title="Medication" subtitle={`Manage medication slots for ${medicationModalFor.name}`} onClose={() => setMedicationModalFor(null)} footer={null}>
                    <MedSlotsManager child={medicationModalFor} />
                </Modal>
            )}

            {/* Emergency Items Modal */}
            {emergencyModalFor && (
                <Modal title="Emergency Items" subtitle={`Manage emergency items for ${emergencyModalFor.name}`} onClose={() => setEmergencyModalFor(null)} footer={null}>
                    <EmergencyTitleEditor child={emergencyModalFor} />
                    <div className="border-t my-4" />
                    <CustomEmergencyItems child={emergencyModalFor} />
                </Modal>
            )}

            {/* Page Headers Modal */}
            {pageHeadersModalFor && (
                <Modal title="Page Headers" subtitle={`Manage section header images for ${pageHeadersModalFor.name}`} onClose={() => setPageHeadersModalFor(null)} footer={null}>
                    <PageHeadersManager child={pageHeadersModalFor} />
                </Modal>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirmFor && (
                <Modal title="Delete Child" onClose={() => setDeleteConfirmFor(null)}
                    footer={<><button type="button" onClick={() => { router.delete(route('children.destroy', deleteConfirmFor)); setDeleteConfirmFor(null); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Yes, delete</button><button type="button" onClick={() => setDeleteConfirmFor(null)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button></>}
                >
                    <p className="text-sm text-gray-600">Are you sure you want to delete this child? This action cannot be undone.</p>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
