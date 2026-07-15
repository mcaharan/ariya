<?php

namespace App\Http\Controllers;

use App\Models\DeviceRegistration;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeviceRegistrationController extends Controller
{
    private function requireSuperadmin()
    {
        if (! auth()->user()?->isSuperadmin()) {
            abort(403);
        }
    }

    public function index()
    {
        $this->requireSuperadmin();

        $devices = DeviceRegistration::with('user:id,name,email')
            ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($d) => [
                'id'           => $d->id,
                'device_id'    => $d->device_id,
                'display_name' => $d->display_name,
                'status'       => $d->status,
                'user_id'      => $d->user_id,
                'user_name'    => $d->user?->name,
                'user_email'   => $d->user?->email,
                'device_info'  => $d->device_info,
                'last_used_at' => $d->last_used_at?->diffForHumans(),
                'created_at'   => $d->created_at->format('M d, Y H:i'),
            ]);

        $users = User::orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Admin/DeviceRegistrations', [
            'devices' => $devices,
            'users'   => $users,
        ]);
    }

    public function approve(Request $request, DeviceRegistration $device)
    {
        $this->requireSuperadmin();
        $data = $request->validate(['user_id' => 'required|exists:users,id']);
        $device->update(['user_id' => $data['user_id'], 'status' => 'approved']);

        return back()->with('success', "Device approved for {$device->display_name}.");
    }

    public function reject(DeviceRegistration $device)
    {
        $this->requireSuperadmin();
        $device->update(['status' => 'rejected', 'user_id' => null]);

        return back()->with('success', 'Device rejected.');
    }

    public function destroy(DeviceRegistration $device)
    {
        $this->requireSuperadmin();
        $device->delete();

        return back()->with('success', 'Device registration deleted.');
    }
}
