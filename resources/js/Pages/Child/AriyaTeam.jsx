import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import ExcelJS from 'exceljs';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const GREEN  = '#1a9e6b';

const USER_COLORS = [
    '#6366f1','#f59e0b','#06b6d4','#8b5cf6','#ec4899','#f97316','#0ea5e9','#84cc16',
];

function getColor(name) {
    if (!name) return '#ef4444';
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % USER_COLORS.length;
    return USER_COLORS[h];
}

function fmt12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const p = h < 12 ? 'am' : 'pm';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2,'0')}${p}`;
}

function toMins(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function shiftMins(s) {
    if (!s.start_time || !s.end_time) return 0;
    let d = toMins(s.end_time) - toMins(s.start_time);
    if (d < 0) d += 1440;
    return d;
}

function fmtMins(mins) {
    if (!mins) return '—';
    const h = Math.floor(mins / 60), m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function pad(n){ return String(n).padStart(2,'0'); }
function dateKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }

export default function AriyaTeam({ child, schedules = [] }) {
    const now  = new Date();
    const tStr = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    const [yr, setYr] = useState(now.getFullYear());
    const [mo, setMo] = useState(now.getMonth());

    const goToday = () => { setYr(now.getFullYear()); setMo(now.getMonth()); };
    const prev    = () => mo===0 ? (setMo(11),setYr(y=>y-1)) : setMo(m=>m-1);
    const next    = () => mo===11? (setMo(0), setYr(y=>y+1)) : setMo(m=>m+1);

    const isCurrentMonth = yr===now.getFullYear() && mo===now.getMonth();

    /* ── calendar grid ── */
    const firstDow = new Date(yr, mo, 1).getDay();
    const dim      = new Date(yr, mo+1, 0).getDate();
    const cells    = [];
    for (let i=0; i<firstDow; i++) cells.push(null);
    for (let d=1; d<=dim; d++)     cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const byDate = {};
    schedules.forEach(s => {
        const k = String(s.shift_date).substring(0,10);
        (byDate[k] = byDate[k]||[]).push(s);
    });

    const weeks = [];
    for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7));

    /* ── monthly schedules ── */
    const monthPfx    = `${yr}-${pad(mo+1)}`;
    const monthShifts = schedules.filter(s => String(s.shift_date).substring(0,7) === monthPfx);

    /* ── per-user stats ── */
    // Build: uid -> { name, color, totalMins, weekMins: { wi: mins } }
    const userStats = {};
    monthShifts.forEach(s => {
        const name = s.user?.name || null;
        const uid  = s.user_id != null ? String(s.user_id) : 'tbd';
        if (!userStats[uid]) {
            userStats[uid] = { name: name || 'TBD', color: getColor(name), totalMins: 0, weekMins: {} };
        }
        const mins = shiftMins(s);
        userStats[uid].totalMins += mins;

        // find which week row this day falls in
        const day = parseInt(String(s.shift_date).substring(8,10), 10);
        const wi  = weeks.findIndex(w => w.includes(day));
        if (wi >= 0) {
            userStats[uid].weekMins[wi] = (userStats[uid].weekMins[wi] || 0) + mins;
        }
    });

    const userRows = Object.values(userStats).sort((a,b) =>
        a.name === 'TBD' ? 1 : b.name === 'TBD' ? -1 : a.name.localeCompare(b.name)
    );

    const calUrl = child.ariya_team_calendar_url;

    /* ── Excel helpers ── */
    const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    const fmtDate = (dStr) => {
        const d = new Date(dStr + 'T00:00:00');
        return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    const fmtHrsDec = (mins) => mins ? +(mins / 60).toFixed(2) : 0;

    const safeSheetName = (name, used) => {
        let n = name.substring(0, 31).replace(/[\\/*?[\]:]/g, '-');
        if (used[n]) { n = n.substring(0, 28) + ` (${++used[n]})`; } else { used[n] = 1; }
        return n;
    };

    const toArgb = (hex) => 'FF' + hex.replace('#','');

    const saveWorkbook = async (wb, filename) => {
        const buf  = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    };

    /* shared style builders */
    const border = { style: 'thin', color: { argb: 'FFD1D5DB' } };
    const allBorders = { top: border, left: border, bottom: border, right: border };

    const applyHeader = (row, bgHex = '#1f2937', fgHex = '#ffffff') => {
        row.eachCell(cell => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(bgHex) } };
            cell.font   = { bold: true, color: { argb: toArgb(fgHex) }, name: 'Calibri', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = allBorders;
        });
        row.height = 22;
    };

    const applySection = (row, bgHex = '#1a9e6b') => {
        row.eachCell(cell => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(bgHex) } };
            cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.border = allBorders;
        });
        row.height = 20;
    };

    const applyData = (row, isAlt = false) => {
        row.eachCell({ includeEmpty: true }, cell => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? 'FFF9FAFB' : 'FFFFFFFF' } };
            cell.font   = { name: 'Calibri', size: 10 };
            cell.alignment = { vertical: 'middle' };
            cell.border = allBorders;
        });
        row.height = 18;
    };

    const applyTotal = (row, bgHex = '#f0fdf4', bold = true) => {
        row.eachCell({ includeEmpty: true }, cell => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(bgHex) } };
            cell.font   = { bold, name: 'Calibri', size: 10, color: { argb: 'FF111827' } };
            cell.alignment = { vertical: 'middle' };
            cell.border = allBorders;
        });
        row.height = 20;
    };

    const applyTitle = (row) => {
        row.eachCell(cell => {
            cell.font = { bold: true, name: 'Calibri', size: 13, color: { argb: 'FF111827' } };
            cell.alignment = { vertical: 'middle' };
        });
        row.height = 26;
    };

    const applySubtitle = (row) => {
        row.eachCell(cell => {
            cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF6B7280' } };
            cell.alignment = { vertical: 'middle' };
        });
        row.height = 16;
    };

    /* build byUser from all schedules */
    const byUser = {};
    schedules.forEach(s => {
        const uid  = s.user_id != null ? String(s.user_id) : 'tbd';
        const name = s.user?.name || 'TBD';
        if (!byUser[uid]) byUser[uid] = { name, shifts: [] };
        byUser[uid].shifts.push(s);
    });
    const allUserList = Object.values(byUser).sort((a,b) =>
        a.name === 'TBD' ? 1 : b.name === 'TBD' ? -1 : a.name.localeCompare(b.name)
    );

    /* ── MONTHLY EXCEL ── */
    const isoWeekKey = (dStr) => {
        const d = new Date(dStr + 'T00:00:00');
        const day = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - day);
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const wk = Math.ceil(((d - jan1) / 86400000 + 1) / 7);
        return `${d.getFullYear()}-W${String(wk).padStart(2,'0')}`;
    };

    const weekRangeLabel = (wkShifts) => {
        const dates = wkShifts.map(s => String(s.shift_date).substring(0,10)).sort();
        const first = new Date(dates[0] + 'T00:00:00');
        const sun = new Date(first); sun.setDate(first.getDate() - first.getDay());
        const sat = new Date(sun);   sat.setDate(sun.getDate() + 6);
        return `${fmtDate(sun.toISOString().substring(0,10))} – ${fmtDate(sat.toISOString().substring(0,10))}`;
    };

    const exportMonthly = async () => {
        const wb   = new ExcelJS.Workbook();
        wb.creator = 'Ariya Team Schedule';
        wb.created = new Date();

        const usedFixed = {};
        allUserList.forEach(u => {
            const sorted = u.shifts.slice().sort((a,b) =>
                String(a.shift_date) < String(b.shift_date) ? -1 : 1
            );
            const byMonth = {};
            sorted.forEach(s => {
                const mk = String(s.shift_date).substring(0,7);
                if (!byMonth[mk]) byMonth[mk] = [];
                byMonth[mk].push(s);
            });

            const ws   = wb.addWorksheet(safeSheetName(u.name, usedFixed));
            const uClr = getColor(u.name === 'TBD' ? null : u.name);
            ws.columns = [
                { key:'date', width:26 },{ key:'day', width:13 },
                { key:'s',    width:12 },{ key:'e',   width:12 },
                { key:'dur',  width:13 },{ key:'hrs', width:12 },
            ];

            const titleRow = ws.addRow([u.name]);
            ws.mergeCells(`A1:F1`);
            titleRow.getCell(1).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:toArgb(uClr) } };
            titleRow.getCell(1).font = { bold:true, color:{ argb:'FFFFFFFF' }, name:'Calibri', size:14 };
            titleRow.getCell(1).alignment = { vertical:'middle', horizontal:'center' };
            titleRow.height = 30;

            const subRow = ws.addRow([`Generated: ${fmtDate(new Date().toISOString().substring(0,10))}   ·   Child: ${child.name}`]);
            ws.mergeCells(`A2:F2`);
            applySubtitle(subRow);
            ws.addRow([]);

            let grandTotal = 0, grandShifts = 0, alt = 0;

            Object.keys(byMonth).sort().forEach(mk => {
                const [y,mn] = mk.split('-');
                const label  = `${MONTHS[parseInt(mn,10)-1]} ${y}`;
                const mShifts = byMonth[mk];
                const mMins   = mShifts.reduce((a,s) => a+shiftMins(s), 0);
                grandTotal  += mMins;
                grandShifts += mShifts.length;

                const secRow = ws.addRow([label]);
                ws.mergeCells(`A${secRow.number}:F${secRow.number}`);
                applySection(secRow, uClr);

                const hdr = ws.addRow(['Date','Day','Start','End','Duration','Hrs (dec)']);
                applyHeader(hdr);
                hdr.getCell(3).alignment = { horizontal:'center', vertical:'middle' };
                hdr.getCell(4).alignment = { horizontal:'center', vertical:'middle' };
                hdr.getCell(5).alignment = { horizontal:'center', vertical:'middle' };
                hdr.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
                hdr.autoFilter = { from: { row: hdr.number, column: 1 }, to: { row: hdr.number, column: 6 } };

                mShifts.forEach(s => {
                    const dStr = String(s.shift_date).substring(0,10);
                    const dObj = new Date(dStr + 'T00:00:00');
                    const mins = shiftMins(s);
                    const row  = ws.addRow([fmtDate(dStr), DAY_NAMES[dObj.getDay()], fmt12(s.start_time), fmt12(s.end_time), fmtMins(mins), mins ? fmtHrsDec(mins) : '']);
                    applyData(row, alt++ % 2 === 1);
                    row.getCell(3).alignment = { horizontal:'center', vertical:'middle' };
                    row.getCell(4).alignment = { horizontal:'center', vertical:'middle' };
                    row.getCell(5).alignment = { horizontal:'center', vertical:'middle' };
                    row.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
                    if (mins) row.getCell(6).numFmt = '0.00';
                });

                const stRow = ws.addRow(['','','','',`${label} Total`, fmtHrsDec(mMins)]);
                applyTotal(stRow, '#f0fdf4');
                stRow.getCell(5).font = { bold:true, name:'Calibri', size:10, color:{ argb:toArgb(GREEN) } };
                stRow.getCell(5).alignment = { horizontal:'right', vertical:'middle' };
                stRow.getCell(6).numFmt = '0.00';
                stRow.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
                ws.addRow([]); alt = 0;
            });

            ws.addRow([]);
            const gtRow = ws.addRow(['','','','','GRAND TOTAL', fmtHrsDec(grandTotal)]);
            applyTotal(gtRow, '#dcfce7', true);
            gtRow.getCell(5).font = { bold:true, name:'Calibri', size:11, color:{ argb:'FF166534' } };
            gtRow.getCell(5).alignment = { horizontal:'right', vertical:'middle' };
            gtRow.getCell(6).font = { bold:true, name:'Calibri', size:11, color:{ argb:'FF166534' } };
            gtRow.getCell(6).numFmt = '0.00'; gtRow.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
            gtRow.height = 24;
            const shRow = ws.addRow(['','','','','Total Shifts', grandShifts]);
            applyTotal(shRow, '#f9fafb', false);
            shRow.getCell(5).alignment = { horizontal:'right', vertical:'middle' };
            shRow.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
            ws.views = [{ state:'frozen', ySplit:3 }];
        });

        /* Monthly Summary sheet */
        const allMonths = [...new Set(schedules.map(s => String(s.shift_date).substring(0,7)))].sort();
        const numCols   = allMonths.length + 3; // name + months + grand total + shifts
        const lastCol   = String.fromCharCode(64 + numCols);
        const sumWs = wb.addWorksheet('Monthly Summary');
        sumWs.columns = [{ key:'name', width:28 }, ...allMonths.map(()=>({ width:16 })), { width:16 }, { width:14 }];

        const sumTitle = sumWs.addRow(['Staff Monthly Hours Summary']);
        sumWs.mergeCells(`A1:${lastCol}1`);
        sumTitle.getCell(1).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:toArgb(GREEN) } };
        sumTitle.getCell(1).font = { bold:true, color:{ argb:'FFFFFFFF' }, name:'Calibri', size:13 };
        sumTitle.getCell(1).alignment = { vertical:'middle', horizontal:'center' };
        sumTitle.height = 28;

        const sumSub = sumWs.addRow([`Generated: ${fmtDate(new Date().toISOString().substring(0,10))}   ·   Child: ${child.name}`]);
        sumWs.mergeCells(`A2:${lastCol}2`);
        applySubtitle(sumSub);
        sumWs.addRow([]);

        const mHdr = sumWs.addRow(['Staff Member', ...allMonths.map(m => { const [y,mn]=m.split('-'); return `${MONTHS[parseInt(mn,10)-1]} ${y}`; }), 'Grand Total', 'Shifts']);
        applyHeader(mHdr);
        for (let c = 2; c <= numCols; c++) mHdr.getCell(c).alignment = { horizontal:'center', vertical:'middle' };

        allUserList.forEach((u, ui) => {
            const mm = {};
            u.shifts.forEach(s => { const mk = String(s.shift_date).substring(0,7); mm[mk]=(mm[mk]||0)+shiftMins(s); });
            const grandHrs = u.shifts.reduce((a,s)=>a+shiftMins(s),0);
            const row = sumWs.addRow([u.name, ...allMonths.map(m => mm[m] ? fmtHrsDec(mm[m]) : '—'), fmtHrsDec(grandHrs), u.shifts.length]);
            applyData(row, ui % 2 === 1);
            row.getCell(1).font = { bold:true, name:'Calibri', size:10, color:{ argb:toArgb(getColor(u.name==='TBD'?null:u.name)) } };
            for (let c = 2; c <= numCols - 1; c++) {
                row.getCell(c).alignment = { horizontal:'center', vertical:'middle' };
                if (row.getCell(c).value !== '—') row.getCell(c).numFmt = '0.00';
            }
            row.getCell(numCols).alignment = { horizontal:'center', vertical:'middle' };
        });

        const totRow = sumWs.addRow(['TOTAL', ...allMonths.map(m => {
            const t = allUserList.reduce((a,u)=>a+u.shifts.filter(s=>String(s.shift_date).substring(0,7)===m).reduce((x,s)=>x+shiftMins(s),0),0);
            return t ? fmtHrsDec(t) : '—';
        }), fmtHrsDec(schedules.reduce((a,s)=>a+shiftMins(s),0)), schedules.length]);
        applyTotal(totRow, '#f0fdf4', true);
        totRow.getCell(1).font = { bold:true, name:'Calibri', size:10 };
        for (let c = 2; c <= numCols; c++) {
            totRow.getCell(c).alignment = { horizontal:'center', vertical:'middle' };
            if (totRow.getCell(c).value !== '—') totRow.getCell(c).numFmt = '0.00';
        }

        sumWs.views = [{ state:'frozen', ySplit:4 }];

        await saveWorkbook(wb, `Ariya_Team_${child.name.replace(/\s+/g,'_')}_Monthly.xlsx`);
    };

    /* ── WEEKLY EXCEL ── */
    const exportWeekly = async () => {
        const wb   = new ExcelJS.Workbook();
        wb.creator = 'Ariya Team Schedule';
        wb.created = new Date();
        const used = {};

        allUserList.forEach(u => {
            const sorted = u.shifts.slice().sort((a,b) =>
                String(a.shift_date) < String(b.shift_date) ? -1 : 1
            );
            const byWeek = {};
            sorted.forEach(s => {
                const wk = isoWeekKey(String(s.shift_date).substring(0,10));
                if (!byWeek[wk]) byWeek[wk] = [];
                byWeek[wk].push(s);
            });

            const ws   = wb.addWorksheet(safeSheetName(u.name, used));
            const uClr = getColor(u.name === 'TBD' ? null : u.name);
            ws.columns = [
                { key:'date', width:26 },{ key:'day', width:13 },
                { key:'s',    width:12 },{ key:'e',   width:12 },
                { key:'dur',  width:13 },{ key:'hrs', width:12 },
            ];

            const titleRow = ws.addRow([u.name]);
            ws.mergeCells(`A1:F1`);
            titleRow.getCell(1).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:toArgb(uClr) } };
            titleRow.getCell(1).font = { bold:true, color:{ argb:'FFFFFFFF' }, name:'Calibri', size:14 };
            titleRow.getCell(1).alignment = { vertical:'middle', horizontal:'center' };
            titleRow.height = 30;

            const subRow = ws.addRow([`Generated: ${fmtDate(new Date().toISOString().substring(0,10))}   ·   Child: ${child.name}`]);
            ws.mergeCells(`A2:F2`);
            applySubtitle(subRow);
            ws.addRow([]);

            let grandTotal = 0, grandShifts = 0, alt = 0, wNum = 1;

            Object.keys(byWeek).sort().forEach(wk => {
                const wShifts = byWeek[wk];
                const wMins   = wShifts.reduce((a,s)=>a+shiftMins(s),0);
                grandTotal  += wMins;
                grandShifts += wShifts.length;

                const label  = `Week ${wNum++}  ·  ${weekRangeLabel(wShifts)}`;
                const secRow = ws.addRow([label]);
                ws.mergeCells(`A${secRow.number}:F${secRow.number}`);
                applySection(secRow, uClr);

                const hdr = ws.addRow(['Date','Day','Start','End','Duration','Hrs (dec)']);
                applyHeader(hdr);
                hdr.getCell(3).alignment = { horizontal:'center', vertical:'middle' };
                hdr.getCell(4).alignment = { horizontal:'center', vertical:'middle' };
                hdr.getCell(5).alignment = { horizontal:'center', vertical:'middle' };
                hdr.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
                hdr.autoFilter = { from: { row: hdr.number, column: 1 }, to: { row: hdr.number, column: 6 } };

                wShifts.forEach(s => {
                    const dStr = String(s.shift_date).substring(0,10);
                    const dObj = new Date(dStr + 'T00:00:00');
                    const mins = shiftMins(s);
                    const row  = ws.addRow([fmtDate(dStr), DAY_NAMES[dObj.getDay()], fmt12(s.start_time), fmt12(s.end_time), fmtMins(mins), mins ? fmtHrsDec(mins) : '']);
                    applyData(row, alt++ % 2 === 1);
                    row.getCell(3).alignment = { horizontal:'center', vertical:'middle' };
                    row.getCell(4).alignment = { horizontal:'center', vertical:'middle' };
                    row.getCell(5).alignment = { horizontal:'center', vertical:'middle' };
                    row.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
                    if (mins) row.getCell(6).numFmt = '0.00';
                });

                const stRow = ws.addRow(['','','','','Week Total', fmtHrsDec(wMins)]);
                applyTotal(stRow, '#f0fdf4');
                stRow.getCell(5).font = { bold:true, name:'Calibri', size:10, color:{ argb:toArgb(GREEN) } };
                stRow.getCell(5).alignment = { horizontal:'right', vertical:'middle' };
                stRow.getCell(6).numFmt = '0.00';
                stRow.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
                ws.addRow([]); alt = 0;
            });

            ws.addRow([]);
            const gtRow = ws.addRow(['','','','','GRAND TOTAL', fmtHrsDec(grandTotal)]);
            applyTotal(gtRow, '#dcfce7', true);
            gtRow.getCell(5).font = { bold:true, name:'Calibri', size:11, color:{ argb:'FF166534' } };
            gtRow.getCell(5).alignment = { horizontal:'right', vertical:'middle' };
            gtRow.getCell(6).font = { bold:true, name:'Calibri', size:11, color:{ argb:'FF166534' } };
            gtRow.getCell(6).numFmt = '0.00'; gtRow.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
            gtRow.height = 24;
            const shRow = ws.addRow(['','','','','Total Shifts', grandShifts]);
            applyTotal(shRow, '#f9fafb', false);
            shRow.getCell(5).alignment = { horizontal:'right', vertical:'middle' };
            shRow.getCell(6).alignment = { horizontal:'center', vertical:'middle' };
            ws.views = [{ state:'frozen', ySplit:3 }];
        });

        /* Weekly Summary sheet */
        const allWeekKeys = [...new Set(schedules.map(s => isoWeekKey(String(s.shift_date).substring(0,10))))].sort();
        const wNumCols    = allWeekKeys.length + 3;
        const wLastCol    = String.fromCharCode(64 + wNumCols);
        const sumWs = wb.addWorksheet('Weekly Summary');
        sumWs.columns = [{ key:'name', width:28 }, ...allWeekKeys.map(()=>({ width:16 })), { width:16 }, { width:13 }];

        const sumTitle = sumWs.addRow(['Staff Weekly Hours Summary']);
        sumWs.mergeCells(`A1:${wLastCol}1`);
        sumTitle.getCell(1).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:toArgb(GREEN) } };
        sumTitle.getCell(1).font = { bold:true, color:{ argb:'FFFFFFFF' }, name:'Calibri', size:13 };
        sumTitle.getCell(1).alignment = { vertical:'middle', horizontal:'center' };
        sumTitle.height = 28;

        const sumSub = sumWs.addRow([`Generated: ${fmtDate(new Date().toISOString().substring(0,10))}   ·   Child: ${child.name}`]);
        sumWs.mergeCells(`A2:${wLastCol}2`);
        applySubtitle(sumSub);
        sumWs.addRow([]);

        let wLabelNum = 1;
        const wkLabels = allWeekKeys.map(wk => {
            const sample = schedules.find(s => isoWeekKey(String(s.shift_date).substring(0,10)) === wk);
            if (!sample) return `Week ${wLabelNum++}`;
            const sun = new Date(String(sample.shift_date).substring(0,10) + 'T00:00:00');
            sun.setDate(sun.getDate() - sun.getDay());
            return `Wk ${wLabelNum++} · ${MONTHS[sun.getMonth()].slice(0,3)} ${sun.getDate()}`;
        });

        const mHdr = sumWs.addRow(['Staff Member', ...wkLabels, 'Grand Total', 'Shifts']);
        applyHeader(mHdr);
        for (let c = 2; c <= wNumCols; c++) mHdr.getCell(c).alignment = { horizontal:'center', vertical:'middle' };

        allUserList.forEach((u, ui) => {
            const wm = {};
            u.shifts.forEach(s => { const wk=isoWeekKey(String(s.shift_date).substring(0,10)); wm[wk]=(wm[wk]||0)+shiftMins(s); });
            const grandHrs = u.shifts.reduce((a,s)=>a+shiftMins(s),0);
            const row = sumWs.addRow([u.name, ...allWeekKeys.map(wk => wm[wk] ? fmtHrsDec(wm[wk]) : '—'), fmtHrsDec(grandHrs), u.shifts.length]);
            applyData(row, ui % 2 === 1);
            row.getCell(1).font = { bold:true, name:'Calibri', size:10, color:{ argb:toArgb(getColor(u.name==='TBD'?null:u.name)) } };
            for (let c = 2; c <= wNumCols; c++) {
                row.getCell(c).alignment = { horizontal:'center', vertical:'middle' };
                if (row.getCell(c).value !== '—') row.getCell(c).numFmt = '0.00';
            }
        });

        const totRow = sumWs.addRow(['TOTAL', ...allWeekKeys.map(wk => {
            const t = allUserList.reduce((a,u)=>a+u.shifts.filter(s=>isoWeekKey(String(s.shift_date).substring(0,10))===wk).reduce((x,s)=>x+shiftMins(s),0),0);
            return t ? fmtHrsDec(t) : '—';
        }), fmtHrsDec(schedules.reduce((a,s)=>a+shiftMins(s),0)), schedules.length]);
        applyTotal(totRow, '#f0fdf4', true);
        for (let c = 2; c <= wNumCols; c++) {
            totRow.getCell(c).alignment = { horizontal:'center', vertical:'middle' };
            if (totRow.getCell(c).value !== '—') totRow.getCell(c).numFmt = '0.00';
        }

        sumWs.views = [{ state:'frozen', ySplit:4 }];

        await saveWorkbook(wb, `Ariya_Team_${child.name.replace(/\s+/g,'_')}_Weekly.xlsx`);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Team Schedule – ${child.name}`} />

            <div className="min-h-screen flex flex-col bg-white print:bg-white">

                {/* ══ TOP STRIP ══ */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('children.show', child.id)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                            Back
                        </Link>
                        <span className="text-gray-200">|</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Ariya Team Schedule</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {calUrl && (
                            <a href={calUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                School Calendar
                            </a>
                        )}
                        <button onClick={exportWeekly}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                            style={{ borderColor: '#6366f1', color: '#6366f1', background: '#6366f115' }}>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                            </svg>
                            Weekly Excel
                        </button>
                        <button onClick={exportMonthly}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                            style={{ borderColor: GREEN, color: GREEN, background: GREEN + '15' }}>
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                            </svg>
                            Monthly Excel
                        </button>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z"/>
                            </svg>
                            Print
                        </button>
                    </div>
                </div>

                {/* ══ MONTH HERO ══ */}
                <div className="flex items-center justify-between px-8 py-6 print:py-3 print:px-4">
                    <button onClick={prev}
                        className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm print:hidden">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>

                    <div className="text-center">
                        <div className="flex items-baseline gap-3 justify-center">
                            <h1 className="text-5xl font-black tracking-tight text-gray-900 print:text-3xl">{MONTHS[mo]}</h1>
                            <span className="text-3xl font-light text-gray-400 print:text-2xl">{yr}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-2 print:hidden">
                            <p className="text-sm text-gray-400">
                                <span className="font-semibold" style={{ color: GREEN }}>{monthShifts.length}</span> shift{monthShifts.length !== 1 ? 's' : ''} scheduled
                            </p>
                            {!isCurrentMonth && (
                                <button onClick={goToday}
                                    className="text-xs font-bold px-3 py-1 rounded-full border-2 transition-colors hover:opacity-80"
                                    style={{ borderColor: GREEN, color: GREEN }}>
                                    Today
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={next}
                        className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm print:hidden">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                {/* ══ CALENDAR ══ */}
                <div className="flex-1 px-4 pb-4 print:px-0 print:pb-0">
                    <div className="border border-gray-200 rounded-2xl overflow-hidden print:border-0 print:rounded-none">

                        {/* Day header */}
                        <div className="grid grid-cols-7 bg-gray-900 print:bg-gray-100">
                            {DAYS.map((d, i) => (
                                <div key={d}
                                    className={`py-3 text-center text-xs font-bold tracking-widest uppercase
                                        ${i===0||i===6 ? 'text-gray-500' : 'text-gray-200'}
                                        ${i < 6 ? 'border-r border-gray-700 print:border-gray-200' : ''}
                                        print:text-gray-500 print:bg-gray-100`}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Weeks */}
                        {weeks.map((week, wi) => (
                            <div key={wi} className="grid grid-cols-7">
                                {week.map((day, di) => {
                                    const isWk      = di===0||di===6;
                                    const isLast    = di===6;
                                    const isLastRow = wi===weeks.length-1;

                                    if (day === null) return (
                                        <div key={`e${wi}-${di}`}
                                            className={`min-h-[150px] print:min-h-[100px]
                                                ${isWk ? 'bg-gray-50' : 'bg-white'}
                                                ${!isLast    ? 'border-r border-gray-100' : ''}
                                                ${!isLastRow ? 'border-b border-gray-100' : ''}`}
                                        />
                                    );

                                    const dk     = dateKey(yr, mo, day);
                                    const shifts = byDate[dk] || [];
                                    const isToday = dk === tStr;
                                    const dayTotalMins = shifts.reduce((acc,s) => acc + shiftMins(s), 0);

                                    return (
                                        <div key={dk}
                                            className={`min-h-[150px] print:min-h-[100px] flex flex-col
                                                ${isWk ? 'bg-gray-50/60' : 'bg-white'}
                                                ${!isLast    ? 'border-r border-gray-100' : ''}
                                                ${!isLastRow ? 'border-b border-gray-100' : ''}`}>

                                            {/* Date row */}
                                            <div className="px-3 pt-3 pb-1.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold leading-none
                                                            ${isToday ? 'text-white' : isWk ? 'text-gray-400' : 'text-gray-800'}`}
                                                        style={isToday ? { background: GREEN } : {}}>
                                                        {day}
                                                    </span>
                                                    {isToday && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Today</span>
                                                    )}
                                                </div>
                                                {/* Day total */}
                                                {dayTotalMins > 0 && (
                                                    <span className="text-[10px] font-bold text-gray-300 tabular-nums">
                                                        {fmtMins(dayTotalMins)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Shift events */}
                                            <div className="px-2 pb-3 space-y-1 flex-1">
                                                {shifts.map(s => {
                                                    const name     = s.user?.name || null;
                                                    const color    = getColor(name);
                                                    const initials = name
                                                        ? name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()
                                                        : '?';
                                                    return (
                                                        <div key={s.id}
                                                            className="rounded-lg overflow-hidden text-xs shadow-sm"
                                                            style={{ borderLeft: `3px solid ${color}`, background: color + '12' }}>
                                                            <div className="px-2 py-1.5">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white font-black"
                                                                        style={{ fontSize: '8px', background: color }}>
                                                                        {initials}
                                                                    </span>
                                                                    <span className={`font-bold truncate ${!name ? 'italic' : ''}`}
                                                                        style={{ color: name ? '#1f2937' : color }}>
                                                                        {name || 'TBD'}
                                                                    </span>
                                                                </div>
                                                                <div className="pl-5 font-semibold" style={{ color }}>
                                                                    {fmt12(s.start_time)} – {fmt12(s.end_time)}
                                                                </div>
                                                                <div className="pl-5 text-gray-400 mt-0.5">{fmtMins(shiftMins(s))}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ STAFF SUMMARY ══ */}
                {userRows.length > 0 && (
                    <div className="px-4 pb-8 print:px-0 print:pb-4">
                        <div className="border border-gray-200 rounded-2xl overflow-hidden print:rounded-none">

                            {/* Table header */}
                            <div className="bg-gray-900 px-5 py-3 flex items-center gap-3 print:bg-gray-100">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-300 print:text-gray-600">
                                    Staff Hours Summary — {MONTHS[mo]} {yr}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50 text-left">
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Staff Member</th>
                                            {weeks.map((_, wi) => (
                                                <th key={wi} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                                                    Week {wi+1}
                                                </th>
                                            ))}
                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-center" style={{ color: GREEN }}>
                                                Monthly Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {userRows.map(u => (
                                            <tr key={u.name} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white font-black text-[10px]"
                                                            style={{ background: u.color }}>
                                                            {u.name === 'TBD' ? '?' : u.name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                                                        </span>
                                                        <span className={`font-semibold ${u.name === 'TBD' ? 'text-red-500 italic' : 'text-gray-800'}`}>
                                                            {u.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                {weeks.map((_, wi) => {
                                                    const wMins = u.weekMins[wi] || 0;
                                                    return (
                                                        <td key={wi} className="px-4 py-3 text-center tabular-nums">
                                                            {wMins > 0 ? (
                                                                <span className="font-semibold text-gray-700">{fmtMins(wMins)}</span>
                                                            ) : (
                                                                <span className="text-gray-200">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-5 py-3 text-center">
                                                    <span className="inline-block font-black text-base tabular-nums px-3 py-0.5 rounded-full"
                                                        style={{ color: u.color, background: u.color + '18' }}>
                                                        {fmtMins(u.totalMins)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Totals row */}
                                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                                            <td className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Total</td>
                                            {weeks.map((_, wi) => {
                                                const wTotal = userRows.reduce((acc, u) => acc + (u.weekMins[wi]||0), 0);
                                                return (
                                                    <td key={wi} className="px-4 py-3 text-center tabular-nums text-gray-700">
                                                        {wTotal > 0 ? fmtMins(wTotal) : <span className="text-gray-200">—</span>}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-5 py-3 text-center">
                                                <span className="font-black text-base tabular-nums" style={{ color: GREEN }}>
                                                    {fmtMins(userRows.reduce((acc, u) => acc + u.totalMins, 0))}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap items-center gap-3 justify-center print:hidden">
                            {userRows.map(u => (
                                <span key={u.name} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: u.color }}/>
                                    {u.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
