import { Head, router, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function UserChildren({ user, children = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        child_ids: (user.children || []).map((c) => c.id),
    });

    const toggleChild = (childId) => {
        const exists = data.child_ids.includes(childId);

        setData(
            'child_ids',
            exists ? data.child_ids.filter((id) => id !== childId) : [...data.child_ids, childId],
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('users.children', user.id), {
            onSuccess: () => {
                // redirect back to users
                router.get(route('users.index'));
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Manage Children for {user.name}</h2>}>
            <Head title={`Manage Children - ${user.name}`} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit}>
                        <div className="text-sm font-medium text-gray-700 mb-2">Assign Child</div>

                        {children.length === 0 ? (
                            <div className="text-sm text-gray-500">No child records available.</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                {children.map((child) => (
                                    <label key={`uc-${child.id}`} className="inline-flex items-center rounded border border-gray-200 px-3 py-2 text-sm">
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

                        <div className="mt-4">
                            <PrimaryButton disabled={processing}>Save</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
