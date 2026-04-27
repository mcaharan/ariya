<?php

namespace App\Console\Commands;

use App\Mail\DailyScheduleMail;
use App\Models\AriyaTeamSchedule;
use App\Models\Child;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDailyScheduleEmails extends Command
{
    protected $signature   = 'schedule:send-daily-emails {--date= : Date in Y-m-d format} {--force : Send regardless of scheduled time}';
    protected $description = 'Send daily team schedule emails to configured recipients for each child';

    public function handle(): void
    {
        $now  = now()->timezone('Asia/Kolkata');
        $date = $this->option('date') ?: $now->toDateString();
        $currentTime = $now->format('H:i');
        $force = $this->option('force');

        $children = Child::whereNotNull('schedule_email_recipients')
            ->where('schedule_email_recipients', '!=', '[]')
            ->get();

        if ($children->isEmpty()) {
            $this->info('No children with email recipients configured.');
            return;
        }

        foreach ($children as $child) {
            $recipients  = $child->schedule_email_recipients ?? [];
            $sendTime    = $child->schedule_email_time ?? '13:30';

            if (empty($recipients)) continue;

            // Only send if current IST time matches configured time (or forced)
            if (!$force && $currentTime !== $sendTime) {
                continue;
            }

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

            $cc  = array_filter($child->schedule_email_cc  ?? []);
            $bcc = array_filter($child->schedule_email_bcc ?? []);
            $mailer = Mail::to($recipients);
            if (!empty($cc))  $mailer = $mailer->cc($cc);
            if (!empty($bcc)) $mailer = $mailer->bcc($bcc);
            $mailer->send(new DailyScheduleMail($child, $scheduleData, $date));

            $this->info("✓ Sent for {$child->name} at {$sendTime} IST → " . implode(', ', $recipients));
        }
    }

    private function fmt12(string $time): string
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        $p   = $h < 12 ? 'am' : 'pm';
        $h12 = $h === 0 ? 12 : ($h > 12 ? $h - 12 : $h);
        return sprintf('%d:%02d %s', $h12, $m, $p);
    }
}
