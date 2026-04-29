<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildMenuItem;
use App\Models\ChildPageHeader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChildrenApiController extends Controller
{
    private function authorizeChild(Child $child): void
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }
    }

    public function index()
    {
        $actor = auth()->user();
        if (! $actor) abort(403);

        if ($actor->isSuperadmin()) {
            $children = Child::orderBy('name')->get(['id', 'name', 'photo']);
        } else {
            $children = Child::whereHas('users', fn($q) => $q->where('users.id', $actor->id))
                ->orderBy('name')
                ->get(['id', 'name', 'photo']);
        }

        return response()->json($children);
    }

    public function show(Child $child)
    {
        $this->authorizeChild($child);

        $menuItems = ChildMenuItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'icon_path', 'label', 'href', 'content_type', 'content_value']);

        $pageHeader = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', 'landing')
            ->value('header_image');

        return response()->json([
            'child'       => $child->only('id', 'name', 'photo', 'face_sheet_pdf'),
            'menu_items'  => $menuItems,
            'header_image' => $pageHeader,
        ]);
    }

    public function store(Request $request)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'photo' => 'nullable|image|max:4096',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('children', 'public');
        }

        $child = Child::create([
            'name'  => $data['name'],
            'photo' => $photoPath,
        ]);

        return response()->json($child, 201);
    }

    public function update(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'photo' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('photo')) {
            if ($child->photo) Storage::disk('public')->delete($child->photo);
            $child->photo = $request->file('photo')->store('children', 'public');
        }

        if (isset($data['name'])) {
            $child->name = $data['name'];
        }

        $child->save();

        return response()->json($child);
    }

    public function destroy(Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $child->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
