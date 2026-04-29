import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import Sidebar from '@/Components/Sidebar';
import { ToastProvider } from '@/Components/Toast';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const menuPermissions = usePage().props.auth.menuPermissions || [];
    const canAccess = (menuKey) => menuPermissions.includes(menuKey);
    const rawRole = (user?.role || '').toString().toLowerCase();
    const normalizedRole = rawRole.replace(/[-_]/g, ' ').trim();
    const compactRole = normalizedRole.replace(/\s+/g, '');
    const isSuperadmin = compactRole === 'superadmin' || (normalizedRole.includes('super') && normalizedRole.includes('admin'));
    const isSubUser = compactRole === 'subuser' || normalizedRole === 'sub user' || (!compactRole && !!user);

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Superadmin gets sidebar layout
    if (isSuperadmin) {
        return (
            <ToastProvider>
            <div className="flex min-h-screen bg-gray-100">

                {/* Sidebar — desktop */}
                <div className="hidden sm:flex sm:flex-shrink-0">
                    <Sidebar user={user} />
                </div>

                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 flex sm:hidden">
                        <div
                            className="fixed inset-0 bg-gray-600 bg-opacity-75"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className="relative flex w-64 flex-shrink-0 flex-col">
                            <Sidebar user={user} />
                        </div>
                    </div>
                )}

                {/* Main content area */}
                <div className="flex flex-1 flex-col min-w-0">
                    <nav className="border-b border-gray-100 bg-white relative z-30">
                        <div className="w-full px-4 sm:px-6 lg:px-8">
                            <div className="flex h-16 justify-between">

                                {/* Mobile: hamburger + logo */}
                                <div className="flex items-center sm:hidden">
                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                                    >
                                        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                    <Link href="/" className="ms-2">
                                        <ApplicationLogo className="block h-8 w-auto fill-current text-gray-800" />
                                    </Link>
                                </div>

                                <div className="hidden sm:flex sm:flex-1" />

                                {/* User dropdown */}
                                <div className="flex items-center">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                                >
                                                    {user.name}
                                                    <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                            <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {header && (
                        <header className="bg-white shadow">
                            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                        </header>
                    )}

                    <main className="flex-1 py-6">{children}</main>
                </div>
            </div>
            </ToastProvider>
        );
    }

    // Regular users get top navbar layout
    return (
        <ToastProvider>
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white relative z-50">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                {canAccess('dashboard') && (
                                    <NavLink
                                        href={route('dashboard')}
                                        active={route().current('dashboard')}
                                    >
                                        Dashboard
                                    </NavLink>
                                )}
                                {canAccess('children') && (
                                    <NavLink
                                        href={route('children.index')}
                                        active={route().current('children.*')}
                                    >
                                        Child
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            {isSubUser && !route().current('children.menu') && (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 me-4"
                                >
                                    Switch Child
                                </Link>
                            )}
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}
                                                <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown(prev => !prev)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    <path className={showingNavigationDropdown ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="space-y-1 pb-3 pt-2">
                        {canAccess('dashboard') && (
                            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                                Dashboard
                            </ResponsiveNavLink>
                        )}
                        {canAccess('users') && (
                            <ResponsiveNavLink href={route('users.index')} active={route().current('users.*')}>
                                Users
                            </ResponsiveNavLink>
                        )}
                        {canAccess('children') && (
                            <ResponsiveNavLink href={route('children.index')} active={route().current('children.*')}>
                                Child
                            </ResponsiveNavLink>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">{user.name}</div>
                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">Log Out</ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <div>
                <div className="w-full">
                    <main className="py-6">{children}</main>
                </div>
            </div>
        </div>
        </ToastProvider>
    );
}
