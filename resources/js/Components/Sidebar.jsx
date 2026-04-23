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

function SidebarLink({ href, active, children }) {
    const base = "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full";
    const activeClass = "bg-white/10 text-white";
    const inactiveClass = "text-slate-400 hover:bg-white/5 hover:text-slate-200";

    return (
        <NavLink href={href} active={active} className={`${base} ${active ? activeClass : inactiveClass}`}>
            {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-400" />
            )}
            {children}
        </NavLink>
    );
}

function SectionLabel({ children }) {
    return (
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {children}
        </p>
    );
}

function Divider() {
    return <div className="my-3 border-t border-white/5" />;
}

function UserAvatar({ name }) {
    const initials = name
        ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-bold text-white shadow">
            {initials}
        </div>
    );
}

export default function Sidebar({ user }) {
    const { auth } = usePage().props;
    const menuPermissions = auth.menuPermissions || [];
    const canAccess = (menuKey) => menuPermissions.includes(menuKey);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900">

            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-3 px-5 border-b border-white/5">
                <Link href={route('dashboard')} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
                        <ApplicationLogo className="h-5 w-5 object-contain brightness-0 invert" />
                    </div>
                    <span className="text-base font-semibold tracking-tight text-white">Ariya</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">

                {canAccess('dashboard') && (
                    <div className="mb-2">
                        <SectionLabel>Main</SectionLabel>
                        <SidebarLink href={route('dashboard')} active={route().current('dashboard')}>
                            <Icon name="dashboard" className="h-[18px] w-[18px] shrink-0" />
                            <span>Dashboard</span>
                        </SidebarLink>
                    </div>
                )}

                {(canAccess('users') || canAccess('children')) && (
                    <>
                        <Divider />
                        <div className="mb-2">
                            <SectionLabel>Settings</SectionLabel>
                            <div className="space-y-0.5">
                                {canAccess('users') && (
                                    <SidebarLink href={route('users.index')} active={route().current('users.*')}>
                                        <Icon name="users" className="h-[18px] w-[18px] shrink-0" />
                                        <span>Users</span>
                                    </SidebarLink>
                                )}
                                {canAccess('children') && (
                                    <SidebarLink href={route('children.index')} active={route().current('children.*')}>
                                        <Icon name="child" className="h-[18px] w-[18px] shrink-0" />
                                        <span>Child</span>
                                    </SidebarLink>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </nav>

            {/* User footer */}
            <div className="shrink-0 border-t border-white/5 p-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                    <UserAvatar name={user.name} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{user.name}</p>
                        <p className="truncate text-xs text-slate-400">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Log out"
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <Icon name="logout" className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
