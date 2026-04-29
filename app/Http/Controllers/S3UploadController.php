<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class S3UploadController extends Controller
{
    public function upload(Request $request)
    {
        $actor = auth()->user();
        if (! $actor || ! $actor->isSuperadmin()) {
            abort(403);
        }

        $request->validate([
            'file'   => 'required|file|max:51200',
            'folder' => 'nullable|string|max:100|regex:/^[a-zA-Z0-9_\-\/]+$/',
        ]);

        $folder = trim($request->input('folder', 'uploads'), '/') ?: 'uploads';

        $path = $request->file('file')->store($folder, 's3');

        $url = route('s3.file', ['path' => $path]);

        return response()->json([
            'path' => $path,
            'url'  => $url,
        ]);
    }
}
