import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-800 border border-amber-200',
  approved: 'bg-green-100 text-green-800 border border-green-200',
  rejected: 'bg-red-100  text-red-800  border border-red-200',
};

function ApproveModal({ device, users, onClose }) {
  const { data, setData, put, processing } = useForm({ user_id: '' });

  const submit = (e) => {
    e.preventDefault();
    put(route('admin.devices.approve', device.id), { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Approve Device</h3>
        <p className="text-sm text-slate-500 mb-5">
          Link <span className="font-semibold text-indigo-600">{device.display_name}</span>'s device to a user account.
        </p>

        <form onSubmit={submit}>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Select User Account
          </label>
          <select
            value={data.user_id}
            onChange={e => setData('user_id', e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-5"
          >
            <option value="">-- Choose a user --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={processing || !data.user_id}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition"
            >
              {processing ? 'Approving…' : 'Approve & Link'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeviceRegistrations({ auth, devices, users }) {
  const [approving, setApproving] = useState(null);

  const handleReject = (device) => {
    if (!confirm(`Reject device for "${device.display_name}"?`)) return;
    router.put(route('admin.devices.reject', device.id));
  };

  const handleDelete = (device) => {
    if (!confirm(`Permanently delete this device registration?`)) return;
    router.delete(route('admin.devices.destroy', device.id));
  };

  const pending  = devices.filter(d => d.status === 'pending');
  const approved = devices.filter(d => d.status === 'approved');
  const rejected = devices.filter(d => d.status === 'rejected');

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Device Registrations" />

      {approving && (
        <ApproveModal device={approving} users={users} onClose={() => setApproving(null)} />
      )}

      <div className="py-8 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Device Registrations</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage mobile devices requesting one-tap login access.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="bg-amber-100 text-amber-700 font-semibold px-3 py-1 rounded-full">
              {pending.length} Pending
            </span>
            <span className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
              {approved.length} Approved
            </span>
          </div>
        </div>

        {/* Pending — shown prominently */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
              Awaiting Approval
            </h2>
            <div className="grid gap-4">
              {pending.map(d => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  onApprove={() => setApproving(d)}
                  onReject={() => handleReject(d)}
                  onDelete={() => handleDelete(d)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Approved */}
        {approved.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold text-green-700 uppercase tracking-widest mb-3">Approved Devices</h2>
            <div className="grid gap-3">
              {approved.map(d => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  onApprove={() => setApproving(d)}
                  onReject={() => handleReject(d)}
                  onDelete={() => handleDelete(d)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Rejected */}
        {rejected.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-3">Rejected</h2>
            <div className="grid gap-3">
              {rejected.map(d => (
                <DeviceCard
                  key={d.id}
                  device={d}
                  onApprove={() => setApproving(d)}
                  onReject={() => handleReject(d)}
                  onDelete={() => handleDelete(d)}
                />
              ))}
            </div>
          </section>
        )}

        {devices.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">📱</div>
            <p className="font-semibold text-slate-500">No device registrations yet.</p>
            <p className="text-sm mt-1">When staff open the app for the first time, their request will appear here.</p>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

function DeviceCard({ device, onApprove, onReject, onDelete }) {
  const initials = device.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = {
    pending:  'bg-amber-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-400',
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
      {/* Avatar */}
      <div className={`w-11 h-11 rounded-full ${avatarColors[device.status]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{device.display_name}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[device.status]}`}>
            {device.status}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-3">
          {device.user_name && <span>Linked to: <span className="text-indigo-600 font-medium">{device.user_name}</span></span>}
          <span>Registered: {device.created_at}</span>
          {device.last_used_at && <span>Last login: {device.last_used_at}</span>}
        </div>
        <div className="text-xs text-slate-300 mt-0.5 truncate font-mono">{device.device_id}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {device.status !== 'approved' && (
          <button
            onClick={onApprove}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Approve
          </button>
        )}
        {device.status === 'approved' && (
          <button
            onClick={onApprove}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Re-link
          </button>
        )}
        {device.status !== 'rejected' && (
          <button
            onClick={onReject}
            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Reject
          </button>
        )}
        <button
          onClick={onDelete}
          className="bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
