<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildTeamItem;
use App\Models\ChildTeamSubItem;
use App\Models\ChildPageHeader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TeamTrainingApiController extends Controller
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

        $teamItems = ChildTeamItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->with(['subItems' => fn($q) => $q->where('is_active', true)->orderBy('sort_order')->select('id', 'team_item_id')])
            ->get(['id', 'icon_path', 'title', 'content', 'content_type', 'content_value']);

        $headerImage = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', 'team-training')
            ->value('header_image');

        return response()->json([
            'child'        => $child->only('id', 'name', 'photo', 'team_title'),
            'team_items'   => $teamItems,
            'header_image' => $headerImage,
        ]);
    }

    public function show(Child $child, ChildTeamItem $teamItem)
    {
        $this->authorizeChild($child);

        $subItems = ChildTeamSubItem::where('team_item_id', $teamItem->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'icon_path', 'header_image', 'title', 'content', 'content_type', 'content_value']);

        return response()->json([
            'child'     => $child->only('id', 'name', 'photo', 'team_title'),
            'team_item' => $teamItem->only('id', 'icon_path', 'header_image', 'title'),
            'sub_items' => $subItems,
        ]);
    }

    public function quiz(Child $child, ChildTeamItem $teamItem)
    {
        $this->authorizeChild($child);

        $questions = json_decode($teamItem->content_value, true) ?? [];

        return response()->json([
            'child'     => $child->only('id', 'name'),
            'item'      => $teamItem->only('id', 'icon_path', 'header_image', 'title'),
            'questions' => $questions,
        ]);
    }

    public function subQuiz(Child $child, ChildTeamItem $teamItem, ChildTeamSubItem $subItem)
    {
        $this->authorizeChild($child);

        $questions = json_decode($subItem->content_value, true) ?? [];

        return response()->json([
            'child'     => $child->only('id', 'name'),
            'item'      => $subItem->only('id', 'icon_path', 'header_image', 'title'),
            'questions' => $questions,
        ]);
    }

    public function storeItem(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string',
            'content_type' => 'required|in:text,image,pdf,video,link,quiz,map',
            'content_url'  => 'nullable|string',
            'icon'         => 'required|image|max:4096',
            'header_image' => 'nullable|image|max:8192',
            'content_file' => 'nullable|file|max:20480',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        $iconPath    = $request->file('icon')->store('team-items', 'public');
        $headerImage = $request->hasFile('header_image')
            ? $request->file('header_image')->store('team-headers', 'public')
            : null;

        $contentValue = null;
        if (in_array($data['content_type'], ['image', 'pdf']) && $request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('team-content', 'public');
        } else {
            $contentValue = $data['content_url'] ?? null;
        }

        $item = ChildTeamItem::create([
            'child_id'      => $child->id,
            'icon_path'     => $iconPath,
            'header_image'  => $headerImage,
            'title'         => $data['title'],
            'content'       => $data['content'] ?? null,
            'content_type'  => $data['content_type'],
            'content_value' => $contentValue,
            'sort_order'    => $data['sort_order'] ?? 0,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return response()->json($item, 201);
    }

    public function updateItem(Request $request, Child $child, ChildTeamItem $teamItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string',
            'content_type' => 'required|in:text,image,pdf,video,link,quiz,map',
            'content_url'  => 'nullable|string',
            'icon'         => 'nullable|image|max:4096',
            'header_image' => 'nullable|image|max:8192',
            'content_file' => 'nullable|file|max:20480',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        if ($request->hasFile('icon')) {
            if ($teamItem->icon_path) Storage::disk('public')->delete($teamItem->icon_path);
            $teamItem->icon_path = $request->file('icon')->store('team-items', 'public');
        }

        if ($request->hasFile('header_image')) {
            if ($teamItem->header_image) Storage::disk('public')->delete($teamItem->header_image);
            $teamItem->header_image = $request->file('header_image')->store('team-headers', 'public');
        }

        if (in_array($data['content_type'], ['image', 'pdf']) && $request->hasFile('content_file')) {
            if ($teamItem->content_value && ! str_starts_with($teamItem->content_value, 'http')) {
                Storage::disk('public')->delete($teamItem->content_value);
            }
            $teamItem->content_value = $request->file('content_file')->store('team-content', 'public');
        } else {
            $teamItem->content_value = $data['content_url'] ?? null;
        }

        $teamItem->title        = $data['title'];
        $teamItem->content      = $data['content'] ?? null;
        $teamItem->content_type = $data['content_type'];
        $teamItem->sort_order   = $data['sort_order'] ?? $teamItem->sort_order;
        $teamItem->is_active    = $data['is_active'] ?? $teamItem->is_active;
        $teamItem->save();

        return response()->json($teamItem);
    }

    public function destroyItem(Child $child, ChildTeamItem $teamItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($teamItem->icon_path) Storage::disk('public')->delete($teamItem->icon_path);
        $teamItem->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function storeSubItem(Request $request, Child $child, ChildTeamItem $teamItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string',
            'content_type' => 'required|in:text,image,pdf,video,link,quiz,map',
            'content_url'  => 'nullable|string',
            'icon'         => 'required|image|max:4096',
            'header_image' => 'nullable|image|max:8192',
            'content_file' => 'nullable|file|max:20480',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        $iconPath    = $request->file('icon')->store('team-sub-items', 'public');
        $headerImage = $request->hasFile('header_image')
            ? $request->file('header_image')->store('team-headers', 'public')
            : null;

        $contentValue = null;
        if (in_array($data['content_type'], ['image', 'pdf']) && $request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('team-sub-content', 'public');
        } else {
            $contentValue = $data['content_url'] ?? null;
        }

        $subItem = ChildTeamSubItem::create([
            'team_item_id'  => $teamItem->id,
            'icon_path'     => $iconPath,
            'header_image'  => $headerImage,
            'title'         => $data['title'],
            'content'       => $data['content'] ?? null,
            'content_type'  => $data['content_type'],
            'content_value' => $contentValue,
            'sort_order'    => $data['sort_order'] ?? 0,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return response()->json($subItem, 201);
    }

    public function updateSubItem(Request $request, Child $child, ChildTeamItem $teamItem, ChildTeamSubItem $subItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string',
            'content_type' => 'required|in:text,image,pdf,video,link,quiz,map',
            'content_url'  => 'nullable|string',
            'icon'         => 'nullable|image|max:4096',
            'header_image' => 'nullable|image|max:8192',
            'content_file' => 'nullable|file|max:20480',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        if ($request->hasFile('icon')) {
            if ($subItem->icon_path) Storage::disk('public')->delete($subItem->icon_path);
            $subItem->icon_path = $request->file('icon')->store('team-sub-items', 'public');
        }

        if ($request->hasFile('header_image')) {
            if ($subItem->header_image) Storage::disk('public')->delete($subItem->header_image);
            $subItem->header_image = $request->file('header_image')->store('team-headers', 'public');
        }

        if (in_array($data['content_type'], ['image', 'pdf']) && $request->hasFile('content_file')) {
            if ($subItem->content_value && ! str_starts_with($subItem->content_value, 'http')) {
                Storage::disk('public')->delete($subItem->content_value);
            }
            $subItem->content_value = $request->file('content_file')->store('team-sub-content', 'public');
        } else {
            $subItem->content_value = $data['content_url'] ?? null;
        }

        $subItem->title        = $data['title'];
        $subItem->content      = $data['content'] ?? null;
        $subItem->content_type = $data['content_type'];
        $subItem->sort_order   = $data['sort_order'] ?? $subItem->sort_order;
        $subItem->is_active    = $data['is_active'] ?? $subItem->is_active;
        $subItem->save();

        return response()->json($subItem);
    }

    public function destroySubItem(Child $child, ChildTeamItem $teamItem, ChildTeamSubItem $subItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($subItem->icon_path) Storage::disk('public')->delete($subItem->icon_path);
        $subItem->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
