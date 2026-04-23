import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';

function normalizeStorage(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith('/storage/')) return path;
    if (path.startsWith('storage/')) return '/' + path;
    return '/storage/' + path;
}

function isYouTube(url) {
    return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbed(url) {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function PopupContent({ item }) {
    const type = item.content_type || 'text';
    const value = item.content_value;

    if (type === 'text') {
        return item.content ? (
            <p className="text-gray-600 text-base whitespace-pre-line">{item.content}</p>
        ) : null;
    }
    if (type === 'image') {
        const src = normalizeStorage(value);
        return src ? <img src={src} alt={item.title} className="max-h-64 w-full object-contain rounded-lg" /> : null;
    }
    if (type === 'video') {
        if (!value) return null;
        if (isYouTube(value)) {
            const embed = youtubeEmbed(value);
            return embed ? (
                <div className="aspect-video w-full">
                    <iframe src={embed} className="h-full w-full rounded-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
            ) : null;
        }
        return <video src={normalizeStorage(value)} controls autoPlay className="w-full rounded-lg max-h-64" />;
    }
    if (type === 'link') {
        const src = normalizeStorage(value) || value;
        return src ? (
            <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Open Link
            </a>
        ) : null;
    }
    return null;
}

function QuizPopup({ item, onClose }) {
    const questions = (() => { try { const q = JSON.parse(item.content_value || '[]'); return Array.isArray(q) ? q : []; } catch { return []; } })();
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);

    if (questions.length === 0) {
        return (
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-8 flex flex-col items-center text-center">
                <p className="text-gray-500 text-sm">No questions available.</p>
                <button onClick={onClose} className="mt-4 rounded-lg border border-gray-300 px-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
        );
    }

    const q = questions[current];
    const isCorrect = selected === q.correct;
    const progress = Math.round(((current + (confirmed ? 1 : 0)) / questions.length) * 100);

    function confirm() {
        if (selected === null) return;
        if (isCorrect) setScore(s => s + 1);
        setConfirmed(true);
    }

    function next() {
        if (current + 1 >= questions.length) {
            setDone(true);
        } else {
            setCurrent(c => c + 1);
            setSelected(null);
            setConfirmed(false);
        }
    }

    function retry() {
        setCurrent(0); setSelected(null); setConfirmed(false); setScore(0); setDone(false);
    }

    return (
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                    <img src={`/storage/${item.icon_path}`} alt={item.title} className="h-8 w-8 object-contain" />
                    <h2 className="font-semibold text-gray-900">{item.title}</h2>
                </div>
                <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{done ? 'Complete' : `Question ${current + 1} of ${questions.length}`}</span>
                        <span>{score}/{questions.length} correct</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {done ? (
                    <div className="flex flex-col items-center py-6 text-center gap-3">
                        <div className={`text-5xl font-bold ${score === questions.length ? 'text-green-500' : score >= questions.length / 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {score}/{questions.length}
                        </div>
                        <p className="text-gray-600 text-sm">{score === questions.length ? 'Perfect score!' : score >= questions.length / 2 ? 'Good job!' : 'Keep practicing!'}</p>
                        <div className="flex gap-3 mt-2">
                            <button onClick={retry} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Retry</button>
                            <button onClick={onClose} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Done</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-800 font-medium mb-4">{q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                                let cls = 'w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-colors ';
                                if (!confirmed) {
                                    cls += selected === oi ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-gray-700';
                                } else {
                                    if (oi === q.correct) cls += 'border-green-500 bg-green-50 text-green-700 font-semibold';
                                    else if (oi === selected) cls += 'border-red-400 bg-red-50 text-red-600';
                                    else cls += 'border-gray-200 bg-white text-gray-400';
                                }
                                return (
                                    <button key={oi} type="button" disabled={confirmed} onClick={() => setSelected(oi)} className={cls}>
                                        <span className="mr-2 font-semibold">{String.fromCharCode(65 + oi)}.</span>{opt}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex justify-end">
                            {!confirmed ? (
                                <button onClick={confirm} disabled={selected === null} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    Confirm
                                </button>
                            ) : (
                                <button onClick={next} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                                    {current + 1 >= questions.length ? 'See Results' : 'Next →'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function TeamTraining({ child, teamItems = [], headerImage = null }) {
    const [popup, setPopup] = useState(null);

    function handleClick(e, item) {
        const hasSubItems = item.sub_items && item.sub_items.length > 0;
        if (hasSubItems) return; // navigate normally

        e.preventDefault();

        if (item.content_type === 'quiz') {
            router.get(route('children.team-training.quiz', { child: child.id, teamItem: item.id }));
            return;
        }

        if (item.content_type === 'map' && item.content_value) {
            router.get(route('children.team-training.inner', { child: child.id, teamItem: item.content_value }));
            return;
        }

        setPopup(item);
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Team Training — ${child.name}`} />

            <div className="min-h-[calc(100vh-64px)] bg-gray-100">

                <PageHeader
                    headerImage={headerImage}
                    backHref={route('children.show', child.id)}
                    icon="/images/dashboard/team.png"
                    title={child.team_title || 'Team Training'}
                />

                {/* Icon grid */}
                <div className="px-8 py-6">
                    {teamItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <svg className="h-14 w-14 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm font-medium">No items added yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center gap-5">
                            {teamItems.map((item, idx) => (
                                <Link
                                    key={item.id ?? idx}
                                    href={route('children.team-training.inner', { child: child.id, teamItem: item.id })}
                                    onClick={(e) => handleClick(e, item)}
                                    className="group flex items-center justify-center"
                                    style={{ width: 'calc(18% - 18px)' }}
                                >
                                    <img
                                        src={`/storage/${item.icon_path}`}
                                        alt={item.title}
                                        className="w-full h-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                                    />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Popup */}
            {popup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setPopup(null)} />

                    {popup.content_type === 'pdf' ? (
                        <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl" style={{ height: '90vh' }}>
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
                                <div className="flex items-center gap-3">
                                    <img src={`/storage/${popup.icon_path}`} alt={popup.title} className="h-8 w-8 object-contain" />
                                    <h2 className="font-semibold text-gray-900">{popup.title}</h2>
                                </div>
                                <button onClick={() => setPopup(null)} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <iframe src={normalizeStorage(popup.content_value)} className="flex-1 w-full rounded-b-2xl" title={popup.title} />
                        </div>
                    ) : (
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm px-8 py-8 flex flex-col items-center text-center">
                            <div className="absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-white">
                                <img src={`/storage/${popup.icon_path}`} alt={popup.title} className="h-10 w-10 object-contain" />
                            </div>
                            <div className="mt-8 w-full space-y-4">
                                <h2 className="text-lg font-bold text-gray-900">{popup.title}</h2>
                                <PopupContent item={popup} />
                            </div>
                            <button onClick={() => setPopup(null)} className="mt-6 rounded-lg border border-gray-300 px-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Close</button>
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
