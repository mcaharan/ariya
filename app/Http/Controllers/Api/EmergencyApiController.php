<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildEmergencyItem;
use App\Models\ChildPageHeader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmergencyApiController extends Controller
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

    public function index(Child $child)
    {
        $this->authorizeChild($child);

        $items = ChildEmergencyItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'icon_path', 'title', 'content', 'content_type', 'content_value']);

        $headerImage = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', 'emergency')
            ->value('header_image');

        return response()->json([
            'child'          => $child->only('id', 'name', 'photo', 'emergency_title'),
            'emergency_items' => $items,
            'header_image'   => $headerImage,
        ]);
    }

    public function store(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string',
            'content_type' => 'required|in:text,image,pdf,video,link',
            'content_url'  => 'nullable|string|max:2000',
            'content_file' => 'nullable|file|max:51200',
            'icon'         => 'required|image|max:2048',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        $iconPath = $request->file('icon')->store('emergency-custom', 'public');

        $contentValue = $data['content_url'] ?? null;
        if ($request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('emergency-content', 'public');
        }

        $item = ChildEmergencyItem::create([
            'child_id'      => $child->id,
            'icon_path'     => $iconPath,
            'title'         => $data['title'],
            'content'       => $data['content'] ?? null,
            'content_type'  => $data['content_type'],
            'content_value' => $contentValue,
            'sort_order'    => $data['sort_order'] ?? 99,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return response()->json($item, 201);
    }

    public function update(Request $request, Child $child, ChildEmergencyItem $emergencyItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string',
            'content_type' => 'required|in:text,image,pdf,video,link',
            'content_url'  => 'nullable|string|max:2000',
            'content_file' => 'nullable|file|max:51200',
            'icon'         => 'nullable|image|max:2048',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        if ($request->hasFile('icon')) {
            if ($emergencyItem->icon_path) Storage::disk('public')->delete($emergencyItem->icon_path);
            $emergencyItem->icon_path = $request->file('icon')->store('emergency-custom', 'public');
        }

        if ($request->hasFile('content_file')) {
            if ($emergencyItem->content_value && ! str_starts_with($emergencyItem->content_value, 'http')) {
                Storage::disk('public')->delete($emergencyItem->content_value);
            }
            $emergencyItem->content_value = $request->file('content_file')->store('emergency-content', 'public');
        } elseif (array_key_exists('content_url', $data)) {
            $emergencyItem->content_value = $data['content_url'];
        }

        $emergencyItem->title        = $data['title'];
        $emergencyItem->content      = $data['content'] ?? null;
        $emergencyItem->content_type = $data['content_type'];
        $emergencyItem->sort_order   = $data['sort_order'] ?? $emergencyItem->sort_order;
        $emergencyItem->is_active    = $data['is_active'] ?? $emergencyItem->is_active;
        $emergencyItem->save();

        return response()->json($emergencyItem);
    }

    public function destroy(Child $child, ChildEmergencyItem $emergencyItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($emergencyItem->icon_path) Storage::disk('public')->delete($emergencyItem->icon_path);
        $emergencyItem->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
