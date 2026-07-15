<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceRegistration;
use Illuminate\Http\Request;

class DeviceApiController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'device_id'    => 'required|string|max:255',
            'display_name' => 'required|string|max:255',
            'device_info'  => 'nullable|array',
        ]);

        $device = DeviceRegistration::where('device_id', $data['device_id'])->first();

        if ($device && $device->status === 'approved') {
            return response()->json([
                'status'       => 'approved',
                'display_name' => $device->display_name,
                'message'      => 'Device already approved.',
            ]);
        }

        $device = DeviceRegistration::updateOrCreate(
            ['device_id' => $data['device_id']],
            [
                'display_name' => $data['display_name'],
                'device_info'  => $data['device_info'] ?? null,
                'status'       => 'pending',
            ]
        );

        return response()->json([
            'status'       => $device->status,
            'display_name' => $device->display_name,
            'message'      => 'Registration received. Waiting for admin approval.',
        ]);
    }

    public function status(string $deviceId)
    {
        $device = DeviceRegistration::where('device_id', $deviceId)
            ->with('user:id,name')
            ->first();

        if (! $device) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json([
            'status'       => $device->status,
            'display_name' => $device->display_name,
            'user_name'    => $device->user?->name,
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'device_id' => 'required|string',
        ]);

        $device = DeviceRegistration::where('device_id', $data['device_id'])
            ->with('user')
            ->first();

        if (! $device) {
            return response()->json(['message' => 'Device not registered.', 'status' => 'not_found'], 404);
        }

        if ($device->status !== 'approved') {
            return response()->json(['message' => 'Device not approved.', 'status' => $device->status], 403);
        }

        if (! $device->user) {
            return response()->json(['message' => 'No user linked to this device.', 'status' => 'no_user'], 403);
        }

        $device->update(['last_used_at' => now()]);

        $token = $device->user->createToken('device:' . $device->device_id)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $device->user->id,
                'name'  => $device->user->name,
                'email' => $device->user->email,
                'role'  => $device->user->roleName(),
            ],
        ]);
    }
}
