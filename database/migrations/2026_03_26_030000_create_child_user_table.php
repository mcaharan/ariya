<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('child_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['child_id', 'user_id']);
        });

        // Backfill existing single-user child mappings if legacy column exists.
        if (Schema::hasColumn('children', 'user_id')) {
            $legacyRows = DB::table('children')
                ->whereNotNull('user_id')
                ->select(['id as child_id', 'user_id'])
                ->get();

            foreach ($legacyRows as $row) {
                DB::table('child_user')->updateOrInsert(
                    [
                        'child_id' => $row->child_id,
                        'user_id' => $row->user_id,
                    ],
                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('child_user');
    }
};
