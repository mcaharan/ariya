<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChildrenController;
use App\Http\Controllers\S3UploadController;
use App\Models\Child;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::get('/storage/{path}', function (string $path) {
    $normalized = ltrim($path, '/');

    if ($normalized === '' || str_contains($normalized, '..')) {
        abort(404);
    }

    if (! Storage::disk('public')->exists($normalized)) {
        abort(404);
    }

    return Storage::disk('public')->response($normalized);
})->where('path', '.*');

Route::get('/dashboard', function () {
    $user = Auth::user();
    /** @var User|null $user */

    $assignedChildren = $user && ! $user->isSuperadmin()
        ? Child::whereHas('users', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })->orderBy('name')->get(['id', 'name', 'photo'])
        : collect();

    $scheduleEmailCount = $user?->isSuperadmin()
        ? Child::whereNotNull('schedule_email_recipients')
            ->where('schedule_email_recipients', '!=', '[]')
            ->count()
        : 0;

    return Inertia::render('Dashboard', [
        'assignedChildren'    => $assignedChildren,
        'isSuperadmin'        => $user?->isSuperadmin() ?? false,
        'scheduleEmailCount'  => $scheduleEmailCount,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::get('/users/{user}/children/edit', [UserController::class, 'editChildren'])->name('users.children.edit');
    Route::post('/users/{user}/children', [UserController::class, 'syncChildren'])->name('users.children');
    Route::post('/users/{user}/permissions', [UserController::class, 'updatePermissions'])->name('users.permissions');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/children', [ChildrenController::class, 'index'])->name('children.index');
    Route::get('/children/{child}', [ChildrenController::class, 'show'])->name('children.show');
    Route::get('/children/{child}/emergency', [ChildrenController::class, 'emergency'])->name('children.emergency');
    Route::get('/children/{child}/mandatory-tasks', [ChildrenController::class, 'mandatoryTasks'])->name('children.mandatory-tasks');
    Route::post('/children/{child}/mandatory-items', [ChildrenController::class, 'storeMandatoryItem'])->name('children.mandatory-items.store');
    Route::post('/children/{child}/mandatory-items/{mandatoryItem}', [ChildrenController::class, 'updateMandatoryItem'])->name('children.mandatory-items.update');
    Route::delete('/children/{child}/mandatory-items/{mandatoryItem}', [ChildrenController::class, 'destroyMandatoryItem'])->name('children.mandatory-items.destroy');
    Route::post('/children/{child}/emergency-title', [ChildrenController::class, 'updateEmergencyTitle'])->name('children.emergency-title');
    Route::post('/children/{child}/mandatory-title', [ChildrenController::class, 'updateMandatoryTitle'])->name('children.mandatory-title');
    Route::post('/children/{child}/face-sheet', [ChildrenController::class, 'updateFaceSheet'])->name('children.face-sheet');
    Route::delete('/children/{child}/face-sheet', [ChildrenController::class, 'destroyFaceSheet'])->name('children.face-sheet.destroy');
    Route::get('/children/{child}/gallery/{section}', [ChildrenController::class, 'gallery'])->name('children.gallery');
    Route::post('/children/{child}/gallery/{section}', [ChildrenController::class, 'storeGalleryItem'])->name('children.gallery.store');
    Route::delete('/children/{child}/gallery/{section}/{galleryItem}', [ChildrenController::class, 'destroyGalleryItem'])->name('children.gallery.destroy');
    Route::get('/children/{child}/ariya/{type}', [ChildrenController::class, 'ariya'])->name('children.ariya');
    Route::get('/children/{child}/ariya-gallery/{ariyaItem}', [ChildrenController::class, 'ariyaGallery'])->name('children.ariya.gallery');
    Route::post('/children/{child}/ariya-items/{type}', [ChildrenController::class, 'storeAriyaItem'])->name('children.ariya-items.store');
    Route::post('/children/{child}/ariya-items-update/{ariyaItem}', [ChildrenController::class, 'updateAriyaItem'])->name('children.ariya-items.update');
    Route::delete('/children/{child}/ariya-items-destroy/{ariyaItem}', [ChildrenController::class, 'destroyAriyaItem'])->name('children.ariya-items.destroy');
    Route::post('/children/{child}/ariya-images/{ariyaItem}', [ChildrenController::class, 'storeAriyaImage'])->name('children.ariya-images.store');
    Route::delete('/children/{child}/ariya-images/{ariyaItem}/{ariyaImage}', [ChildrenController::class, 'destroyAriyaImage'])->name('children.ariya-images.destroy');
    Route::post('/children/{child}/emergency-items', [ChildrenController::class, 'syncEmergencyItems'])->name('children.emergency-items.sync');
    Route::post('/children/{child}/emergency-items/custom', [ChildrenController::class, 'storeEmergencyItem'])->name('children.emergency-items.store');
    Route::post('/children/{child}/emergency-items/{emergencyItem}', [ChildrenController::class, 'updateEmergencyItem'])->name('children.emergency-items.update');
    Route::delete('/children/{child}/emergency-items/{emergencyItem}', [ChildrenController::class, 'destroyEmergencyItem'])->name('children.emergency-items.destroy');
    Route::get('/children/list', [ChildrenController::class, 'list'])->name('children.list');
    Route::post('/children/switch', [ChildrenController::class, 'switch'])->name('children.switch');
    Route::post('/children', [ChildrenController::class, 'store'])->name('children.store');
    Route::put('/children/{child}', [ChildrenController::class, 'update'])->name('children.update');
    Route::post('/children/{child}/users', [ChildrenController::class, 'syncUsers'])->name('children.sync-users');
    Route::post('/children/{child}/menu-items', [ChildrenController::class, 'syncMenuItems'])->name('children.menu-items.sync');
    Route::post('/children/{child}/menu-items/custom', [ChildrenController::class, 'storeMenuItem'])->name('children.menu-items.store');
    Route::post('/children/{child}/menu-items/{menuItem}', [ChildrenController::class, 'updateMenuItem'])->name('children.menu-items.update');
    Route::delete('/children/{child}/menu-items/{menuItem}', [ChildrenController::class, 'destroyMenuItem'])->name('children.menu-items.destroy');
    Route::delete('/children/{child}', [ChildrenController::class, 'destroy'])->name('children.destroy');

    // Page Headers
    Route::post('/children/{child}/page-headers', [ChildrenController::class, 'updatePageHeader'])->name('children.page-headers.update');
    Route::delete('/children/{child}/page-headers/{pageKey}', [ChildrenController::class, 'destroyPageHeader'])->name('children.page-headers.destroy');

    // Team Training
    Route::get('/children/{child}/team-training', [ChildrenController::class, 'teamTraining'])->name('children.team-training');
    Route::post('/children/{child}/team-title', [ChildrenController::class, 'updateTeamTitle'])->name('children.team-title');
    Route::post('/children/{child}/team-items', [ChildrenController::class, 'storeTeamItem'])->name('children.team-items.store');
    Route::post('/children/{child}/team-items/{teamItem}', [ChildrenController::class, 'updateTeamItem'])->name('children.team-items.update');
    Route::delete('/children/{child}/team-items/{teamItem}', [ChildrenController::class, 'destroyTeamItem'])->name('children.team-items.destroy');
    Route::get('/children/{child}/team-training/{teamItem}', [ChildrenController::class, 'teamTrainingInner'])->name('children.team-training.inner');
    Route::get('/children/{child}/team-training/{teamItem}/quiz', [ChildrenController::class, 'teamTrainingQuiz'])->name('children.team-training.quiz');
    Route::get('/children/{child}/team-training/{teamItem}/{subItem}/quiz', [ChildrenController::class, 'teamTrainingSubQuiz'])->name('children.team-training.sub-quiz');
    Route::post('/children/{child}/team-sub-items/{teamItem}', [ChildrenController::class, 'storeTeamSubItem'])->name('children.team-sub-items.store');
    Route::post('/children/{child}/team-sub-items/{teamItem}/{subItem}', [ChildrenController::class, 'updateTeamSubItem'])->name('children.team-sub-items.update');
    Route::delete('/children/{child}/team-sub-items/{teamItem}/{subItem}', [ChildrenController::class, 'destroyTeamSubItem'])->name('children.team-sub-items.destroy');

    // Content Manager
    Route::get('/admin/content-manager', [ChildrenController::class, 'contentManagerIndex'])->name('admin.content-manager');

    // Schedule Email
    Route::get('/admin/schedule-email', [ChildrenController::class, 'scheduleEmailIndex'])->name('admin.schedule-email');
    Route::post('/children/{child}/schedule-email-recipients', [ChildrenController::class, 'updateScheduleEmailRecipients'])->name('children.schedule-email-recipients');
    Route::post('/children/{child}/send-daily-schedule', [ChildrenController::class, 'sendDailyScheduleEmail'])->name('children.send-daily-schedule');
    Route::get('/children/{child}/schedule-email-preview', [ChildrenController::class, 'previewScheduleEmail'])->name('children.schedule-email-preview');

    // Weekly Schedule Email
    Route::post('/children/{child}/weekly-email-settings', [ChildrenController::class, 'updateWeeklyEmailSettings'])->name('children.weekly-email-settings');
    Route::post('/children/{child}/send-weekly-schedule', [ChildrenController::class, 'sendWeeklyScheduleEmail'])->name('children.send-weekly-schedule');
    Route::get('/children/{child}/weekly-email-preview', [ChildrenController::class, 'previewWeeklyScheduleEmail'])->name('children.weekly-email-preview');

    // Ariya Team
    Route::get('/children/{child}/ariya-team', [ChildrenController::class, 'ariyaTeam'])->name('children.ariya-team');
    Route::post('/children/{child}/ariya-team/calendar-url', [ChildrenController::class, 'updateAriyaTeamCalendarUrl'])->name('children.ariya-team.calendar-url');
    Route::post('/children/{child}/team-schedules', [ChildrenController::class, 'storeTeamSchedule'])->name('children.team-schedules.store');
    Route::post('/children/{child}/team-schedules/{schedule}', [ChildrenController::class, 'updateTeamSchedule'])->name('children.team-schedules.update');
    Route::delete('/children/{child}/team-schedules/{schedule}', [ChildrenController::class, 'destroyTeamSchedule'])->name('children.team-schedules.destroy');

    // Medication
    Route::get('/children/{child}/medication', [ChildrenController::class, 'medication'])->name('children.medication');
    Route::post('/children/{child}/medication/{slot}/confirm', [ChildrenController::class, 'confirmMedSlot'])->name('children.medication.confirm');
    Route::post('/children/{child}/med-slots', [ChildrenController::class, 'storeMedSlot'])->name('children.med-slots.store');
    Route::post('/children/{child}/med-slots/{slot}', [ChildrenController::class, 'updateMedSlot'])->name('children.med-slots.update');
    Route::delete('/children/{child}/med-slots/{slot}', [ChildrenController::class, 'destroyMedSlot'])->name('children.med-slots.destroy');
    Route::post('/children/{child}/med-slots/{slot}/items', [ChildrenController::class, 'storeMedItem'])->name('children.med-items.store');
    Route::delete('/children/{child}/med-slots/{slot}/items/{item}', [ChildrenController::class, 'destroyMedItem'])->name('children.med-items.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/admin/media-upload', function () {
        $actor = auth()->user();
        if (!$actor || !$actor->isSuperadmin()) abort(403);
        return Inertia::render('Admin/MediaUpload');
    })->name('admin.media-upload');

    Route::post('/s3/upload', [S3UploadController::class, 'upload'])->name('s3.upload');

    Route::get('/s3-file/{path}', function (string $path) {
        $path = ltrim($path, '/');
        if ($path === '' || str_contains($path, '..')) abort(404);
        if (! Storage::disk('s3')->exists($path)) abort(404);
        return Storage::disk('s3')->response($path);
    })->where('path', '.*')->name('s3.file');
});

require __DIR__.'/auth.php';
