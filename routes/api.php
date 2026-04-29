<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\ChildrenApiController;
use App\Http\Controllers\Api\EmergencyApiController;
use App\Http\Controllers\Api\MandatoryApiController;
use App\Http\Controllers\Api\MedicationApiController;
use App\Http\Controllers\Api\GalleryApiController;
use App\Http\Controllers\Api\TeamTrainingApiController;

// Public auth routes
Route::post('/login', [AuthApiController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/user', [AuthApiController::class, 'user']);
    Route::post('/logout', [AuthApiController::class, 'logout']);

    // Children
    Route::get('/children', [ChildrenApiController::class, 'index']);
    Route::get('/children/{child}', [ChildrenApiController::class, 'show']);
    Route::post('/children', [ChildrenApiController::class, 'store']);
    Route::put('/children/{child}', [ChildrenApiController::class, 'update']);
    Route::delete('/children/{child}', [ChildrenApiController::class, 'destroy']);

    // Emergency
    Route::get('/children/{child}/emergency', [EmergencyApiController::class, 'index']);
    Route::post('/children/{child}/emergency-items', [EmergencyApiController::class, 'store']);
    Route::put('/children/{child}/emergency-items/{emergencyItem}', [EmergencyApiController::class, 'update']);
    Route::delete('/children/{child}/emergency-items/{emergencyItem}', [EmergencyApiController::class, 'destroy']);

    // Mandatory Tasks
    Route::get('/children/{child}/mandatory-tasks', [MandatoryApiController::class, 'index']);
    Route::post('/children/{child}/mandatory-items', [MandatoryApiController::class, 'store']);
    Route::put('/children/{child}/mandatory-items/{mandatoryItem}', [MandatoryApiController::class, 'update']);
    Route::delete('/children/{child}/mandatory-items/{mandatoryItem}', [MandatoryApiController::class, 'destroy']);

    // Medication
    Route::get('/children/{child}/medication', [MedicationApiController::class, 'index']);
    Route::post('/children/{child}/med-slots', [MedicationApiController::class, 'storeSlot']);
    Route::put('/children/{child}/med-slots/{slot}', [MedicationApiController::class, 'updateSlot']);
    Route::delete('/children/{child}/med-slots/{slot}', [MedicationApiController::class, 'destroySlot']);
    Route::post('/children/{child}/med-slots/{slot}/items', [MedicationApiController::class, 'storeItem']);
    Route::delete('/children/{child}/med-slots/{slot}/items/{item}', [MedicationApiController::class, 'destroyItem']);
    Route::post('/children/{child}/medication/{slot}/confirm', [MedicationApiController::class, 'confirm']);

    // Gallery
    Route::get('/children/{child}/gallery/{section}', [GalleryApiController::class, 'index']);
    Route::post('/children/{child}/gallery/{section}', [GalleryApiController::class, 'store']);
    Route::delete('/children/{child}/gallery/{section}/{galleryItem}', [GalleryApiController::class, 'destroy']);

    // Team Training
    Route::get('/children/{child}/team-training', [TeamTrainingApiController::class, 'index']);
    Route::get('/children/{child}/team-training/{teamItem}', [TeamTrainingApiController::class, 'show']);
    Route::get('/children/{child}/team-training/{teamItem}/quiz', [TeamTrainingApiController::class, 'quiz']);
    Route::get('/children/{child}/team-training/{teamItem}/{subItem}/quiz', [TeamTrainingApiController::class, 'subQuiz']);
    Route::post('/children/{child}/team-items', [TeamTrainingApiController::class, 'storeItem']);
    Route::put('/children/{child}/team-items/{teamItem}', [TeamTrainingApiController::class, 'updateItem']);
    Route::delete('/children/{child}/team-items/{teamItem}', [TeamTrainingApiController::class, 'destroyItem']);
    Route::post('/children/{child}/team-sub-items/{teamItem}', [TeamTrainingApiController::class, 'storeSubItem']);
    Route::put('/children/{child}/team-sub-items/{teamItem}/{subItem}', [TeamTrainingApiController::class, 'updateSubItem']);
    Route::delete('/children/{child}/team-sub-items/{teamItem}/{subItem}', [TeamTrainingApiController::class, 'destroySubItem']);
});
