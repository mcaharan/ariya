<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildGalleryItem;
use App\Models\ChildPageHeader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryApiController extends Controller
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

    public function index(Child $child, string $section)
    {
        $this->authorizeChild($child);

        $items = ChildGalleryItem::where('child_id', $child->id)
            ->where('section', $section)
            ->orderBy('sort_order')
            ->get(['id', 'image_path', 'caption', 'sort_order']);

        $headerImage = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', 'gallery-' . $section)
            ->value('header_image');

        return response()->json([
            'child'        => $child->only('id', 'name', 'photo'),
            'section'      => $section,
            'items'        => $items,
            'header_image' => $headerImage,
        ]);
    }

    public function store(Request $request, Child $child, string $section)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'image'      => 'required|image|max:8192',
            'caption'    => 'nullable|string|max:500',
            'sort_order' => 'integer',
        ]);

        $imagePath = $request->file('image')->store('gallery', 'public');

        $item = ChildGalleryItem::create([
            'child_id'   => $child->id,
            'section'    => $section,
            'image_path' => $imagePath,
            'caption'    => $data['caption'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json($item, 201);
    }

    public function destroy(Child $child, string $section, ChildGalleryItem $galleryItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($galleryItem->image_path) Storage::disk('public')->delete($galleryItem->image_path);
        $galleryItem->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
