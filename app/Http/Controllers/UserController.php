<?php

namespace App\Http\Controllers;

use App\Models\Child;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        /** @var User|null $user */

        if (! $user || ! $user->isSuperadmin()) {
            abort(403);
        }

        $users = User::with('children')->orderBy('id', 'desc')->get();
        $children = Child::orderBy('name')->get(['id', 'name']);
        $permissionRows = DB::table('user_menu_permissions')->get();
        $permissionsByUser = [];

        foreach ($permissionRows as $row) {
            $permissionsByUser[$row->user_id][] = $row->menu_key;
        }

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'children' => $children,
            'availableMenus' => ['dashboard', 'users', 'children', 'dashboard_menu'],
            'permissionsByUser' => $permissionsByUser,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        /** @var User|null $user */

        if (! $user || ! $user->isSuperadmin()) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:superadmin,manager,sub user',
            'child_ids' => 'array',
            'child_ids.*' => 'exists:children,id',
        ]);

        $createdUser = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        $createdUser->children()->sync($data['child_ids'] ?? []);

        return redirect()->back();
    }

    public function updatePermissions(Request $request, User $user)
    {
        $actor = Auth::user();
        /** @var User|null $actor */

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        if ($user->isSuperadmin()) {
            return back()->withErrors([
                'permissions' => 'Superadmin has full access by default.',
            ]);
        }

        $validated = $request->validate([
            'menus' => 'array',
            'menus.*' => 'in:dashboard,users,children,dashboard_menu',
        ]);

        $menus = $validated['menus'] ?? [];

        DB::table('user_menu_permissions')->where('user_id', $user->id)->delete();

        foreach ($menus as $menuKey) {
            DB::table('user_menu_permissions')->insert([
                'user_id' => $user->id,
                'menu_key' => $menuKey,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->back();
    }

    public function syncChildren(Request $request, User $user)
    {
        $actor = Auth::user();
        /** @var User|null $actor */

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        if ($user->isSuperadmin()) {
            return back()->withErrors([
                'children' => 'Superadmin does not need child assignment.',
            ]);
        }

        $validated = $request->validate([
            'child_ids' => 'array',
            'child_ids.*' => 'exists:children,id',
        ]);

        $user->children()->sync($validated['child_ids'] ?? []);

        return redirect()->back();
    }

    public function update(Request $request, User $user)
    {
        $actor = Auth::user();
        /** @var User|null $actor */

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        if ($user->isSuperadmin() && $actor->id !== $user->id) {
            return back()->withErrors([
                'user' => 'Cannot modify another superadmin.',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:6',
            'role' => 'required|string|in:superadmin,manager,sub user',
            'child_ids' => 'array',
            'child_ids.*' => 'exists:children,id',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->role = $validated['role'];

        $user->save();

        // sync children for non-superadmin
        if (! $user->isSuperadmin()) {
            $user->children()->sync($validated['child_ids'] ?? []);
        }

        return redirect()->back();
    }

    public function editChildren(User $user)
    {
        $actor = Auth::user();
        /** @var User|null $actor */

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $user->load('children');
        $children = Child::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/UserChildren', [
            'user' => $user,
            'children' => $children,
        ]);
    }

    public function destroy(User $user)
    {
        $actor = Auth::user();
        /** @var User|null $actor */

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        if ((int) $actor->id === (int) $user->id) {
            return back()->withErrors([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        $user->delete();

        return redirect()->back();
    }
}
