<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\DashboardPage;
use App\Models\DashboardMenuItem;

class ClearDashboardPage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ariya:clear-page {slugOrId} {--delete-menu : Also delete DashboardMenuItem rows that reference this page}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear content fields for a dashboard page (backup first). Accepts page slug or id.';

    public function handle()
    {
        $key = $this->argument('slugOrId');
        $deleteMenu = $this->option('delete-menu');

        /** @var DashboardPage|null $page */
        $page = null;
        if (ctype_digit((string) $key)) {
            $page = DashboardPage::find((int) $key);
        }

        if (! $page) {
            $page = DashboardPage::where('slug', (string) $key)->first();
        }

        if (! $page) {
            $this->error('Page not found for: ' . $key);
            return 1;
        }

        $this->info('Found page: ' . $page->id . ' / ' . $page->title . ' (' . $page->slug . ')');

        // backup
        $backup = [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'description' => $page->description,
            'layout' => $page->layout,
            'page_theme' => $page->page_theme,
            'gallery_columns' => $page->gallery_columns,
            'header_text' => $page->header_text,
            'header_image' => $page->header_image,
            'header_link' => $page->header_link ?? null,
            'gallery' => $page->gallery,
            'page_sections' => $page->page_sections,
            'created_at' => (string) $page->created_at,
            'updated_at' => (string) $page->updated_at,
        ];

        $ts = date('Ymd_His');
        $filename = "dashboard_page_backup_{$page->id}_{$ts}.json";
        Storage::disk('local')->put('page_backups/' . $filename, json_encode($backup, JSON_PRETTY_PRINT));
        $this->info('Backup written to storage/app/page_backups/' . $filename);

        // delete header image file if present
        if ($page->header_image && str_starts_with($page->header_image, '/storage/')) {
            $path = ltrim(str_replace('/storage/', '', $page->header_image), '/');
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                $this->info('Deleted header image: ' . $path);
            }
        }

        // delete gallery images
        if (is_array($page->gallery)) {
            foreach ($page->gallery as $g) {
                $p = (string) ($g['path'] ?? '');
                if ($p && str_starts_with($p, '/storage/')) {
                    $pPath = ltrim(str_replace('/storage/', '', $p), '/');
                    if (Storage::disk('public')->exists($pPath)) {
                        Storage::disk('public')->delete($pPath);
                        $this->info('Deleted gallery image: ' . $pPath);
                    }
                }
            }
        }

        // clear fields
        $page->description = null;
        $page->layout = 'standard';
        $page->page_theme = null;
        $page->gallery_columns = null;
        $page->header_text = null;
        $page->header_image = null;
        $page->header_link = null;
        $page->gallery = [];
        $page->page_sections = [];
        $page->save();

        $this->info('Cleared page fields for page id ' . $page->id);

        if ($deleteMenu) {
            $deleted = DashboardMenuItem::where('dashboard_page_id', $page->id)->delete();
            $this->info('Deleted ' . $deleted . ' menu item(s) referencing this page.');
        }

        $this->info('Done.');
        return 0;
    }
}
