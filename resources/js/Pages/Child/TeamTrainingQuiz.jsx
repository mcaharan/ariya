import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function TeamTrainingQuiz({ child, item, questions = [], backRoute }) {
    const total    = questions.length;
    const initTime = Math.max(total * 60, 60);

    const [current,   setCurrent]   = useState(0);
    const [answers,   setAnswers]   = useState(Array(total).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft,  setTimeLeft]  = useState(initTime);

    useEffect(() => {
        if (submitted || total === 0) return;
        const t = setInterval(() => {
            setTimeLeft(s => {
                if (s <= 1) { clearInterval(t); setSubmitted(true); return 0; }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [submitted, total]);

    const mm       = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const ss       = String(timeLeft % 60).padStart(2, '0');
    const answered = answers.filter(a => a !== null).length;
    const score    = submitted ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0) : 0;
    const pct      = total > 0 ? Math.round((score / total) * 100) : 0;
    const timerPct = Math.round((timeLeft / initTime) * 100);

    const BLUE  = '#3d5a99';
    const GREEN = '#16a34a';

    function select(oi) {
        if (submitted) return;
        const next = [...answers];
        next[current] = oi;
        setAnswers(next);
    }

    function goNext() { if (current < total - 1) setCurrent(c => c + 1); }

    function submit() { setSubmitted(true); }

    function retry() {
        setAnswers(Array(total).fill(null));
        setCurrent(0);
        setSubmitted(false);
        setTimeLeft(initTime);
    }

    const q = questions[current];

    /* ── circular SVG timer ── */
    const R   = 36;
    const C   = 2 * Math.PI * R;
    const dash = C * (1 - timerPct / 100);
    const timerColor = timeLeft < 60 ? '#ef4444' : timeLeft < initTime * 0.25 ? '#f59e0b' : BLUE;

    return (
        <AuthenticatedLayout>
            <Head title={`${item.title} Quiz — ${child.name}`} />

            <div className="min-h-[calc(100vh-64px)] bg-slate-100 flex flex-col">

                {/* ── Header ── */}
                {item.header_image ? (
                    <div className="shrink-0 relative">
                        <img src={`/storage/${item.header_image}`} alt={item.title} className="w-full object-cover max-h-32" />
                        <div className="absolute top-2 left-3">
                            <Link href={backRoute} className="rounded-lg bg-black/30 hover:bg-black/50 px-3 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 backdrop-blur-sm">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                Back
                            </Link>
                        </div>
                        <div className="absolute top-2 right-3">
                            <span className="text-xs font-semibold bg-black/30 text-white backdrop-blur-sm rounded-full px-3 py-1">
                                {answered} / {total} Answered
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="shrink-0 flex items-center justify-between px-6 py-3 text-white" style={{ background: BLUE }}>
                        <div className="flex items-center gap-3">
                            <Link href={backRoute} className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                Back
                            </Link>
                            <div className="flex items-center gap-2">
                                <img src={`/storage/${item.icon_path}`} alt={item.title} className="h-7 w-7 object-contain rounded" />
                                <span className="font-bold tracking-widest text-sm uppercase" style={{ fontFamily: 'Conthrax, sans-serif' }}>
                                    {item.title}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs font-semibold bg-white/20 rounded-full px-3 py-1">
                            {answered} / {total} Answered
                        </span>
                    </div>
                )}

                {total === 0 ? (
                    <div className="flex flex-1 items-center justify-center flex-col gap-3 text-gray-400">
                        <svg className="h-12 w-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="font-medium">No questions added yet.</p>
                        <Link href={backRoute} className="text-sm text-indigo-600 hover:underline">Go back</Link>
                    </div>

                ) : submitted ? (
                    /* ══ Results ══ */
                    <div className="flex-1 overflow-y-auto py-8 px-4">
                        <div className="max-w-2xl mx-auto space-y-5">

                            {/* Score card */}
                            <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
                                <div className="px-8 py-8 flex flex-col items-center text-center" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #2e4480 100%)` }}>
                                    {/* Circular score */}
                                    <div className="relative mb-4">
                                        <svg width="120" height="120" className="-rotate-90">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                                            <circle
                                                cx="60" cy="60" r="50" fill="none"
                                                stroke={pct === 100 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'}
                                                strokeWidth="8" strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 50}`}
                                                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                                                style={{ transition: 'stroke-dashoffset 1s ease' }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                            <span className="text-2xl font-bold">{pct}%</span>
                                            <span className="text-xs opacity-70">{score}/{total}</span>
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        {pct === 100 ? 'Perfect Score!' : pct >= 50 ? 'Good Job!' : 'Keep Practicing!'}
                                    </h2>
                                    <p className="text-white/70 text-sm">{child.name}</p>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                                    <div className="py-4 text-center">
                                        <div className="text-xl font-bold text-green-600">{score}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Correct</div>
                                    </div>
                                    <div className="py-4 text-center">
                                        <div className="text-xl font-bold text-red-500">{answers.filter((a, i) => a !== null && a !== questions[i]?.correct).length}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Wrong</div>
                                    </div>
                                    <div className="py-4 text-center">
                                        <div className="text-xl font-bold text-gray-400">{answers.filter(a => a === null).length}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Skipped</div>
                                    </div>
                                </div>

                                <div className="px-8 py-5 flex justify-center gap-3 border-t border-gray-100">
                                    <button onClick={retry} className="rounded-xl border-2 border-gray-200 px-8 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                                        Try Again
                                    </button>
                                    <Link href={backRoute} className="rounded-xl text-white px-8 py-2.5 text-sm font-semibold hover:opacity-90 transition-colors" style={{ background: BLUE }}>
                                        Done
                                    </Link>
                                </div>
                            </div>

                            {/* Question review */}
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">Review Answers</h3>
                            {questions.map((q, qi) => {
                                const userAns = answers[qi];
                                const isCorrect = userAns === q.correct;
                                const skipped   = userAns === null;
                                return (
                                    <div key={qi} className={`rounded-xl bg-white shadow-sm border-l-4 overflow-hidden ${isCorrect ? 'border-green-500' : skipped ? 'border-gray-300' : 'border-red-400'}`}>
                                        <div className="px-5 py-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${isCorrect ? 'bg-green-500' : skipped ? 'bg-gray-300' : 'bg-red-400'}`}>
                                                    {isCorrect ? '✓' : skipped ? '–' : '✗'}
                                                </span>
                                                <p className="font-medium text-gray-800 text-sm leading-snug">
                                                    <span className="text-gray-400 mr-1.5 font-normal">Q{qi + 1}.</span>{q.question}
                                                </p>
                                            </div>
                                            <div className="space-y-1.5 pl-9">
                                                {(q.options || []).map((opt, oi) => {
                                                    const isRight   = oi === q.correct;
                                                    const isChosen  = oi === userAns;
                                                    let cls = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm ';
                                                    if (isRight)        cls += 'bg-green-50 text-green-700 font-semibold';
                                                    else if (isChosen)  cls += 'bg-red-50 text-red-600';
                                                    else                cls += 'text-gray-400';
                                                    return (
                                                        <div key={oi} className={cls}>
                                                            <span className="font-bold w-5 shrink-0">{String.fromCharCode(65 + oi)}.</span>
                                                            <span className="flex-1">{opt}</span>
                                                            {isRight  && <span className="text-green-500 text-xs">✓ correct</span>}
                                                            {isChosen && !isRight && <span className="text-red-400 text-xs">✗ your answer</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                ) : (
                    /* ══ Active Quiz ══ */
                    <div className="flex flex-1 overflow-hidden">

                        {/* Left: question */}
                        <div className="flex-1 flex flex-col bg-white min-w-0">

                            {/* Progress bar */}
                            <div className="h-1 bg-gray-100 shrink-0">
                                <div className="h-1 transition-all duration-500" style={{ width: `${(answered / total) * 100}%`, background: BLUE }} />
                            </div>

                            {/* Question */}
                            <div className="flex-1 overflow-y-auto px-10 py-8">
                                {/* Q number badge */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold text-white shrink-0" style={{ background: BLUE }}>
                                        {current + 1}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">of {total} questions</span>
                                </div>

                                <p className="text-gray-800 text-lg font-medium leading-relaxed mb-8">{q.question}</p>

                                {/* Option cards */}
                                <div className="space-y-3">
                                    {(q.options || []).map((opt, oi) => {
                                        const chosen = answers[current] === oi;
                                        return (
                                            <button
                                                key={oi}
                                                type="button"
                                                onClick={() => select(oi)}
                                                className="w-full text-left flex items-center gap-4 rounded-xl border-2 px-5 py-3.5 transition-all duration-150"
                                                style={{
                                                    borderColor: chosen ? BLUE : '#e5e7eb',
                                                    background:  chosen ? '#eef2ff' : '#fff',
                                                    color:       chosen ? BLUE     : '#374151',
                                                }}
                                            >
                                                <span
                                                    className="shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                                                    style={{
                                                        borderColor: chosen ? BLUE : '#d1d5db',
                                                        background:  chosen ? BLUE : 'transparent',
                                                        color:       chosen ? '#fff' : '#9ca3af',
                                                    }}
                                                >
                                                    {String.fromCharCode(65 + oi)}
                                                </span>
                                                <span className="text-sm font-medium">{opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bottom nav */}
                            <div className="shrink-0 border-t border-gray-100 px-10 py-4 flex items-center justify-between">
                                <button
                                    onClick={() => current > 0 && setCurrent(c => c - 1)}
                                    disabled={current === 0}
                                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    Previous
                                </button>

                                {current < total - 1 ? (
                                    <button
                                        onClick={goNext}
                                        className="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                                        style={{ background: BLUE }}
                                    >
                                        Next
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={submit}
                                        className="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                                        style={{ background: GREEN }}
                                    >
                                        Submit Quiz
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right: sidebar */}
                        <div className="w-60 shrink-0 border-l border-gray-200 bg-slate-50 flex flex-col p-4 gap-4 overflow-y-auto">

                            {/* Circular timer */}
                            <div className="flex flex-col items-center gap-1 py-3">
                                <div className="relative">
                                    <svg width="88" height="88" className="-rotate-90">
                                        <circle cx="44" cy="44" r={R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
                                        <circle
                                            cx="44" cy="44" r={R} fill="none"
                                            stroke={timerColor} strokeWidth="7" strokeLinecap="round"
                                            strokeDasharray={C}
                                            strokeDashoffset={dash}
                                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-lg font-bold tabular-nums" style={{ color: timerColor }}>{mm}:{ss}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">Time Remaining</span>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={submit}
                                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
                                style={{ background: GREEN }}
                            >
                                Submit Quiz
                            </button>

                            {/* Legend */}
                            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-400"></span> Current</span>
                                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }}></span> Done</span>
                                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-200"></span> Left</span>
                            </div>

                            {/* Question number grid */}
                            <div className="grid grid-cols-5 gap-1.5">
                                {questions.map((_, qi) => {
                                    const isAnswered = answers[qi] !== null;
                                    const isCurrent  = qi === current;
                                    return (
                                        <button
                                            key={qi}
                                            type="button"
                                            onClick={() => setCurrent(qi)}
                                            className="rounded-lg border text-xs font-bold py-1.5 text-center transition-all duration-150"
                                            style={{
                                                background:   isCurrent  ? '#fbbf24' : isAnswered ? BLUE : '#fff',
                                                borderColor:  isCurrent  ? '#fbbf24' : isAnswered ? BLUE : '#d1d5db',
                                                color:        isCurrent || isAnswered ? '#fff' : '#6b7280',
                                                transform:    isCurrent ? 'scale(1.1)' : 'scale(1)',
                                                boxShadow:    isCurrent ? '0 2px 8px rgba(251,191,36,0.5)' : isAnswered ? `0 1px 4px rgba(61,90,153,0.3)` : 'none',
                                            }}
                                        >
                                            {qi + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
