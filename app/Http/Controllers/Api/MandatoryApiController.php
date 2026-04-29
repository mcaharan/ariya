<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildMandatoryItem;
use App\Models\ChildPageHeader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MandatoryApiController extends Controller
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

        $items = ChildMandatoryItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'icon_path', 'title', 'content', 'content_type', 'content_value']);

        $headerImage = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', 'mandatory-tasks')
            ->value('header_image');

        return response()->json([
            'child'           => $child->only('id', 'name', 'photo', 'mandatory_title'),
            'mandatory_items' => $items,
            'header_image'    => $headerImage,
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

        $iconPath = $request->file('icon')->store('mandatory-custom', 'public');

        $contentValue = $data['content_url'] ?? null;
        if ($request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('mandatory-content', 'public');
        }

        $item = ChildMandatoryItem::create([
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

    public function update(Request $request, Child $child, ChildMandatoryItem $mandatoryItem)
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
            if ($mandatoryItem->icon_path) Storage::disk('public')->delete($mandatoryItem->icon_path);
            $mandatoryItem->icon_path = $request->file('icon')->store('mandatory-custom', 'public');
        }

        if ($request->hasFile('content_file')) {
            if ($mandatoryItem->content_value && ! str_starts_with($mandatoryItem->content_value, 'http')) {
                Storage::disk('public')->delete($mandatoryItem->content_value);
            }
            $mandatoryItem->content_value = $request->file('content_file')->store('mandatory-content', 'public');
        } elseif (array_key_exists('content_url', $data)) {
            $mandatoryItem->content_value = $data['content_url'];
        }

        $mandatoryItem->title        = $data['title'];
        $mandatoryItem->content      = $data['content'] ?? null;
        $mandatoryItem->content_type = $data['content_type'];
        $mandatoryItem->sort_order   = $data['sort_order'] ?? $mandatoryItem->sort_order;
        $mandatoryItem->is_active    = $data['is_active'] ?? $mandatoryItem->is_active;
        $mandatoryItem->save();

        return response()->json($mandatoryItem);
    }

    public function destroy(Child $child, ChildMandatoryItem $mandatoryItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($mandatoryItem->icon_path) Storage::disk('public')->delete($mandatoryItem->icon_path);
        $mandatoryItem->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
