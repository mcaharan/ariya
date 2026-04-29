import { useState } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/Components/Toast';

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

export function MedSlotsManager({ child }) {
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
