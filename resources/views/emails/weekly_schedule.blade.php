<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #111; line-height: 1.8; margin: 0; padding: 0; background: #f5f5f5; }
  .wrap { max-width: 680px; margin: 24px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); padding: 32px 36px; }
  p { margin: 0 0 6px; }
  .week-intro { margin-bottom: 12px; }
  ol { margin: 0 0 24px; padding-left: 22px; }
  ol li { margin-bottom: 2px; }
  .extra  { color: #cc0000; }
  .day-header { font-weight: bold; margin: 20px 0 4px; }
  table.shifts { border-collapse: collapse; margin-bottom: 4px; }
  table.shifts td { padding: 2px 0; vertical-align: top; }
  td.time  { min-width: 200px; color: #333; white-space: nowrap; }
  td.staff { color: #111; }
  .spacer { height: 12px; }
  .footer-note { margin-top: 20px; color: #888; font-size: 13px; }
</style>
</head>
<body>
<div class="wrap">

  <p>Sir,</p>
  <br>
  <p class="week-intro">
    {{ \Carbon\Carbon::parse($startDate)->format('F j') }} thru {{ \Carbon\Carbon::parse($endDate)->format('F j') }}, total hours and extra hours.
  </p>

  <ol>
    @foreach($staffSummary as $staff)
    <li>
      {{ $staff['name'] }}, {{ $staff['total'] }},
      @if($staff['extra'])
        <span class="extra">Extra hrs: {{ $staff['extra'] }}</span>
      @else
        No Extra hrs
      @endif
    </li>
    @endforeach
  </ol>

  @foreach($dailyBreakdown as $day)
  <p class="day-header">{{ $day['label'] }}</p>
  <table class="shifts">
    @foreach($day['shifts'] as $shift)
    <tr>
      <td class="time">{{ $shift['start'] }} to {{ $shift['end'] }}</td>
      <td class="staff">&nbsp;&nbsp;{{ $shift['staff'] }} ({{ $shift['duration'] }})</td>
    </tr>
    @endforeach
  </table>
  <div class="spacer"></div>
  @endforeach

  <br>
  <p>Thank you</p>
  <p class="footer-note">Note: This is auto generated mail</p>

</div>
</body>
</html>
