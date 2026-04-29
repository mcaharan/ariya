<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DashboardPage;

$slug = $argv[1] ?? 'child-5';
$page = DashboardPage::where('slug', $slug)->first();
if (! $page) {
    echo "Page not found: {$slug}\n";
    exit(1);
}

$pageArr = $page->toArray();

if (! empty($page->template_id)) {
    $template = DashboardPage::find($page->template_id);
    if ($template) {
        $templateArr = $template->toArray();
        $inheritable = [
            'layout', 'layout_style', 'page_theme', 'gallery_columns',
            'header_text', 'header_image', 'header_link', 'gallery',
            'page_sections', 'page_structure', 'description',
        ];
        foreach ($inheritable as $key) {
            if (empty($pageArr[$key]) && array_key_exists($key, $templateArr)) {
                $pageArr[$key] = $templateArr[$key];
            }
        }
    }
}

echo json_encode($pageArr, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
