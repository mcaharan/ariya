<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.6; max-width: 520px; margin: 40px auto; padding: 0 20px; }
  h2 { font-size: 17px; margin-bottom: 24px; color: #1a1a1a; }
  .shift { margin-bottom: 18px; }
  .shift-name { font-weight: bold; font-size: 15px; }
  .shift-time { color: #444; }
  .footer { margin-top: 32px; color: #555; }
</style>
</head>
<body>

<p>Sir,</p>

<h2>{{ $child->name }} Schedule: {{ \Carbon\Carbon::parse($date)->format('M d, Y') }} - {{ \Carbon\Carbon::parse($date)->format('l') }}</h2>

@forelse($schedules as $shift)
<div class="shift">
  <div class="shift-name">{{ $shift['name'] }}</div>
  <div class="shift-time">{{ $shift['start'] }} – {{ $shift['end'] }}</div>
</div>
@empty
<p style="color:#888;">No shifts scheduled for this date.</p>
@endforelse

<p class="footer">Thank you</p>

</body>
</html>
