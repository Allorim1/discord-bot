// Fechas en la zona horaria del servidor (para el Valordle diario y el resumen semanal)
const TIMEZONE = process.env.VALORANT_TIMEZONE || 'America/Caracas';

const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    weekday: 'short'
});

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localParts(date = new Date()) {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour),
        weekday: WEEKDAYS[parts.weekday]
    };
}

function formatDay(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// "2026-09-28"
function dayKey(date = new Date()) {
    const { year, month, day } = localParts(date);
    return formatDay(year, month, day);
}

// Lunes de la semana de esa fecha, ej. "2026-09-28"
function weekKey(date = new Date()) {
    const { year, month, day, weekday } = localParts(date);
    const monday = new Date(Date.UTC(year, month - 1, day - ((weekday + 6) % 7)));
    return formatDay(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate());
}

// Semana anterior a la de esa fecha
function previousWeekKey(date = new Date()) {
    return weekKey(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000));
}

module.exports = {
    TIMEZONE,
    localParts,
    dayKey,
    weekKey,
    previousWeekKey
};
