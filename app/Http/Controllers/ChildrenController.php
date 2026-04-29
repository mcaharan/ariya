<?php

namespace App\Http\Controllers;

use App\Models\Child;
use App\Models\ChildEmergencyItem;
use App\Models\ChildTeamItem;
use App\Models\ChildTeamSubItem;
use App\Models\ChildMandatoryItem;
use App\Models\ChildGalleryItem;
use App\Models\ChildAriyaItem;
use App\Models\ChildAriyaImage;
use App\Models\ChildMedSlot;
use App\Models\ChildMedItem;
use App\Models\ChildMedConfirmation;
use App\Models\ChildMenuItem;
use App\Models\ChildPageHeader;
use App\Models\AriyaTeamSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ChildrenController extends Controller
{
    public function show(Child $child)
    {
        $actor = auth()->user();

        if (! $actor) {
            abort(403);
        }

        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) {
                abort(403);
            }
        }

        $menuItems = ChildMenuItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'icon_path', 'label', 'href', 'content_type', 'content_value']);

        return Inertia::render('ChildLanding', [
            'child'     => $child->only('id', 'name', 'photo', 'face_sheet_pdf'),
            'menuItems' => $menuItems,
        ]);
    }

    public function emergency(Child $child)
    {
        $actor = auth()->user();

        if (! $actor) abort(403);

        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $emergencyItems = ChildEmergencyItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'icon_path', 'title', 'content', 'content_type', 'content_value']);

        return Inertia::render('Child/Emergency', [
            'child'          => $child->only('id', 'name', 'photo', 'emergency_title'),
            'emergencyItems' => $emergencyItems,
            'headerImage'    => $this->pageHeader($child, 'emergency'),
        ]);
    }

    public function syncEmergencyItems(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'items'              => 'array',
            'items.*.image'      => 'required|string',
            'items.*.title'      => 'required|string|max:255',
            'items.*.content'    => 'nullable|string',
            'items.*.sort_order' => 'integer',
            'items.*.is_active'  => 'boolean',
        ]);

        // Only delete preset items (no icon_path), preserve custom uploaded items
        ChildEmergencyItem::where('child_id', $child->id)->whereNull('icon_path')->delete();

        foreach ($data['items'] ?? [] as $item) {
            ChildEmergencyItem::create([
                'child_id'   => $child->id,
                'image'      => $item['image'],
                'title'      => $item['title'],
                'content'    => $item['content'] ?? null,
                'sort_order' => $item['sort_order'] ?? 0,
                'is_active'  => $item['is_active'] ?? true,
            ]);
        }

        return redirect()->back();
    }

    public function updateFaceSheet(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $request->validate([
            'pdf' => 'required|mimes:pdf|max:20480',
        ]);

        if ($child->face_sheet_pdf) {
            Storage::disk('public')->delete($child->face_sheet_pdf);
        }

        $child->face_sheet_pdf = $request->file('pdf')->store('face-sheets', 'public');
        $child->save();

        return redirect()->back();
    }

    public function destroyFaceSheet(Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($child->face_sheet_pdf) {
            Storage::disk('public')->delete($child->face_sheet_pdf);
            $child->face_sheet_pdf = null;
            $child->save();
        }

        return redirect()->back();
    }

    public function updateMandatoryTitle(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'mandatory_title' => 'required|string|max:100',
        ]);

        $child->mandatory_title = $data['mandatory_title'];
        $child->save();

        return redirect()->back();
    }

    public function updateEmergencyTitle(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'emergency_title' => 'required|string|max:100',
        ]);

        $child->emergency_title = $data['emergency_title'];
        $child->save();

        return redirect()->back();
    }

    public function storeEmergencyItem(Request $request, Child $child)
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

        ChildEmergencyItem::create([
            'child_id'      => $child->id,
            'image'         => null,
            'icon_path'     => $iconPath,
            'title'         => $data['title'],
            'content'       => $data['content'] ?? null,
            'content_type'  => $data['content_type'],
            'content_value' => $contentValue,
            'sort_order'    => $data['sort_order'] ?? 99,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return redirect()->back();
    }

    public function updateEmergencyItem(Request $request, Child $child, ChildEmergencyItem $emergencyItem)
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
            if ($emergencyItem->content_value && !str_starts_with($emergencyItem->content_value, 'http')) {
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

        return redirect()->back();
    }

    public function destroyEmergencyItem(Child $child, ChildEmergencyItem $emergencyItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($emergencyItem->icon_path) Storage::disk('public')->delete($emergencyItem->icon_path);
        $emergencyItem->delete();

        return redirect()->back();
    }

    /* ── Page Headers ── */

    private function pageHeader(Child $child, string $key): ?string
    {
        return ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', $key)
            ->value('header_image');
    }

    public function updatePageHeader(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'page_key'     => 'required|string|max:60',
            'header_image' => 'required|image|max:8192',
        ]);

        $path = $request->file('header_image')->store('page-headers', 'public');

        $existing = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', $data['page_key'])
            ->first();

        if ($existing) {
            Storage::disk('public')->delete($existing->header_image);
            $existing->update(['header_image' => $path]);
        } else {
            ChildPageHeader::create([
                'child_id'     => $child->id,
                'page_key'     => $data['page_key'],
                'header_image' => $path,
            ]);
        }

        return redirect()->back();
    }

    public function destroyPageHeader(Request $request, Child $child, string $pageKey)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $row = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', $pageKey)->first();

        if ($row) {
            Storage::disk('public')->delete($row->header_image);
            $row->delete();
        }

        return redirect()->back();
    }

    /* ── Team Training ── */

    public function teamTraining(Child $child)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $teamItems = ChildTeamItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->with(['subItems:id,team_item_id'])
            ->get(['id', 'icon_path', 'title', 'content', 'content_type', 'content_value']);

        return Inertia::render('Child/TeamTraining', [
            'child'       => $child->only('id', 'name', 'photo', 'team_title'),
            'teamItems'   => $teamItems,
            'headerImage' => $this->pageHeader($child, 'team-training'),
        ]);
    }

    public function updateTeamTitle(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate(['team_title' => 'required|string|max:100']);
        $child->team_title = $data['team_title'];
        $child->save();

        return redirect()->back();
    }

    public function storeTeamItem(Request $request, Child $child)
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

        $iconPath = $request->file('icon')->store('team-items', 'public');
        $headerImage = $request->hasFile('header_image')
            ? $request->file('header_image')->store('team-headers', 'public')
            : null;

        $contentValue = null;
        if (in_array($data['content_type'], ['image', 'pdf']) && $request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('team-content', 'public');
        } else {
            $contentValue = $data['content_url'] ?? null;
        }

        ChildTeamItem::create([
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

        return redirect()->back();
    }

    public function updateTeamItem(Request $request, Child $child, ChildTeamItem $teamItem)
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
            if ($teamItem->content_value && !str_starts_with($teamItem->content_value, 'http')) {
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

        return redirect()->back();
    }

    public function destroyTeamItem(Child $child, ChildTeamItem $teamItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($teamItem->icon_path) Storage::disk('public')->delete($teamItem->icon_path);
        $teamItem->delete();

        return redirect()->back();
    }

    public function teamTrainingInner(Child $child, ChildTeamItem $teamItem)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $subItems = ChildTeamSubItem::where('team_item_id', $teamItem->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'icon_path', 'title', 'content', 'content_type', 'content_value']);

        return Inertia::render('Child/TeamTrainingInner', [
            'child'    => $child->only('id', 'name', 'photo', 'team_title'),
            'teamItem' => $teamItem->only('id', 'icon_path', 'header_image', 'title'),
            'subItems' => $subItems,
        ]);
    }

    public function teamTrainingQuiz(Child $child, ChildTeamItem $teamItem)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $questions = json_decode($teamItem->content_value, true) ?? [];

        return Inertia::render('Child/TeamTrainingQuiz', [
            'child'     => $child->only('id', 'name'),
            'item'      => $teamItem->only('id', 'icon_path', 'header_image', 'title'),
            'questions' => $questions,
            'backRoute' => route('children.team-training', $child->id),
        ]);
    }

    public function teamTrainingSubQuiz(Child $child, ChildTeamItem $teamItem, ChildTeamSubItem $subItem)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $questions = json_decode($subItem->content_value, true) ?? [];

        return Inertia::render('Child/TeamTrainingQuiz', [
            'child'     => $child->only('id', 'name'),
            'item'      => $subItem->only('id', 'icon_path', 'header_image', 'title'),
            'questions' => $questions,
            'backRoute' => route('children.team-training.inner', ['child' => $child->id, 'teamItem' => $teamItem->id]),
        ]);
    }

    public function storeTeamSubItem(Request $request, Child $child, ChildTeamItem $teamItem)
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

        $iconPath = $request->file('icon')->store('team-sub-items', 'public');
        $headerImage = $request->hasFile('header_image')
            ? $request->file('header_image')->store('team-headers', 'public')
            : null;

        $contentValue = null;
        if (in_array($data['content_type'], ['image', 'pdf']) && $request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('team-sub-content', 'public');
        } else {
            $contentValue = $data['content_url'] ?? null;
        }

        ChildTeamSubItem::create([
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

        return redirect()->back();
    }

    public function updateTeamSubItem(Request $request, Child $child, ChildTeamItem $teamItem, ChildTeamSubItem $subItem)
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
            if ($subItem->content_value && !str_starts_with($subItem->content_value, 'http')) {
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

        return redirect()->back();
    }

    public function destroyTeamSubItem(Child $child, ChildTeamItem $teamItem, ChildTeamSubItem $subItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($subItem->icon_path) Storage::disk('public')->delete($subItem->icon_path);
        $subItem->delete();

        return redirect()->back();
    }

    public function storeMenuItem(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'label'        => 'required|string|max:255',
            'icon'         => 'nullable|image|max:2048',
            'content_type' => 'required|in:link,video,image,pdf',
            'content_url'  => 'nullable|string|max:2000',
            'content_file' => 'nullable|file|max:51200',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        $iconPath = null;
        if ($request->hasFile('icon')) {
            $iconPath = $request->file('icon')->store('child-menu-icons', 'public');
        }

        $contentValue = $data['content_url'] ?? null;
        if ($request->hasFile('content_file')) {
            $contentValue = $request->file('content_file')->store('child-menu-content', 'public');
        }

        ChildMenuItem::create([
            'child_id'      => $child->id,
            'image'         => null,
            'icon_path'     => $iconPath,
            'label'         => $data['label'],
            'href'          => '#',
            'content_type'  => $data['content_type'],
            'content_value' => $contentValue,
            'sort_order'    => $data['sort_order'] ?? 99,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return redirect()->back();
    }

    public function updateMenuItem(Request $request, Child $child, ChildMenuItem $menuItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'label'        => 'required|string|max:255',
            'icon'         => 'nullable|image|max:2048',
            'content_type' => 'required|in:link,video,image,pdf',
            'content_url'  => 'nullable|string|max:2000',
            'content_file' => 'nullable|file|max:51200',
            'sort_order'   => 'integer',
            'is_active'    => 'boolean',
        ]);

        if ($request->hasFile('icon')) {
            if ($menuItem->icon_path) Storage::disk('public')->delete($menuItem->icon_path);
            $menuItem->icon_path = $request->file('icon')->store('child-menu-icons', 'public');
        }

        if ($request->hasFile('content_file')) {
            if ($menuItem->content_value && !str_starts_with($menuItem->content_value, 'http')) {
                Storage::disk('public')->delete($menuItem->content_value);
            }
            $menuItem->content_value = $request->file('content_file')->store('child-menu-content', 'public');
        } elseif (isset($data['content_url'])) {
            $menuItem->content_value = $data['content_url'];
        }

        $menuItem->label        = $data['label'];
        $menuItem->content_type = $data['content_type'];
        $menuItem->sort_order   = $data['sort_order'] ?? $menuItem->sort_order;
        $menuItem->is_active    = $data['is_active'] ?? $menuItem->is_active;
        $menuItem->save();

        return redirect()->back();
    }

    public function destroyMenuItem(Child $child, ChildMenuItem $menuItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        if ($menuItem->icon_path) Storage::disk('public')->delete($menuItem->icon_path);
        if ($menuItem->content_value && !str_starts_with($menuItem->content_value ?? '', 'http')) {
            Storage::disk('public')->delete($menuItem->content_value);
        }
        $menuItem->delete();

        return redirect()->back();
    }

    public function syncMenuItems(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $data = $request->validate([
            'items'               => 'array',
            'items.*.image'       => 'required|string',
            'items.*.label'       => 'required|string',
            'items.*.href'        => 'nullable|string',
            'items.*.sort_order'  => 'integer',
            'items.*.is_active'   => 'boolean',
        ]);

        ChildMenuItem::where('child_id', $child->id)->delete();

        foreach ($data['items'] ?? [] as $item) {
            ChildMenuItem::create([
                'child_id'   => $child->id,
                'image'      => $item['image'],
                'label'      => $item['label'],
                'href'       => $item['href'] ?? '#',
                'sort_order' => $item['sort_order'] ?? 0,
                'is_active'  => $item['is_active'] ?? true,
            ]);
        }

        return redirect()->back();
    }

    public function index()
    {
        $actor = auth()->user();

        if (! $actor || ! $actor->hasMenuAccess('children')) {
            abort(403);
        }

        if ($actor->isSuperadmin()) {
            $children = Child::with(['users', 'menuItems' => fn($q) => $q->orderBy('sort_order'), 'emergencyItems' => fn($q) => $q->orderBy('sort_order'), 'mandatoryItems' => fn($q) => $q->orderBy('sort_order'), 'ariyaItems' => fn($q) => $q->orderBy('sort_order')->with(['images']), 'galleryItems' => fn($q) => $q->orderBy('sort_order'), 'medSlots' => fn($q) => $q->orderBy('sort_order')->with('items'), 'teamItems' => fn($q) => $q->orderBy('sort_order')->with(['subItems']), 'pageHeaders', 'teamSchedules' => fn($q) => $q->orderBy('shift_date')->orderBy('sort_order')->with('user:id,name')])->orderBy('id', 'desc')->get(['id','name','photo','emergency_title','mandatory_title','team_title','face_sheet_pdf','ariya_team_calendar_url','schedule_email_recipients']);
        } else {
            $children = Child::with(['users', 'menuItems' => fn($q) => $q->orderBy('sort_order'), 'emergencyItems' => fn($q) => $q->orderBy('sort_order'), 'mandatoryItems' => fn($q) => $q->orderBy('sort_order'), 'ariyaItems' => fn($q) => $q->orderBy('sort_order')->with(['images']), 'galleryItems' => fn($q) => $q->orderBy('sort_order'), 'medSlots' => fn($q) => $q->orderBy('sort_order')->with('items'), 'pageHeaders'])
                ->whereHas('users', function ($query) use ($actor) {
                    $query->where('users.id', $actor->id);
                })
                ->orderBy('id', 'desc')
                ->get();
        }

        $assignableUsers = $actor->isSuperadmin()
            ? User::whereIn('role', ['manager', 'sub user'])->orderBy('name')->get()
            : collect();

        $scheduleUsers = $actor->isSuperadmin()
            ? User::orderBy('name')->get(['id', 'name', 'role'])
            : collect();

        return Inertia::render('Admin/Children', [
            'children'       => $children,
            'assignableUsers' => $assignableUsers,
            'scheduleUsers'  => $scheduleUsers,
            'isSuperadmin'   => $actor->isSuperadmin(),
        ]);
    }

    public function store(Request $request)
    {
        $actor = auth()->user();

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
            'user_ids' => 'array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $childData = [
            'name' => $data['name'],
        ];

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('children', 'public');
            $childData['photo'] = $path;
        }

        $child = Child::create($childData);

        $child->users()->sync($data['user_ids'] ?? []);

        return redirect()->back();
    }

    public function syncUsers(Request $request, Child $child)
    {
        $actor = auth()->user();

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $data = $request->validate([
            'user_ids' => 'array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $child->users()->sync($data['user_ids'] ?? []);

        return redirect()->back();
    }

    public function destroy(Child $child)
    {
        $actor = auth()->user();

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $child->delete();

        return redirect()->back();
    }

    public function mandatoryTasks(Child $child)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $items = ChildMandatoryItem::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'title']);

        return Inertia::render('Child/MandatoryTasks', [
            'child'       => $child->only('id', 'name', 'photo', 'mandatory_title'),
            'items'       => $items,
            'headerImage' => $this->pageHeader($child, 'mandatory-tasks'),
        ]);
    }

    public function storeMandatoryItem(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'image'      => 'required|image|max:10240',
            'title'      => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        $path = $request->file('image')->store('mandatory-tasks', 'public');

        ChildMandatoryItem::create([
            'child_id'   => $child->id,
            'image'      => $path,
            'title'      => $data['title'] ?? null,
            'sort_order' => $data['sort_order'] ?? 99,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return redirect()->back();
    }

    public function updateMandatoryItem(Request $request, Child $child, ChildMandatoryItem $mandatoryItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'image'      => 'nullable|image|max:10240',
            'title'      => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($mandatoryItem->image);
            $mandatoryItem->image = $request->file('image')->store('mandatory-tasks', 'public');
        }

        $mandatoryItem->title      = $data['title'] ?? null;
        $mandatoryItem->sort_order = $data['sort_order'] ?? $mandatoryItem->sort_order;
        $mandatoryItem->is_active  = $data['is_active'] ?? $mandatoryItem->is_active;
        $mandatoryItem->save();

        return redirect()->back();
    }

    public function destroyMandatoryItem(Child $child, ChildMandatoryItem $mandatoryItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        Storage::disk('public')->delete($mandatoryItem->image);
        $mandatoryItem->delete();

        return redirect()->back();
    }

    /* ── Medication ── */

    public function medication(Child $child, Request $request)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }

        $today = now()->toDateString();

        try {
            $date = $request->query('date') ? Carbon::parse($request->query('date'))->toDateString() : $today;
        } catch (\Exception $e) {
            $date = $today;
        }

        $slots = ChildMedSlot::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->with(['items', 'confirmations' => fn($q) => $q->where('confirmed_date', $date)])
            ->get();

        $confirmedSlotIds = $slots
            ->filter(fn($s) => $s->confirmations->isNotEmpty())
            ->pluck('id')
            ->values();

        // 30-day history
        $slotIds = $slots->pluck('id');
        $historyStart = Carbon::today()->subDays(29)->toDateString();

        $allConfirmations = ChildMedConfirmation::whereIn('slot_id', $slotIds)
            ->where('confirmed_date', '>=', $historyStart)
            ->get()
            ->groupBy('confirmed_date');

        $totalSlots = $slots->count();
        $history = collect();
        for ($i = 29; $i >= 0; $i--) {
            $day = Carbon::today()->subDays($i)->toDateString();
            $confirmedCount = $allConfirmations->get($day, collect())->pluck('slot_id')->unique()->count();
            $history->push([
                'date'      => $day,
                'confirmed' => $confirmedCount,
                'total'     => $totalSlots,
            ]);
        }

        return Inertia::render('Child/Medication', [
            'child'            => $child->only('id', 'name', 'photo'),
            'slots'            => $slots->map(fn($s) => [
                'id'         => $s->id,
                'time_label' => $s->time_label,
                'sub_label'  => $s->sub_label,
                'items'      => $s->items->map(fn($i) => ['id' => $i->id, 'name' => $i->name, 'dosage' => $i->dosage]),
            ]),
            'confirmedSlotIds' => $confirmedSlotIds,
            'date'             => $date,
            'today'            => $today,
            'history'          => $history,
            'headerImage'      => $this->pageHeader($child, 'medication'),
        ]);
    }

    public function confirmMedSlot(Request $request, Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor) abort(403);

        $date = $request->validate(['date' => 'required|date'])['date'];

        $existing = ChildMedConfirmation::where('slot_id', $slot->id)
            ->where('user_id', $actor->id)
            ->where('confirmed_date', $date)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            ChildMedConfirmation::create([
                'slot_id'        => $slot->id,
                'user_id'        => $actor->id,
                'confirmed_date' => $date,
            ]);
        }

        return redirect()->back();
    }

    public function storeMedSlot(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'time_label' => 'required|string|max:255',
            'sub_label'  => 'nullable|string|max:255',
            'sort_order' => 'integer',
        ]);

        ChildMedSlot::create([
            'child_id'   => $child->id,
            'time_label' => $data['time_label'],
            'sub_label'  => $data['sub_label'] ?? null,
            'sort_order' => $data['sort_order'] ?? 99,
        ]);

        return redirect()->back();
    }

    public function updateMedSlot(Request $request, Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'time_label' => 'required|string|max:255',
            'sub_label'  => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        $slot->update($data);
        return redirect()->back();
    }

    public function destroyMedSlot(Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);
        $slot->delete();
        return redirect()->back();
    }

    public function storeMedItem(Request $request, Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'dosage'     => 'required|string|max:255',
            'sort_order' => 'integer',
        ]);

        ChildMedItem::create([
            'slot_id'    => $slot->id,
            'name'       => strtoupper($data['name']),
            'dosage'     => $data['dosage'],
            'sort_order' => $data['sort_order'] ?? 99,
        ]);

        return redirect()->back();
    }

    public function destroyMedItem(Child $child, ChildMedSlot $slot, ChildMedItem $item)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);
        $item->delete();
        return redirect()->back();
    }

    /* ── Ariya Status / Ariya Behavior ── */

    private function ariyaAuth(Child $child): void
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }
    }

    public function ariya(Child $child, string $type)
    {
        $this->ariyaAuth($child);

        $titles = ['status' => 'Ariya Tube', 'behavior' => 'Ariya Art'];

        $items = ChildAriyaItem::where('child_id', $child->id)
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'icon_path', 'title']);

        return Inertia::render('Child/Ariya', [
            'child'       => $child->only('id', 'name', 'photo'),
            'type'        => $type,
            'title'       => $titles[$type] ?? ucwords(str_replace('-', ' ', $type)),
            'items'       => $items,
            'headerImage' => $this->pageHeader($child, 'ariya-' . $type),
        ]);
    }

    public function ariyaGallery(Child $child, ChildAriyaItem $ariyaItem)
    {
        $this->ariyaAuth($child);

        $images = ChildAriyaImage::where('ariya_item_id', $ariyaItem->id)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'video_url', 'caption']);

        return Inertia::render('Child/AriyaGallery', [
            'child'       => $child->only('id', 'name', 'photo'),
            'ariyaItem'   => $ariyaItem->only('id', 'title'),
            'type'        => $ariyaItem->type,
            'items'       => $images,
            'headerImage' => $this->pageHeader($child, 'ariya-gallery'),
        ]);
    }

    public function storeAriyaItem(Request $request, Child $child, string $type)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'      => 'required|string|max:255',
            'icon'       => 'required|image|max:2048',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        $iconPath = $request->file('icon')->store("ariya/{$type}/icons", 'public');

        ChildAriyaItem::create([
            'child_id'   => $child->id,
            'type'       => $type,
            'icon_path'  => $iconPath,
            'title'      => $data['title'],
            'sort_order' => $data['sort_order'] ?? 99,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return redirect()->back();
    }

    public function updateAriyaItem(Request $request, Child $child, ChildAriyaItem $ariyaItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'title'      => 'required|string|max:255',
            'icon'       => 'nullable|image|max:2048',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        if ($request->hasFile('icon')) {
            if ($ariyaItem->icon_path) Storage::disk('public')->delete($ariyaItem->icon_path);
            $ariyaItem->icon_path = $request->file('icon')->store("ariya/{$ariyaItem->type}/icons", 'public');
        }

        $ariyaItem->title      = $data['title'];
        $ariyaItem->sort_order = $data['sort_order'] ?? $ariyaItem->sort_order;
        $ariyaItem->is_active  = $data['is_active'] ?? $ariyaItem->is_active;
        $ariyaItem->save();

        return redirect()->back();
    }

    public function destroyAriyaItem(Child $child, ChildAriyaItem $ariyaItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        foreach ($ariyaItem->images as $img) {
            Storage::disk('public')->delete($img->image);
        }
        if ($ariyaItem->icon_path) Storage::disk('public')->delete($ariyaItem->icon_path);
        $ariyaItem->delete();

        return redirect()->back();
    }

    public function storeAriyaImage(Request $request, Child $child, ChildAriyaItem $ariyaItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'image'      => 'nullable|image|max:10240',
            'video_url'  => 'nullable|string|max:2000',
            'caption'    => 'nullable|string|max:255',
            'sort_order' => 'integer',
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store("ariya/{$ariyaItem->type}/gallery", 'public');
        }

        ChildAriyaImage::create([
            'ariya_item_id' => $ariyaItem->id,
            'image'         => $path,
            'video_url'     => $data['video_url'] ?? null,
            'caption'       => $data['caption'] ?? null,
            'sort_order'    => $data['sort_order'] ?? 99,
        ]);

        return redirect()->back();
    }

    public function destroyAriyaImage(Child $child, ChildAriyaItem $ariyaItem, ChildAriyaImage $ariyaImage)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        Storage::disk('public')->delete($ariyaImage->image);
        $ariyaImage->delete();

        return redirect()->back();
    }

    /* ── Gallery (Ariya Status, Ariya Behavior, …) ── */

    private function galleryAuth(Child $child): void
    {
        $actor = auth()->user();
        if (! $actor) abort(403);
        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (! $allowed) abort(403);
        }
    }

    public function gallery(Child $child, string $section)
    {
        $this->galleryAuth($child);

        $sectionMeta = [
            'ariya-art' => ['title' => 'Ariya Art'],
        ];

        $meta = $sectionMeta[$section] ?? ['title' => ucwords(str_replace('-', ' ', $section)), 'key' => null];

        $items = ChildGalleryItem::where('child_id', $child->id)
            ->where('section', $section)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'image', 'title']);

        return Inertia::render('Child/Gallery', [
            'child'       => $child->only('id', 'name', 'photo'),
            'section'     => $section,
            'title'       => $meta['title'],
            'items'       => $items,
            'headerImage' => $this->pageHeader($child, 'gallery-' . $section),
        ]);
    }

    public function storeGalleryItem(Request $request, Child $child, string $section)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'image'      => 'required|image|max:10240',
            'title'      => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        $path = $request->file('image')->store("gallery/{$section}", 'public');

        ChildGalleryItem::create([
            'child_id'   => $child->id,
            'section'    => $section,
            'image'      => $path,
            'title'      => $data['title'] ?? null,
            'sort_order' => $data['sort_order'] ?? 99,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return redirect()->back();
    }

    public function updateGalleryItem(Request $request, Child $child, string $section, ChildGalleryItem $galleryItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'image'      => 'nullable|image|max:10240',
            'title'      => 'nullable|string|max:255',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($galleryItem->image);
            $galleryItem->image = $request->file('image')->store("gallery/{$section}", 'public');
        }

        $galleryItem->title      = $data['title'] ?? null;
        $galleryItem->sort_order = $data['sort_order'] ?? $galleryItem->sort_order;
        $galleryItem->is_active  = $data['is_active'] ?? $galleryItem->is_active;
        $galleryItem->save();

        return redirect()->back();
    }

    public function destroyGalleryItem(Child $child, string $section, ChildGalleryItem $galleryItem)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        Storage::disk('public')->delete($galleryItem->image);
        $galleryItem->delete();

        return redirect()->back();
    }

    /**
     * Return a JSON list of children available to the current user.
     */
    public function list()
    {
        $actor = auth()->user();

        if (! $actor || $actor->roleName() !== 'sub user') {
            // Only sub users may use the switch-child dropdown.
            abort(403);
        }

        $children = Child::whereHas('users', function ($query) use ($actor) {
            $query->where('users.id', $actor->id);
        })->orderBy('name')->get(['id', 'name', 'photo']);

        return response()->json($children);
    }

    /**
     * Switch the current child in session for the authenticated user.
     */
    public function switch(Request $request)
    {
        $actor = auth()->user();

        if (! $actor || $actor->roleName() !== 'sub user') {
            // Only sub users are allowed to switch current child via this endpoint.
            abort(403);
        }

        $data = $request->validate([
            'child_id' => 'required|exists:children,id',
        ]);

        $childId = $data['child_id'];

        if (! $actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $childId)->exists();
            if (! $allowed) {
                abort(403);
            }
        }

        session(['current_child_id' => $childId]);

        return response()->json(['ok' => true]);
    }

    public function update(Request $request, Child $child)
    {
        $actor = auth()->user();

        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:4096',
        ]);

        $child->name = $validated['name'];

        if ($request->hasFile('photo')) {
            // remove old photo if present
            if (! empty($child->photo)) {
                Storage::disk('public')->delete($child->photo);
            }

            $path = $request->file('photo')->store('children', 'public');
            $child->photo = $path;
        }

        $child->save();

        return redirect()->back();
    }

    /* ── Ariya Team ── */

    public function ariyaTeam(Child $child)
    {
        $actor = auth()->user();
        if (!$actor) abort(403);
        if (!$actor->isSuperadmin()) {
            $allowed = $actor->children()->where('children.id', $child->id)->exists();
            if (!$allowed) abort(403);
        }

        $schedules = AriyaTeamSchedule::where('child_id', $child->id)
            ->where('is_active', true)
            ->orderBy('shift_date')
            ->orderBy('sort_order')
            ->with('user:id,name')
            ->get(['id', 'user_id', 'shift_date', 'start_time', 'end_time', 'sort_order']);

        return Inertia::render('Child/AriyaTeam', [
            'child'       => $child->only('id', 'name', 'photo', 'ariya_team_calendar_url'),
            'schedules'   => $schedules,
            'headerImage' => $this->pageHeader($child, 'ariya-team'),
        ]);
    }

    public function updateAriyaTeamCalendarUrl(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);
        $data = $request->validate(['calendar_url' => 'nullable|string|max:500']);
        $child->update(['ariya_team_calendar_url' => $data['calendar_url'] ?? null]);
        return redirect()->back();
    }

    public function storeTeamSchedule(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);
        $data = $request->validate([
            'user_id'    => 'nullable|exists:users,id',
            'shift_date' => 'required|date',
            'start_time' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'end_time'   => 'required|string|regex:/^\d{2}:\d{2}$/',
            'sort_order' => 'integer|min:0',
            'is_active'  => 'boolean',
        ]);
        AriyaTeamSchedule::create(array_merge($data, ['child_id' => $child->id]));
        return redirect()->back();
    }

    public function updateTeamSchedule(Request $request, Child $child, AriyaTeamSchedule $schedule)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);
        $data = $request->validate([
            'user_id'    => 'nullable|exists:users,id',
            'shift_date' => 'required|date',
            'start_time' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'end_time'   => 'required|string|regex:/^\d{2}:\d{2}$/',
            'sort_order' => 'integer|min:0',
            'is_active'  => 'boolean',
        ]);
        $schedule->update($data);
        return redirect()->back();
    }

    public function destroyTeamSchedule(Child $child, AriyaTeamSchedule $schedule)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);
        $schedule->delete();
        return redirect()->back();
    }

    /* ── Content Manager ── */

    public function contentManagerIndex()
    {
        $actor = auth()->user();
        if (!$actor || !$actor->hasMenuAccess('children')) abort(403);

        $with = [
            'menuItems'      => fn($q) => $q->orderBy('sort_order'),
            'emergencyItems' => fn($q) => $q->orderBy('sort_order'),
            'mandatoryItems' => fn($q) => $q->orderBy('sort_order'),
            'ariyaItems'     => fn($q) => $q->orderBy('sort_order')->with(['images']),
            'galleryItems'   => fn($q) => $q->orderBy('sort_order'),
            'medSlots'       => fn($q) => $q->orderBy('sort_order')->with('items'),
            'teamItems'      => fn($q) => $q->orderBy('sort_order')->with(['subItems']),
            'pageHeaders',
            'teamSchedules'  => fn($q) => $q->orderBy('shift_date')->orderBy('sort_order')->with('user:id,name'),
        ];

        $cols = ['id','name','photo','emergency_title','mandatory_title','team_title','face_sheet_pdf','ariya_team_calendar_url','schedule_email_recipients'];

        if ($actor->isSuperadmin()) {
            $children = Child::with($with)->orderBy('name')->get($cols);
        } else {
            $children = Child::with($with)
                ->whereHas('users', fn($q) => $q->where('users.id', $actor->id))
                ->orderBy('name')
                ->get($cols);
        }

        $scheduleUsers = $actor->isSuperadmin()
            ? \App\Models\User::orderBy('name')->get(['id', 'name'])
            : \App\Models\User::where('id', $actor->id)->get(['id', 'name']);

        return Inertia::render('Admin/ContentManager', [
            'children'      => $children,
            'scheduleUsers' => $scheduleUsers,
        ]);
    }

    /* ── Schedule Email ── */

    public function scheduleEmailIndex()
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $children = Child::orderBy('name')
            ->get(['id', 'name', 'photo', 'schedule_email_recipients', 'schedule_email_cc', 'schedule_email_bcc', 'schedule_email_time', 'schedule_email_subject', 'weekly_email_recipients', 'weekly_email_cc', 'weekly_email_bcc', 'weekly_email_time', 'weekly_email_subject', 'weekly_email_day']);

        return Inertia::render('Admin/ScheduleEmail', [
            'children' => $children,
        ]);
    }

    public function updateScheduleEmailRecipients(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'recipients'   => 'nullable|array',
            'recipients.*' => 'nullable|email|max:255',
            'cc'           => 'nullable|array',
            'cc.*'         => 'nullable|email|max:255',
            'bcc'          => 'nullable|array',
            'bcc.*'        => 'nullable|email|max:255',
            'subject'      => 'nullable|string|max:255',
            'send_time'    => 'nullable|string|regex:/^\d{2}:\d{2}$/',
        ]);

        $clean = fn($arr) => array_values(array_filter($arr ?? [], fn($e) => !empty(trim($e))));
        $child->update([
            'schedule_email_recipients' => $clean($data['recipients']) ?: null,
            'schedule_email_cc'         => $clean($data['cc']) ?: null,
            'schedule_email_bcc'        => $clean($data['bcc']) ?: null,
            'schedule_email_subject'    => $data['subject'] ?? null,
            'schedule_email_time'       => $data['send_time'] ?? '13:30',
        ]);

        return redirect()->back()->with('success', 'Settings saved.');
    }

    public function previewScheduleEmail(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $date = $request->input('date', now()->timezone('Asia/Kolkata')->toDateString());

        $schedules = AriyaTeamSchedule::where('child_id', $child->id)
            ->where('shift_date', $date)
            ->where('is_active', true)
            ->with('user:id,name')
            ->orderBy('sort_order')
            ->get();

        $scheduleData = $schedules->map(fn($s) => [
            'name'  => $s->user?->name ?? 'TBD',
            'start' => $this->fmt12($s->start_time),
            'end'   => $this->fmt12($s->end_time),
        ])->toArray();

        $html = view('emails.daily_schedule', [
            'child'     => $child,
            'schedules' => $scheduleData,
            'date'      => $date,
        ])->render();

        return response()->json(['html' => $html]);
    }

    public function sendDailyScheduleEmail(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $date = $request->input('date', now()->toDateString());

        $schedules = AriyaTeamSchedule::where('child_id', $child->id)
            ->where('shift_date', $date)
            ->where('is_active', true)
            ->with('user:id,name')
            ->orderBy('sort_order')
            ->get();

        $recipients = $child->schedule_email_recipients ?? [];

        if (empty($recipients)) {
            return redirect()->back()->withErrors(['email' => 'No email recipients configured.']);
        }

        $scheduleData = $schedules->map(fn($s) => [
            'name'  => $s->user?->name ?? 'TBD',
            'start' => $this->fmt12($s->start_time),
            'end'   => $this->fmt12($s->end_time),
        ])->toArray();

        $cc  = array_filter($child->schedule_email_cc  ?? []);
        $bcc = array_filter($child->schedule_email_bcc ?? []);
        $mailer = \Mail::to($recipients);
        if (!empty($cc))  $mailer = $mailer->cc($cc);
        if (!empty($bcc)) $mailer = $mailer->bcc($bcc);
        $mailer->send(new \App\Mail\DailyScheduleMail($child, $scheduleData, $date));

        return redirect()->back()->with('success', 'Schedule email sent to ' . count($recipients) . ' recipient(s).');
    }

    /* ── Weekly Schedule Email ── */

    public function updateWeeklyEmailSettings(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'recipients'   => 'nullable|array',
            'recipients.*' => 'nullable|email|max:255',
            'cc'           => 'nullable|array',
            'cc.*'         => 'nullable|email|max:255',
            'bcc'          => 'nullable|array',
            'bcc.*'        => 'nullable|email|max:255',
            'subject'      => 'nullable|string|max:255',
            'send_time'    => 'nullable|string|regex:/^\d{2}:\d{2}$/',
            'send_day'     => 'nullable|integer|min:0|max:6',
        ]);

        $clean = fn($arr) => array_values(array_filter($arr ?? [], fn($e) => !empty(trim($e))));
        $child->update([
            'weekly_email_recipients' => $clean($data['recipients']) ?: null,
            'weekly_email_cc'         => $clean($data['cc']) ?: null,
            'weekly_email_bcc'        => $clean($data['bcc']) ?: null,
            'weekly_email_subject'    => $data['subject'] ?? null,
            'weekly_email_time'       => $data['send_time'] ?? '13:35',
            'weekly_email_day'        => $data['send_day'] ?? 5,
        ]);

        return redirect()->back()->with('success', 'Weekly email settings saved.');
    }

    public function sendWeeklyScheduleEmail(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $startDate = $request->input('date', now()->timezone('Asia/Kolkata')->toDateString());
        $endDate   = \Carbon\Carbon::parse($startDate)->addDays(6)->toDateString();

        $recipients = $child->weekly_email_recipients ?? [];
        if (empty($recipients)) {
            return redirect()->back()->withErrors(['email' => 'No weekly email recipients configured.']);
        }

        $cmd = new \App\Console\Commands\SendWeeklyScheduleEmails();
        [$staffSummary, $dailyBreakdown] = $cmd->buildWeekData($child->id, $startDate, $endDate);

        $cc  = array_filter($child->weekly_email_cc  ?? []);
        $bcc = array_filter($child->weekly_email_bcc ?? []);
        $mailer = \Mail::to($recipients);
        if (!empty($cc))  $mailer = $mailer->cc($cc);
        if (!empty($bcc)) $mailer = $mailer->bcc($bcc);
        $mailer->send(new \App\Mail\WeeklyScheduleMail($child, $staffSummary, $dailyBreakdown, $startDate, $endDate));

        return redirect()->back()->with('success', 'Weekly email sent to ' . count($recipients) . ' recipient(s).');
    }

    public function previewWeeklyScheduleEmail(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);

        $startDate = $request->input('date', now()->timezone('Asia/Kolkata')->toDateString());
        $endDate   = \Carbon\Carbon::parse($startDate)->addDays(6)->toDateString();

        $cmd = new \App\Console\Commands\SendWeeklyScheduleEmails();
        [$staffSummary, $dailyBreakdown] = $cmd->buildWeekData($child->id, $startDate, $endDate);

        $html = view('emails.weekly_schedule', [
            'child'          => $child,
            'staffSummary'   => $staffSummary,
            'dailyBreakdown' => $dailyBreakdown,
            'startDate'      => $startDate,
            'endDate'        => $endDate,
        ])->render();

        return response()->json(['html' => $html]);
    }

    private function fmt12(string $time): string
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        $p   = $h < 12 ? 'am' : 'pm';
        $h12 = $h === 0 ? 12 : ($h > 12 ? $h - 12 : $h);
        return sprintf('%d:%02d %s', $h12, $m, $p);
    }
}
