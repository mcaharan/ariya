import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

function calcDur(s, e) {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let diff = toMin(e) - toMin(s);
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60), m = diff % 60;
    return m === 0 ? `${h} hrs` : `${h} hrs ${m} mins`;
}

function fmt12(t) {
    const [h, m] = t.split(':').map(Number);
    const p = h < 12 ? 'am' : 'pm';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${p}`;
}

const SCHED_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SCHED_DAY_HDR = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TEAM_GREEN = '#1a9e6b';
const WEEK_DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDayAbbr(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return WEEK_DAY_ABBR[d.getDay()];
}

export function AriyaTeamManager({ child, users }) {
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
                                            <td className="px-5 py-3">{s.user?.name ? <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400"/><span className="font-medium text-gray-800">{s.user.name}</span></span> : <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-400"/><span className="font-medium text-red-500">TBD</span></span>}</td>
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
                                                    <button type="button" onClick={() => del(s.id)} className="absolute top-0.5 right-0.5 opacity-0 group-hover/shift:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
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
