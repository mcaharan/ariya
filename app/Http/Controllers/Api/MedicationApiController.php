<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildMedSlot;
use App\Models\ChildMedItem;
use App\Models\ChildMedConfirmation;
use App\Models\ChildPageHeader;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MedicationApiController extends Controller
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

        $slots = ChildMedSlot::where('child_id', $child->id)
            ->orderBy('sort_order')
            ->with(['items', 'confirmations' => fn($q) => $q->whereDate('confirmed_at', today())])
            ->get();

        $headerImage = ChildPageHeader::where('child_id', $child->id)
            ->where('page_key', 'medication')
            ->value('header_image');

        return response()->json([
            'child'        => $child->only('id', 'name', 'photo'),
            'slots'        => $slots,
            'header_image' => $headerImage,
        ]);
    }

    public function storeSlot(Request $request, Child $child)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'label'      => 'required|string|max:255',
            'time'       => 'nullable|string|max:20',
            'sort_order' => 'integer',
        ]);

        $slot = ChildMedSlot::create([
            'child_id'   => $child->id,
            'label'      => $data['label'],
            'time'       => $data['time'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json($slot, 201);
    }

    public function updateSlot(Request $request, Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'label'      => 'required|string|max:255',
            'time'       => 'nullable|string|max:20',
            'sort_order' => 'integer',
        ]);

        $slot->label      = $data['label'];
        $slot->time       = $data['time'] ?? $slot->time;
        $slot->sort_order = $data['sort_order'] ?? $slot->sort_order;
        $slot->save();

        return response()->json($slot);
    }

    public function destroySlot(Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $slot->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function storeItem(Request $request, Child $child, ChildMedSlot $slot)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'dose'     => 'nullable|string|max:100',
            'notes'    => 'nullable|string',
        ]);

        $item = ChildMedItem::create([
            'med_slot_id' => $slot->id,
            'name'        => $data['name'],
            'dose'        => $data['dose'] ?? null,
            'notes'       => $data['notes'] ?? null,
        ]);

        return response()->json($item, 201);
    }

    public function destroyItem(Child $child, ChildMedSlot $slot, ChildMedItem $item)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) abort(403);

        $item->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function confirm(Request $request, Child $child, ChildMedSlot $slot)
    {
        $this->authorizeChild($child);

        $actor = auth()->user();

        $existing = ChildMedConfirmation::where('med_slot_id', $slot->id)
            ->whereDate('confirmed_at', today())
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['confirmed' => false]);
        }

        ChildMedConfirmation::create([
            'med_slot_id'  => $slot->id,
            'confirmed_by' => $actor->id,
            'confirmed_at' => Carbon::now(),
        ]);

        return response()->json(['confirmed' => true]);
    }
}
