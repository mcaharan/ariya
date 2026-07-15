import NavLink from '@/Components/NavLink';
import { usePage, Link, router } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

function Icon({ name, className = 'h-5 w-5' }) {
    switch (name) {
        case 'dashboard':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                </svg>
            );
        case 'users':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" strokeWidth="1.8" />
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
            );
        case 'child':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            );
        case 'ariya':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        case 'upload':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            );
        case 'mail':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            );
        case 'device':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        case 'logout':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            );
        default:
            return null;
    }
}

const ICON_COLORS = {
    dashboard: 'bg-indigo-500/20 text-indigo-400',
    users:     'bg-violet-500/20 text-violet-400',
    child:     'bg-pink-500/20   text-pink-400',
    ariya:     'bg-cyan-500/20   text-cyan-400',
    upload:    'bg-amber-500/20  text-amber-400',
    mail:      'bg-orange-500/20 text-orange-400',
    device:    'bg-emerald-500/20 text-emerald-400',
};

const ICON_COLORS_ACTIVE = {
    dashboard: 'bg-indigo-500 text-white',
    users:     'bg-violet-500 text-white',
    child:     'bg-pink-500   text-white',
    ariya:     'bg-cyan-500   text-white',
    upload:    'bg-amber-500  text-white',
    mail:      'bg-orange-500 text-white',
    device:    'bg-emerald-500 text-white',
};

function SidebarLink({ href, active, iconName, children }) {
    const iconBg = active
        ? (ICON_COLORS_ACTIVE[iconName] ?? 'bg-indigo-500 text-white')
        : (ICON_COLORS[iconName] ?? 'bg-white/10 text-slate-400');

    return (
        <NavLink
            href={href}
            active={active}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full
                ${active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
        >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${iconBg}`}>
                <Icon name={iconName} className="h-4 w-4" />
            </span>
            <span className="flex-1">{children}</span>
            {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
            )}
        </NavLink>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="mb-2 mt-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            {children}
        </p>
    );
}

function Divider() {
    return <div className="my-4 border-t border-white/5" />;
}

function UserAvatar({ name }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
            {initials}
        </div>
    );
}

export default function Sidebar({ user }) {
    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    return (
        <div className="flex h-full w-64 flex-col" style={{ background: 'linear-gradient(180deg, #0f1629 0%, #111827 100%)' }}>

            {/* Brand header */}
            <div className="flex h-16 shrink-0 items-center px-5 border-b border-white/5">
                <Link href={route('dashboard')} className="flex items-center gap-3 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-500/50 group-hover:shadow-indigo-500/50 transition-shadow">
                        <ApplicationLogo className="h-5 w-5 object-contain brightness-0 invert" />
                    </div>
                    <div>
                        <p className="text-base font-bold tracking-tight text-white leading-none">Ariya</p>
                        <p className="text-[10px] font-medium text-indigo-400 tracking-widest uppercase leading-none mt-0.5">Admin Panel</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">

                <SectionLabel>Overview</SectionLabel>
                <SidebarLink href={route('dashboard')} active={route().current('dashboard')} iconName="dashboard">
                    Dashboard
                </SidebarLink>

                <Divider />
                <SectionLabel>People</SectionLabel>
                <div className="space-y-0.5">
                    <SidebarLink href={route('users.index')} active={route().current('users.*')} iconName="users">
                        Users
                    </SidebarLink>
                    <SidebarLink href={route('children.index')} active={route().current('children.index')} iconName="child">
                        Children
                    </SidebarLink>
                </div>

                <Divider />
                <SectionLabel>Content</SectionLabel>
                <div className="space-y-0.5">
                    <SidebarLink href={route('admin.content-manager')} active={route().current('admin.content-manager')} iconName="ariya">
                        Content Manager
                    </SidebarLink>
                    <SidebarLink href={route('admin.media-upload')} active={route().current('admin.media-upload')} iconName="upload">
                        Media Upload
                    </SidebarLink>
                    <SidebarLink href={route('admin.schedule-email')} active={route().current('admin.schedule-email')} iconName="mail">
                        Schedule Email
                    </SidebarLink>
                </div>

                <Divider />
                <SectionLabel>System</SectionLabel>
                <div className="space-y-0.5">
                    <SidebarLink href={route('admin.devices')} active={route().current('admin.devices*')} iconName="device">
                        Device Access
                    </SidebarLink>
                </div>

            </nav>

            {/* User footer */}
            <div className="shrink-0 border-t border-white/5 p-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 hover:bg-white/8 transition-colors">
                    <UserAvatar name={user.name} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white leading-none">{user.name}</p>
                        <p className="truncate text-xs text-slate-500 mt-1 leading-none">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Log out"
                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                        <Icon name="logout" className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
