<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('dashboard_menu_items');
        Schema::dropIfExists('dashboard_pages');
    }

    public function down(): void
    {
        // Intentionally not restored
    }
};
