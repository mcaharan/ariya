import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

function normalizePhoto(photo) {
    if (!photo) return null;
    if (/^https?:\/\//.test(photo)) return photo;
    if (photo.startsWith('/storage/')) return photo;
    if (photo.startsWith('storage/')) return '/' + photo;
    if (photo.startsWith('/')) return '/storage' + photo;
    return '/storage/' + photo;
}

function initials(name) {
    return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-blue-600',
];

function getGradient(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[h];
}

/* ── Schedule countdown ── */
function ScheduleCard({ count }) {
    const [countdown, setCountdown] = useState('');
    const [nextRun, setNextRun] = useState('');

    useEffect(() => {
        function calc() {
            const now = new Date();
            // Next 1:30 PM IST = UTC 08:00
            const target = new Date();
            target.setUTCHours(8, 0, 0, 0);
            if (now.getTime() >= target.getTime()) {
                target.setUTCDate(target.getUTCDate() + 1);
            }
            const diff = target - now;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);

            // Format next run in local time
            setNextRun(target.toLocaleString('en-IN', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
                timeZone: 'Asia/Kolkata',
            }));
        }
        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="rounded-2xl bg-white border border-orange-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <svg className="h-7 w-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">Daily Schedule Email</p>
                    <p className="text-sm text-gray-500 mt-0.5">Runs every day at <span className="font-semibold text-orange-600">1:30 PM IST</span></p>
                    {nextRun && <p className="text-xs text-gray-400 mt-1">Next: {nextRun}</p>}
                    {count > 0
                        ? <p className="text-xs text-emerald-600 font-medium mt-1">✓ {count} child{count !== 1 ? 'ren' : ''} configured</p>
                        : <p className="text-xs text-red-400 font-medium mt-1">No recipients configured yet</p>
                    }
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 mb-1">Next run in</p>
                    <p className="font-mono text-lg font-bold text-orange-600 tabular-nums">{countdown}</p>
                </div>
            </div>
        </div>
    );
}

/* ── Superadmin dashboard ── */
function SuperadminDashboard({ user, scheduleEmailCount }) {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col">

            {/* Hero */}
            <div className="bg-white border-b border-gray-100 px-8 py-10">
                <div className="max-w-4xl mx-auto">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Admin Portal</p>
                    <h1 className="text-3xl font-black text-gray-900 mb-1">
                        Welcome back, <span className="text-indigo-600">{user.name}</span>
                    </h1>
                    <p className="text-sm text-gray-500">Manage your team, children, and system settings from here.</p>
                </div>
            </div>

            {/* Quick action cards */}
            <div className="flex-1 px-8 py-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Scheduled Tasks</p>
                        <ScheduleCard count={scheduleEmailCount} />
                    </div>
                    <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Quick Actions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        <Link href={route('children.index')}
                            className="group flex items-center gap-5 rounded-2xl bg-white border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                                <svg className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">Manage Children</p>
                                <p className="text-sm text-gray-500 mt-0.5">View, add, and configure children profiles</p>
                            </div>
                            <svg className="h-5 w-5 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </Link>

                        <Link href={route('users.index')}
                            className="group flex items-center gap-5 rounded-2xl bg-white border border-gray-200 p-6 hover:border-violet-300 hover:shadow-md transition-all">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
                                <svg className="h-7 w-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">Manage Users</p>
                                <p className="text-sm text-gray-500 mt-0.5">Add staff, set permissions, assign children</p>
                            </div>
                            <svg className="h-5 w-5 text-gray-300 group-hover:text-violet-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </Link>

                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Regular user child selector ── */
function ChildSelector({ assignedChildren }) {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col items-center justify-start pt-16 px-6 pb-12">

            {/* Logo + title */}
            <div className="mb-10 flex flex-col items-center gap-3">
                <img src="/images/tracker.png" alt="Ariya Tracker" className="h-16 object-contain" />
                <p className="text-sm text-gray-500 font-medium">Select a child to get started</p>
            </div>

            {assignedChildren.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No child assigned yet</p>
                    <p className="text-sm text-gray-400">Contact your administrator to get access.</p>
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-5 max-w-3xl">
                    {assignedChildren.map((child, idx) => {
                        const src = normalizePhoto(child.photo);
                        const grad = getGradient(child.name);
                        return (
                            <a
                                key={child.id}
                                href={route('children.show', child.id)}
                                className="group flex flex-col items-center gap-3 rounded-2xl bg-white border border-gray-200 px-6 py-6 w-40 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                            >
                                {/* Photo / avatar */}
                                <div className="relative">
                                    {src ? (
                                        <img
                                            src={src}
                                            alt={child.name}
                                            className="h-20 w-20 rounded-xl object-cover shadow-sm ring-2 ring-white group-hover:ring-indigo-100 transition-all"
                                        />
                                    ) : (
                                        <div className={`flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-2xl font-black text-white shadow-sm`}>
                                            {initials(child.name)}
                                        </div>
                                    )}
                                    {/* Active dot */}
                                    <span className="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full border-2 border-white bg-emerald-400"/>
                                </div>

                                {/* Name */}
                                <span className="text-sm font-semibold text-gray-800 text-center leading-tight w-full group-hover:text-indigo-700 transition-colors">
                                    {child.name}
                                </span>

                                {/* CTA */}
                                <span className="text-[11px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
                                    Open →
                                </span>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ assignedChildren = [], isSuperadmin = false, scheduleEmailCount = 0 }) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            {isSuperadmin
                ? <SuperadminDashboard user={user} scheduleEmailCount={scheduleEmailCount} />
                : <ChildSelector assignedChildren={assignedChildren} />
            }
        </AuthenticatedLayout>
    );
}
