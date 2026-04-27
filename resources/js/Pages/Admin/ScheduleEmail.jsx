import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

function todayIST() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function EmailListEditor({ label, color = 'indigo', emails, onChange }) {
    const [draft, setDraft] = useState('');

    const add = () => {
        const v = draft.trim().toLowerCase();
        if (!v) return;
        onChange([...emails.filter(Boolean), v]);
        setDraft('');
    };

    const remove = (i) => onChange(emails.filter((_, idx) => idx !== i));

    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        sky:    'bg-sky-50 text-sky-700 border-sky-200',
        amber:  'bg-amber-50 text-amber-700 border-amber-200',
    };
    const badgeClass = colorMap[color] ?? colorMap.indigo;

    return (
        <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">{label}</label>
            {emails.filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {emails.filter(Boolean).map((email, i) => (
                        <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${badgeClass}`}>
                            {email}
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                className="text-current opacity-50 hover:opacity-100 transition-opacity leading-none"
                            >×</button>
                        </span>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="email"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                    placeholder="email@example.com"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                />
                <button
                    type="button"
                    onClick={add}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >+ Add</button>
            </div>
        </div>
    );
}

function RecipientsSection({ to, cc, bcc, onTo, onCc, onBcc }) {
    return (
        <div className="space-y-4">
            <EmailListEditor label="To" color="indigo" emails={to} onChange={onTo} />
            <EmailListEditor label="CC" color="sky"    emails={cc} onChange={onCc} />
            <EmailListEditor label="BCC" color="amber" emails={bcc} onChange={onBcc} />
        </div>
    );
}

export default function ScheduleEmail({ children = [] }) {
    const [selected, setSelected] = useState(children[0] ?? null);
    const [tab, setTab]           = useState('daily');
    const [flash, setFlash]       = useState(null);

    // ── Daily state ──
    const [to,      setTo]      = useState(children[0]?.schedule_email_recipients ?? []);
    const [cc,      setCc]      = useState(children[0]?.schedule_email_cc  ?? []);
    const [bcc,     setBcc]     = useState(children[0]?.schedule_email_bcc ?? []);
    const [subject, setSubject] = useState(children[0]?.schedule_email_subject ?? '');
    const [time,    setTime]    = useState(children[0]?.schedule_email_time ?? '13:30');
    const [preview, setPreview] = useState(null);
    const [previewDate, setPreviewDate] = useState(todayIST);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [sending,  setSending]  = useState(false);
    const [sendDate, setSendDate] = useState(todayIST);

    // ── Weekly state ──
    const [wTo,      setWTo]      = useState(children[0]?.weekly_email_recipients ?? []);
    const [wCc,      setWCc]      = useState(children[0]?.weekly_email_cc  ?? []);
    const [wBcc,     setWBcc]     = useState(children[0]?.weekly_email_bcc ?? []);
    const [wSubject, setWSubject] = useState(children[0]?.weekly_email_subject ?? '');
    const [wTime,    setWTime]    = useState(children[0]?.weekly_email_time ?? '13:35');
    const [wDay,     setWDay]     = useState(children[0]?.weekly_email_day ?? 5);
    const [wPreview, setWPreview] = useState(null);
    const [wPreviewDate, setWPreviewDate] = useState(todayIST);
    const [wLoadingPreview, setWLoadingPreview] = useState(false);
    const [wSending,  setWSending]  = useState(false);
    const [wSendDate, setWSendDate] = useState(todayIST);

    const selectChild = (c) => {
        setSelected(c);
        setTo(c.schedule_email_recipients ?? []);
        setCc(c.schedule_email_cc  ?? []);
        setBcc(c.schedule_email_bcc ?? []);
        setSubject(c.schedule_email_subject ?? '');
        setTime(c.schedule_email_time ?? '13:30');
        setPreview(null);
        setWTo(c.weekly_email_recipients ?? []);
        setWCc(c.weekly_email_cc  ?? []);
        setWBcc(c.weekly_email_bcc ?? []);
        setWSubject(c.weekly_email_subject ?? '');
        setWTime(c.weekly_email_time ?? '13:35');
        setWDay(c.weekly_email_day ?? 5);
        setWPreview(null);
        setFlash(null);
    };

    // ── Daily actions ──
    const save = () => {
        router.post(route('children.schedule-email-recipients', selected.id), {
            recipients: to, cc, bcc, subject, send_time: time,
        }, {
            preserveScroll: true,
            onSuccess: () => setFlash({ ok: true,  msg: 'Daily settings saved.' }),
            onError:   () => setFlash({ ok: false, msg: 'Failed to save.' }),
        });
    };

    const loadPreview = async () => {
        setLoadingPreview(true); setPreview(null);
        try {
            const res  = await fetch(route('children.schedule-email-preview', selected.id) + '?date=' + previewDate);
            const data = await res.json();
            setPreview(data.html);
        } catch { setPreview('<p style="color:red">Failed to load preview.</p>'); }
        setLoadingPreview(false);
    };

    const sendNow = () => {
        if (!window.confirm(`Send daily schedule email for ${sendDate}?`)) return;
        setSending(true);
        router.post(route('children.send-daily-schedule', selected.id), { date: sendDate }, {
            preserveScroll: true,
            onSuccess: () => { setFlash({ ok: true, msg: 'Daily email sent.' }); setSending(false); },
            onError:   () => { setFlash({ ok: false, msg: 'Failed to send.' }); setSending(false); },
        });
    };

    // ── Weekly actions ──
    const wSave = () => {
        router.post(route('children.weekly-email-settings', selected.id), {
            recipients: wTo, cc: wCc, bcc: wBcc, subject: wSubject, send_time: wTime, send_day: wDay,
        }, {
            preserveScroll: true,
            onSuccess: () => setFlash({ ok: true,  msg: 'Weekly settings saved.' }),
            onError:   () => setFlash({ ok: false, msg: 'Failed to save.' }),
        });
    };

    const wLoadPreview = async () => {
        setWLoadingPreview(true); setWPreview(null);
        try {
            const res  = await fetch(route('children.weekly-email-preview', selected.id) + '?date=' + wPreviewDate);
            const data = await res.json();
            setWPreview(data.html);
        } catch { setWPreview('<p style="color:red">Failed to load preview.</p>'); }
        setWLoadingPreview(false);
    };

    const wSendNow = () => {
        if (!window.confirm(`Send weekly summary email starting ${wSendDate}?`)) return;
        setWSending(true);
        router.post(route('children.send-weekly-schedule', selected.id), { date: wSendDate }, {
            preserveScroll: true,
            onSuccess: () => { setFlash({ ok: true, msg: 'Weekly email sent.' }); setWSending(false); },
            onError:   () => { setFlash({ ok: false, msg: 'Failed to send.' }); setWSending(false); },
        });
    };

    const isDailyConfigured  = (c) => (c.schedule_email_recipients ?? []).filter(Boolean).length > 0;
    const isWeeklyConfigured = (c) => (c.weekly_email_recipients   ?? []).filter(Boolean).length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Schedule Email" />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">

                {/* ── Sidebar ── */}
                <div className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
                    <div className="px-4 py-4 border-b border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Children</p>
                    </div>
                    <div className="flex-1 py-2">
                        {children.map((c) => {
                            const photo  = normalizePhoto(c.photo);
                            const active = selected?.id === c.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => selectChild(c)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-indigo-50 border-r-2 border-indigo-500' : 'hover:bg-gray-50'}`}
                                >
                                    {photo ? (
                                        <img src={photo} alt={c.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {c.name[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${active ? 'text-indigo-700' : 'text-gray-800'}`}>{c.name}</p>
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            {isDailyConfigured(c)  && <p className="text-xs text-emerald-500">✓ Daily</p>}
                                            {isWeeklyConfigured(c) && <p className="text-xs text-blue-500">✓ Weekly</p>}
                                            {!isDailyConfigured(c) && !isWeeklyConfigured(c) && <p className="text-xs text-gray-400">Not configured</p>}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right panel ── */}
                {selected ? (
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">

                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{selected.name} — Schedule Email</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Configure automated schedule emails for this child.</p>
                            </div>

                            {flash && (
                                <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${flash.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {flash.msg}
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-1 bg-gray-200 rounded-xl p-1">
                                <button onClick={() => setTab('daily')}  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === 'daily'  ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Daily Schedule</button>
                                <button onClick={() => setTab('weekly')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === 'weekly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Weekly Summary</button>
                            </div>

                            {/* ── DAILY TAB ── */}
                            {tab === 'daily' && (
                                <>
                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm font-semibold text-gray-700">Daily Email Settings</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Sent daily at the configured IST time with that day's shift schedule.</p>
                                        </div>
                                        <div className="px-6 py-5 space-y-5">
                                            <RecipientsSection to={to} cc={cc} bcc={bcc} onTo={setTo} onCc={setCc} onBcc={setBcc} />
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">
                                                    Email Subject
                                                    <span className="ml-2 text-gray-400 normal-case font-normal">Use <code className="bg-gray-100 px-1 rounded">{'{child_name}'}</code> and <code className="bg-gray-100 px-1 rounded">{'{date}'}</code></span>
                                                </label>
                                                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder={`${selected.name} Schedule: {date}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">Daily Send Time <span className="font-normal text-gray-400">(IST)</span></label>
                                                <input type="time" className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" value={time} onChange={(e) => setTime(e.target.value)} />
                                            </div>
                                            <div className="pt-1">
                                                <button type="button" onClick={save} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Save Settings</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm font-semibold text-gray-700">Email Preview</p>
                                        </div>
                                        <div className="px-6 py-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} />
                                                <button type="button" onClick={loadPreview} disabled={loadingPreview} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
                                                    {loadingPreview ? 'Loading…' : 'Preview Email'}
                                                </button>
                                            </div>
                                            {preview && (
                                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-400 font-medium">Email body preview</div>
                                                    <iframe srcDoc={preview} className="w-full" style={{ height: '420px', border: 'none' }} title="Daily Email Preview" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-orange-100 bg-orange-50">
                                            <p className="text-sm font-semibold text-orange-700">Send Now</p>
                                        </div>
                                        <div className="px-6 py-5">
                                            <p className="text-sm text-gray-500 mb-4">Manually trigger a daily schedule email.</p>
                                            <div className="flex items-center gap-3">
                                                <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none" value={sendDate} onChange={(e) => setSendDate(e.target.value)} />
                                                <button type="button" onClick={sendNow} disabled={sending || to.filter(Boolean).length === 0} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-40">
                                                    {sending ? 'Sending…' : 'Send Email Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── WEEKLY TAB ── */}
                            {tab === 'weekly' && (
                                <>
                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm font-semibold text-gray-700">Weekly Email Settings</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Sent once per week with staff totals, extra hours, and day-by-day schedule.</p>
                                        </div>
                                        <div className="px-6 py-5 space-y-5">
                                            <RecipientsSection to={wTo} cc={wCc} bcc={wBcc} onTo={setWTo} onCc={setWCc} onBcc={setWBcc} />
                                            <div>
                                                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">
                                                    Email Subject
                                                    <span className="ml-2 text-gray-400 normal-case font-normal">Use <code className="bg-gray-100 px-1 rounded">{'{child_name}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{start_date}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{end_date}'}</code></span>
                                                </label>
                                                <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" placeholder={`${selected.name} Weekly Schedule: {start_date} – {end_date}`} value={wSubject} onChange={(e) => setWSubject(e.target.value)} />
                                            </div>
                                            <div className="flex gap-6 flex-wrap">
                                                <div>
                                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">Send Time <span className="font-normal text-gray-400">(IST)</span></label>
                                                    <input type="time" className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" value={wTime} onChange={(e) => setWTime(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">Send Day</label>
                                                    <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none" value={wDay} onChange={(e) => setWDay(Number(e.target.value))}>
                                                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="pt-1">
                                                <button type="button" onClick={wSave} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Save Settings</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm font-semibold text-gray-700">Email Preview</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Shows the 7 days starting from the selected date.</p>
                                        </div>
                                        <div className="px-6 py-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none" value={wPreviewDate} onChange={(e) => setWPreviewDate(e.target.value)} />
                                                <button type="button" onClick={wLoadPreview} disabled={wLoadingPreview} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
                                                    {wLoadingPreview ? 'Loading…' : 'Preview Email'}
                                                </button>
                                            </div>
                                            {wPreview && (
                                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-400 font-medium">Email body preview</div>
                                                    <iframe srcDoc={wPreview} className="w-full" style={{ height: '520px', border: 'none' }} title="Weekly Email Preview" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-orange-100 bg-orange-50">
                                            <p className="text-sm font-semibold text-orange-700">Send Now</p>
                                        </div>
                                        <div className="px-6 py-5">
                                            <p className="text-sm text-gray-500 mb-4">Manually trigger a weekly summary email. Covers 7 days from the selected date.</p>
                                            <div className="flex items-center gap-3">
                                                <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none" value={wSendDate} onChange={(e) => setWSendDate(e.target.value)} />
                                                <button type="button" onClick={wSendNow} disabled={wSending || wTo.filter(Boolean).length === 0} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-40">
                                                    {wSending ? 'Sending…' : 'Send Email Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <p className="text-sm">Select a child from the left to configure.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
