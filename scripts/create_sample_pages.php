<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
// Bootstrap the application
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DashboardPage;
use App\Models\Child;

// Create or update the page-settings template
$template = DashboardPage::updateOrCreate(
    ['slug' => 'page-settings'],
    [
        'title' => 'Page Settings (template)',
        'description' => 'Global Page Settings template',
        'layout' => 'full_width',
        'page_theme' => 'ocean',
        'gallery_columns' => 3,
        'header_text' => 'Site Header',
        'page_structure' => [
            ['type' => 'text', 'title' => 'Welcome', 'body' => 'Welcome to the child page'],
        ],
    ]
);

// Create a test child
$child = Child::create(['name' => 'Test Child ' . time()]);

$slug = 'child-' . $child->id;
DashboardPage::updateOrCreate(
    ['slug' => $slug],
    [
        'title' => $child->name,
        'description' => null,
        'layout' => 'standard',
        'page_theme' => 'ocean',
        'gallery_columns' => 3,
        'header_link' => '/children/' . $child->id . '/menu',
        'template_id' => $template->id,
    ]
);

echo "TEMPLATE_ID={$template->id}\n";
echo "CHILD_ID={$child->id}\n";
echo "CHILD_SLUG={$slug}\n";
