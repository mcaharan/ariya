import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="flex justify-center">
                <ApplicationLogo className="h-16 w-auto mx-auto" />
            </div>

            <form onSubmit={submit} className="mt-4">
                <div>
                    <label htmlFor="email" className="sr-only">
                        Email
                    </label>

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full px-4 py-3"
                        autoComplete="username"
                        isFocused={true}
                        placeholder="Email here..."
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <label htmlFor="password" className="sr-only">
                        Password
                    </label>

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full px-4 py-3"
                        autoComplete="current-password"
                        placeholder="Password here..."
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-sm text-blue-600 underline hover:text-blue-800"
                            >
                                Forgot My Password
                            </Link>
                        )}
                    </div>

                    <div>
                        <PrimaryButton
                            className="ms-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            disabled={processing}
                        >
                            Sign In
                        </PrimaryButton>
                    </div>
                </div>
            </form>

            <div className="mt-6">
                <hr className="border-gray-200" />

                <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Access Restricted
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Authorized Access Only
                    </p>
                </div>

                <div className="mt-6 flex justify-between text-sm">
                    <Link href="#" className="text-blue-600 hover:underline">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="text-blue-600 hover:underline">
                        Contact Us
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
