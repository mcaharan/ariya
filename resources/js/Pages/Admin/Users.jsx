import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Users({ users, children = [], availableMenus, permissionsByUser }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'sub user',
        child_ids: [],
    });

    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
        processing: editing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({ id: null, name: '', email: '', password: '', role: 'sub user', child_ids: [] });

    const [showEdit, setShowEdit] = useState(false);

    function submit(e) {
        e.preventDefault();
        post(route('users.store'), {
            onSuccess: () => {
                reset('name', 'email', 'password', 'child_ids');
            },
        });
    }

    const toggleChild = (childId) => {
        const exists = data.child_ids.includes(childId);

        setData(
            'child_ids',
            exists
                ? data.child_ids.filter((id) => id !== childId)
                : [...data.child_ids, childId],
        );
    };

    const deleteUser = (id) => {
        router.delete(route('users.destroy', id));
    };

    const openEdit = (u) => {
        setEditData('id', u.id);
        setEditData('name', u.name || '');
        setEditData('email', u.email || '');
        setEditData('password', '');
        setEditData('role', u.role || 'sub user');
        setEditData('child_ids', (u.children || []).map((c) => c.id));
        setShowEdit(true);
    };

    const closeEdit = () => {
        resetEdit('id', 'name', 'email', 'password', 'role', 'child_ids');
        setShowEdit(false);
    };

    const toggleEditChild = (childId) => {
        const exists = (editData.child_ids || []).includes(childId);

        setEditData(
            'child_ids',
            exists ? editData.child_ids.filter((id) => id !== childId) : [...(editData.child_ids || []), childId],
        );
    };

    const submitEdit = (e) => {
        e.preventDefault();
        putEdit(route('users.update', editData.id), {
            onSuccess: () => closeEdit(),
        });
    };

    const [permissionMap, setPermissionMap] = useState(permissionsByUser || {});
    const [childMap, setChildMap] = useState(() => {
        const initial = {};
        users.forEach((u) => {
            initial[u.id] = (u.children || []).map((c) => c.id);
        });
        return initial;
    });

    const [showChildrenModalFor, setShowChildrenModalFor] = useState(null);
    const [showPermissionsModalFor, setShowPermissionsModalFor] = useState(null);
    const [deleteConfirmFor, setDeleteConfirmFor] = useState(null);

    const togglePermission = (userId, menuKey) => {
        const current = permissionMap[userId] || [];
        const next = current.includes(menuKey)
            ? current.filter((item) => item !== menuKey)
            : [...current, menuKey];

        setPermissionMap({
            ...permissionMap,
            [userId]: next,
        });
    };

    const savePermissions = (userId) => {
        router.post(
            route('users.permissions', userId),
            { menus: permissionMap[userId] || [] },
            { preserveScroll: true },
        );
    };

    const toggleUserChild = (userId, childId) => {
        const current = childMap[userId] || [];
        const next = current.includes(childId)
            ? current.filter((id) => id !== childId)
            : [...current, childId];

        setChildMap({
            ...childMap,
            [userId]: next,
        });
    };

    const saveUserChildren = (userId) => {
        router.post(
            route('users.children', userId),
            { child_ids: childMap[userId] || [] },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">User Management</h2>}
        >
            <Head title="User Management" />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">Create User</h3>

                        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <TextInput
                                    className="w-full"
                                    placeholder="Name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    className="w-full"
                                    placeholder="Email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    className="w-full"
                                    placeholder="Password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            <div>
                                <select
                                    className="rounded-md border-gray-300 w-full"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                >
                                    <option value="superadmin">Superadmin</option>
                                    <option value="manager">Manager</option>
                                    <option value="sub user">Sub user</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <div className="text-sm font-medium text-gray-700 mb-2">Assign Child</div>

                                {children.length === 0 ? (
                                    <div className="text-sm text-gray-500">No child records available.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        {children.map((child) => (
                                            <label key={child.id} className="inline-flex items-center rounded border border-gray-200 px-3 py-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                    checked={data.child_ids.includes(child.id)}
                                                    onChange={() => toggleChild(child.id)}
                                                />
                                                <span className="ms-2">{child.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <InputError message={errors.child_ids} className="mt-1" />
                            </div>

                            <div className="md:col-span-2">
                                <PrimaryButton disabled={processing}>Create User</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">Existing Users</h3>

                        <div className="space-y-2">
                            {users.map((u) => (
                                <div key={u.id} className="flex items-center justify-between border border-gray-200 px-3 py-2 rounded">
                                    <div>
                                        <div className="font-semibold text-gray-800">{u.name}</div>
                                        <div className="text-sm text-gray-600">
                                            {u.email} - <span className="italic">{u.role || 'sub user'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Children: {(u.children || []).length > 0 ? u.children.map((c) => c.name).join(', ') : 'None'}
                                        </div>

                                        {u.role !== 'superadmin' && (
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowChildrenModalFor(u.id)}
                                                    className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-emerald-700"
                                                >
                                                    Manage Children
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowPermissionsModalFor(u.id)}
                                                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-indigo-700"
                                                >
                                                    Set Permissions
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(u)}
                                            className="inline-flex items-center rounded-md bg-yellow-500 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-yellow-600"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirmFor(u.id)}
                                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {showEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={closeEdit} />

                    <div className="relative w-full max-w-2xl rounded bg-white p-6">
                        <h3 className="text-lg font-semibold mb-4">Edit User</h3>

                        <form onSubmit={submitEdit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <TextInput
                                    className="w-full"
                                    placeholder="Name"
                                    value={editData.name}
                                    onChange={(e) => setEditData('name', e.target.value)}
                                />
                                <InputError message={editErrors.name} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    className="w-full"
                                    placeholder="Email"
                                    value={editData.email}
                                    onChange={(e) => setEditData('email', e.target.value)}
                                />
                                <InputError message={editErrors.email} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    className="w-full"
                                    placeholder="Password (leave blank to keep)"
                                    type="password"
                                    value={editData.password}
                                    onChange={(e) => setEditData('password', e.target.value)}
                                />
                                <InputError message={editErrors.password} className="mt-1" />
                            </div>

                            <div>
                                <select
                                    className="rounded-md border-gray-300 w-full"
                                    value={editData.role}
                                    onChange={(e) => setEditData('role', e.target.value)}
                                >
                                    <option value="superadmin">Superadmin</option>
                                    <option value="manager">Manager</option>
                                    <option value="sub user">Sub user</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <div className="text-sm font-medium text-gray-700 mb-2">Assign Child</div>

                                {children.length === 0 ? (
                                    <div className="text-sm text-gray-500">No child records available.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                        {children.map((child) => (
                                            <label key={`edit-child-${child.id}`} className="inline-flex items-center rounded border border-gray-200 px-3 py-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                    checked={(editData.child_ids || []).includes(child.id)}
                                                    onChange={() => toggleEditChild(child.id)}
                                                />
                                                <span className="ms-2">{child.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                <InputError message={editErrors.child_ids} className="mt-1" />
                            </div>

                            <div className="md:col-span-2 flex items-center gap-3">
                                <PrimaryButton disabled={editing}>Save Changes</PrimaryButton>
                                <button type="button" onClick={closeEdit} className="inline-flex items-center rounded-md border px-3 py-2 text-xs">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirmFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setDeleteConfirmFor(null)} />

                    <div className="relative w-full max-w-md rounded bg-white p-6">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { deleteUser(deleteConfirmFor); setDeleteConfirmFor(null); }}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-red-700"
                            >
                                Yes, delete
                            </button>

                            <button type="button" onClick={() => setDeleteConfirmFor(null)} className="inline-flex items-center rounded-md border px-3 py-2 text-xs">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Children Modal */}
            {showChildrenModalFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowChildrenModalFor(null)} />

                    <div className="relative w-full max-w-2xl rounded bg-white p-6">
                        <h3 className="text-lg font-semibold mb-4">Manage Children</h3>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            {children.length === 0 ? (
                                <div className="text-sm text-gray-500">No child records available.</div>
                            ) : (
                                children.map((child) => (
                                    <label key={`modal-child-${child.id}`} className="inline-flex items-center rounded border border-gray-200 px-3 py-2 text-sm">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                            checked={(childMap[showChildrenModalFor] || []).includes(child.id)}
                                            onChange={() => toggleUserChild(showChildrenModalFor, child.id)}
                                        />
                                        <span className="ms-2">{child.name}</span>
                                    </label>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex gap-3">
                            <PrimaryButton onClick={() => { saveUserChildren(showChildrenModalFor); setShowChildrenModalFor(null); }}>Save</PrimaryButton>
                            <button type="button" onClick={() => setShowChildrenModalFor(null)} className="inline-flex items-center rounded-md border px-3 py-2 text-xs">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModalFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowPermissionsModalFor(null)} />

                    <div className="relative w-full max-w-2xl rounded bg-white p-6">
                        <h3 className="text-lg font-semibold mb-4">Set Menu Permissions</h3>

                        <div className="flex flex-wrap gap-3 mb-4">
                            {availableMenus.map((menuKey) => (
                                <label key={`perm-${showPermissionsModalFor}-${menuKey}`} className="inline-flex items-center text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={(permissionMap[showPermissionsModalFor] || []).includes(menuKey)}
                                        onChange={() => togglePermission(showPermissionsModalFor, menuKey)}
                                    />
                                    <span className="ms-2 capitalize">{menuKey}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-4 flex gap-3">
                            <PrimaryButton onClick={() => { savePermissions(showPermissionsModalFor); setShowPermissionsModalFor(null); }}>Save</PrimaryButton>
                            <button type="button" onClick={() => setShowPermissionsModalFor(null)} className="inline-flex items-center rounded-md border px-3 py-2 text-xs">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
