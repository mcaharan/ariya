<?php

namespace App\Mail;

use App\Models\Child;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyScheduleMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Child $child,
        public array $staffSummary,
        public array $dailyBreakdown,
        public string $startDate,
        public string $endDate
    ) {}

    public function envelope(): Envelope
    {
        $startLabel = \Carbon\Carbon::parse($this->startDate)->format('M d, Y');
        $endLabel   = \Carbon\Carbon::parse($this->endDate)->format('M d, Y');
        $rawSubject = $this->child->weekly_email_subject;

        if ($rawSubject) {
            $subject = str_replace(
                ['{child_name}', '{start_date}', '{end_date}'],
                [$this->child->name, $startLabel, $endLabel],
                $rawSubject
            );
        } else {
            $subject = "{$this->child->name} Weekly Schedule: {$startLabel} – {$endLabel}";
        }

        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address(
                config('mail.from.address', 'noreply@ariyatracker.com'),
                config('mail.from.name', 'Ariya Tracker')
            ),
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.weekly_schedule');
    }
}
