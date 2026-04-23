import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';

/* ── Pill badge ── */
function PillBadge({ name, dosage }) {
    return (
        <div style={{
            display: 'flex',
            borderRadius: '9999px',
            overflow: 'hidden',
            height: '64px',
            width: '260px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '1px solid rgba(0,0,0,0.12)',
            position: 'relative',
        }}>
            <div style={{
                flex: '0 0 55%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom, #ef4444 0%, #dc2626 20%, #b91c1c 55%, #7f1d1d 100%)',
                color: '#fff',
                fontWeight: '700',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                textAlign: 'center',
                lineHeight: '1.25',
                padding: '0 18px',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none',
                }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{name}</span>
            </div>
            <div style={{
                flex: '0 0 45%',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 35%, #e0e0e0 70%, #d4d4d4 100%)',
                color: '#16a34a',
                fontWeight: '700',
                fontSize: '15px',
                textAlign: 'center',
                padding: '0 16px',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none',
                }} />
                <span style={{ position: 'relative', zIndex: 1 }}>{dosage}</span>
            </div>
        </div>
    );
}

/* ── Date helpers ── */
function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

function formatDisplay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── History calendar strip ── */
function HistoryStrip({ history, currentDate, today, onSelectDate }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">30-Day History</h3>
                <span className="text-xs text-gray-400">Tap a day to view</span>
            </div>
            <div className="p-4">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                    {history.map((day) => {
                        const isToday = day.date === today;
                        const isSelected = day.date === currentDate;
                        const pct = day.total > 0 ? day.confirmed / day.total : 0;
                        const isFull = pct === 1 && day.total > 0;
                        const isPartial = pct > 0 && pct < 1;
                        const isEmpty = pct === 0;
                        const isFuture = day.date > today;

                        let bg = '#f3f4f6';
                        let textColor = '#9ca3af';
                        if (!isFuture) {
                            if (isFull) { bg = '#16a34a'; textColor = '#fff'; }
                            else if (isPartial) { bg = '#fbbf24'; textColor = '#fff'; }
                            else { bg = '#fee2e2'; textColor = '#991b1b'; }
                        }

                        return (
                            <button
                                key={day.date}
                                onClick={() => !isFuture && onSelectDate(day.date)}
                                disabled={isFuture}
                                title={`${formatDisplay(day.date)} — ${day.confirmed}/${day.total} confirmed`}
                                style={{
                                    borderRadius: '8px',
                                    padding: '6px 2px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: isSelected ? '#1e40af' : bg,
                                    color: isSelected ? '#fff' : textColor,
                                    border: isToday && !isSelected ? '2px solid #6366f1' : '2px solid transparent',
                                    cursor: isFuture ? 'default' : 'pointer',
                                    opacity: isFuture ? 0.35 : 1,
                                    transition: 'transform 0.1s',
                                }}
                            >
                                <span style={{ fontSize: '9px', fontWeight: '600', lineHeight: 1 }}>
                                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1 }}>
                                    {new Date(day.date + 'T00:00:00').getDate()}
                                </span>
                                {!isFuture && day.total > 0 && (
                                    <span style={{ fontSize: '8px', lineHeight: 1, opacity: 0.85 }}>
                                        {day.confirmed}/{day.total}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
                    {[
                        { color: '#16a34a', label: 'All done' },
                        { color: '#fbbf24', label: 'Partial' },
                        { color: '#fee2e2', label: 'Missed', text: '#991b1b' },
                        { color: '#f3f4f6', label: 'Future', text: '#9ca3af' },
                    ].map(({ color, label, text }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#e0e7ff', border: '2px solid #6366f1' }} />
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>Today</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main page ── */
export default function Medication({ child, slots = [], confirmedSlotIds = [], date, today, history = [], headerImage = null }) {
    const [confirmed, setConfirmed] = useState(() => new Set(confirmedSlotIds));
    const [loading, setLoading] = useState(new Set());
    const [showHistory, setShowHistory] = useState(false);

    const isToday = date === today;
    const confirmedCount = slots.filter(s => confirmed.has(s.id)).length;

    function navigateDate(newDate) {
        router.get(route('children.medication', child.id), { date: newDate }, { preserveScroll: false });
    }

    function toggleConfirm(slot) {
        if (loading.has(slot.id)) return;
        setLoading((s) => new Set([...s, slot.id]));

        const wasConfirmed = confirmed.has(slot.id);
        setConfirmed((prev) => {
            const next = new Set(prev);
            wasConfirmed ? next.delete(slot.id) : next.add(slot.id);
            return next;
        });

        router.post(
            route('children.medication.confirm', { child: child.id, slot: slot.id }),
            { date },
            {
                preserveScroll: true,
                onFinish: () => setLoading((s) => { const n = new Set(s); n.delete(slot.id); return n; }),
                onError: () => {
                    setConfirmed((prev) => {
                        const next = new Set(prev);
                        wasConfirmed ? next.add(slot.id) : next.delete(slot.id);
                        return next;
                    });
                },
            }
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Medication — ${child.name}`} />

            <div className="min-h-[calc(100vh-64px)]" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5e9 100%)' }}>

                <PageHeader
                    headerImage={headerImage}
                    backHref={route('children.show', child.id)}
                    title="Medication"
                />

                {/* Date navigation */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
                    <button
                        onClick={() => navigateDate(addDays(date, -1))}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-base leading-tight">{formatDisplay(date)}</p>
                            {isToday && <span className="text-xs font-semibold text-indigo-600">Today</span>}
                        </div>
                        {!isToday && (
                            <button
                                onClick={() => navigateDate(today)}
                                className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                            >
                                Today
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => navigateDate(addDays(date, 1))}
                        disabled={date >= today}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                {slots.length > 0 && (
                    <div className="bg-white border-b border-gray-100 px-6 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
                            <span className="text-xs font-bold text-gray-700">{confirmedCount} / {slots.length} confirmed</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${slots.length ? (confirmedCount / slots.length) * 100 : 0}%`,
                                    background: 'linear-gradient(to right, #16a34a, #4ade80)',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-5">
                    {slots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <svg className="h-16 w-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-sm font-semibold">No medication slots added yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {slots.map((slot) => {
                                const isDone = confirmed.has(slot.id);
                                const isLoading = loading.has(slot.id);
                                const isSpecial = !!slot.sub_label;

                                return (
                                    <div
                                        key={slot.id}
                                        className="rounded-2xl overflow-hidden transition-all duration-300"
                                        style={{
                                            background: isDone ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                                            boxShadow: isDone
                                                ? '0 4px 20px rgba(22,163,74,0.15), 0 1px 4px rgba(0,0,0,0.06)'
                                                : '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                                            border: isDone ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                                            borderBottom: `4px solid ${isDone ? '#16a34a' : '#22c55e'}`,
                                        }}
                                    >
                                        {/* Card header */}
                                        <div className="flex items-center justify-between px-6 py-5">
                                            <div>
                                                <p className="font-bold text-xl leading-tight" style={{ color: isSpecial ? '#dc2626' : '#111827' }}>
                                                    {slot.time_label}
                                                </p>
                                                {slot.sub_label && (
                                                    <p className="text-sm text-gray-500 mt-0.5">{slot.sub_label}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => toggleConfirm(slot)}
                                                disabled={isLoading}
                                                className="transition-all duration-200 disabled:opacity-60"
                                                style={{
                                                    borderRadius: '10px',
                                                    padding: '8px 20px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    border: isDone ? '1.5px solid #16a34a' : '1.5px solid #d1d5db',
                                                    background: isDone ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#ffffff',
                                                    color: isDone ? '#ffffff' : '#374151',
                                                    boxShadow: isDone ? '0 2px 8px rgba(22,163,74,0.35)' : '0 1px 3px rgba(0,0,0,0.08)',
                                                    cursor: isLoading ? 'wait' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                }}
                                            >
                                                {isDone && (
                                                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                {isDone ? 'Confirmed' : 'Confirm'}
                                            </button>
                                        </div>

                                        <div style={{ height: '1px', background: isDone ? '#bbf7d0' : '#f0f0f0', margin: '0 24px' }} />

                                        {/* Pills */}
                                        <div style={{ padding: '32px 24px 40px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                                            {slot.items.map((item) => (
                                                <PillBadge key={item.id} name={item.name} dosage={item.dosage} />
                                            ))}
                                            {slot.items.length === 0 && (
                                                <p className="text-xs text-gray-400 italic">No medications in this slot.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* History toggle */}
                    {history.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowHistory((v) => !v)}
                                className="w-full flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
                                        <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-gray-800 text-sm">30-Day History</span>
                                </div>
                                <svg
                                    className={`h-5 w-5 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showHistory && (
                                <div className="mt-3">
                                    <HistoryStrip
                                        history={history}
                                        currentDate={date}
                                        today={today}
                                        onSelectDate={navigateDate}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
