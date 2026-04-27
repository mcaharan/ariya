<?php

namespace App\Mail;

use App\Models\Child;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyScheduleMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Child $child,
        public array $schedules,
        public string $date
    ) {}

    public function envelope(): Envelope
    {
        $label      = \Carbon\Carbon::parse($this->date)->format('M d, Y');
        $rawSubject = $this->child->schedule_email_subject;

        if ($rawSubject) {
            $subject = str_replace(
                ['{child_name}', '{date}'],
                [$this->child->name, $label],
                $rawSubject
            );
        } else {
            $subject = "{$this->child->name} Schedule: {$label}";
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
        return new Content(
            view: 'emails.daily_schedule',
        );
    }
}
