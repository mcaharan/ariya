<?php

namespace App\Console\Commands;

use App\Mail\WeeklyScheduleMail;
use App\Models\AriyaTeamSchedule;
use App\Models\Child;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendWeeklyScheduleEmails extends Command
{
    protected $signature   = 'schedule:send-weekly-emails {--date= : Start date in Y-m-d format} {--force : Send regardless of scheduled day/time}';
    protected $description = 'Send weekly schedule summary emails to configured recipients for each child';

    public function handle(): void
    {
        $now         = now()->timezone('Asia/Kolkata');
        $startDate   = $this->option('date') ?: $now->toDateString();
        $endDate     = Carbon::parse($startDate)->addDays(6)->toDateString();
        $currentTime = $now->format('H:i');
        $currentDay  = $now->dayOfWeek; // 0=Sun … 6=Sat
        $force       = $this->option('force');

        $children = Child::whereNotNull('weekly_email_recipients')
            ->where('weekly_email_recipients', '!=', '[]')
            ->get();

        if ($children->isEmpty()) {
            $this->info('No children with weekly email recipients configured.');
            return;
        }

        foreach ($children as $child) {
            $recipients = $child->weekly_email_recipients ?? [];
            $sendTime   = $child->weekly_email_time ?? '13:35';
            $sendDay    = (int) ($child->weekly_email_day ?? 5); // 5 = Friday

            if (empty($recipients)) continue;

            if (!$force && ($currentDay !== $sendDay || $currentTime !== $sendTime)) {
                continue;
            }

            [$staffSummary, $dailyBreakdown] = $this->buildWeekData($child->id, $startDate, $endDate);

            $cc  = array_filter($child->weekly_email_cc  ?? []);
            $bcc = array_filter($child->weekly_email_bcc ?? []);
            $mailer = Mail::to($recipients);
            if (!empty($cc))  $mailer = $mailer->cc($cc);
            if (!empty($bcc)) $mailer = $mailer->bcc($bcc);
            $mailer->send(new WeeklyScheduleMail($child, $staffSummary, $dailyBreakdown, $startDate, $endDate));

            $this->info("✓ Weekly sent for {$child->name} → " . implode(', ', $recipients));
        }
    }

    public function buildWeekData(int $childId, string $startDate, string $endDate): array
    {
        $schedules = AriyaTeamSchedule::where('child_id', $childId)
            ->whereBetween('shift_date', [$startDate, $endDate])
            ->where('is_active', true)
            ->with('user:id,name')
            ->orderBy('shift_date')
            ->orderBy('sort_order')
            ->get();

        $staffRaw  = []; // name => ['total' => int, 'perDay' => [date => int]]
        $dailyMap  = []; // date => [shifts...]

        foreach ($schedules as $s) {
            $name = $s->user?->name ?? 'TBD';
            $date = Carbon::parse($s->shift_date)->toDateString();

            [$sh, $sm] = array_map('intval', explode(':', $s->start_time));
            [$eh, $em] = array_map('intval', explode(':', $s->end_time));
            $dur = ($eh * 60 + $em) - ($sh * 60 + $sm);
            if ($dur < 0) $dur += 1440; // midnight crossing guard

            $staffRaw[$name]['total']            = ($staffRaw[$name]['total'] ?? 0) + $dur;
            $staffRaw[$name]['perDay'][$date]     = ($staffRaw[$name]['perDay'][$date] ?? 0) + $dur;

            $dailyMap[$date][] = [
                'staff'    => $name,
                'start'    => $s->start_time,
                'end'      => $s->end_time,
                'duration' => $dur,
            ];
        }

        // Build formatted staff summary (alphabetical, extra = per-day excess over 8 hrs)
        ksort($staffRaw);
        $staffSummary = [];
        foreach ($staffRaw as $name => $data) {
            $extraMins = 0;
            foreach ($data['perDay'] as $dayMins) {
                if ($dayMins > 480) $extraMins += $dayMins - 480;
            }
            $staffSummary[] = [
                'name'  => $name,
                'total' => $this->fmtDuration($data['total']),
                'extra' => $extraMins > 0 ? $this->fmtDuration($extraMins) : null,
            ];
        }

        // Build formatted daily breakdown
        ksort($dailyMap);
        $dailyBreakdown = [];
        foreach ($dailyMap as $date => $shifts) {
            $formattedShifts = array_map(fn($sh) => [
                'staff'    => $sh['staff'],
                'start'    => $this->fmt12($sh['start']),
                'end'      => $this->fmt12($sh['end']),
                'duration' => $this->fmtDuration($sh['duration']),
            ], $shifts);

            $dailyBreakdown[] = [
                'label'  => Carbon::parse($date)->format('F j (l)'),
                'shifts' => $formattedShifts,
            ];
        }

        return [$staffSummary, $dailyBreakdown];
    }

    private function fmt12(string $time): string
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        $p   = $h < 12 ? 'am' : 'pm';
        $h12 = $h === 0 ? 12 : ($h > 12 ? $h - 12 : $h);
        return sprintf('%d:%02d %s', $h12, $m, $p);
    }

    private function fmtDuration(int $mins): string
    {
        $h = intdiv($mins, 60);
        $m = $mins % 60;
        if ($m === 0) return "{$h} hrs";
        return "{$h} hrs {$m} mins";
    }
}
