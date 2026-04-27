import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/Toast';
import { TEAM_CONTENT_TYPES } from './constants';

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
    const del = (subId) => {
        if (!confirm('Delete this sub-item?')) return;
        router.delete(route('children.team-sub-items.destroy', { child: child.id, teamItem: teamItem.id, subItem: subId }), { preserveScroll: true });
    };
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

export function TeamTitleEditor({ child }) {
    const toast = useToast();
    const [title, setTitle] = useState(child.team_title || 'Team Training');
    useEffect(() => setTitle(child.team_title || 'Team Training'), [child]);
    const save = () => router.post(route('children.team-title', child.id), { team_title: title }, { preserveScroll: true, onSuccess: () => toast('Title saved.') });
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 shrink-0">Page Title</label>
            <TextInput className="flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team Training" />
            <PrimaryButton onClick={save}>Save</PrimaryButton>
        </div>
    );
}

export function CustomTeamItems({ child }) {
    const toast = useToast();
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
        router.post(route('children.team-items.store', child.id), buildFd(form), { preserveScroll: true, forceFormData: true, onSuccess: () => { setAdding(false); setForm(blank); toast('Item added.'); } });
    };
    const submitEdit = (e) => {
        e.preventDefault();
        router.post(route('children.team-items.update', { child: child.id, teamItem: editingId }), buildFd(editForm), { preserveScroll: true, forceFormData: true, onSuccess: () => { setEditingId(null); toast('Item updated.'); } });
    };
    const del = (id) => {
        if (!confirm('Delete this item?')) return;
        router.delete(route('children.team-items.destroy', { child: child.id, teamItem: id }), { preserveScroll: true, onSuccess: () => toast('Item deleted.') });
    };
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
