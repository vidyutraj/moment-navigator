/**
 * Timezone utilities for Eastern Time (EST/EDT)
 */

export function getCurrentEST(): Date {
  const now = new Date();
  // Convert to Eastern Time
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return estTime;
}

export function toEST(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

export function formatESTDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');
}

export function getESTHour(date: Date = new Date()): number {
  const estDate = getCurrentEST();
  if (date !== new Date()) {
    // For specific date, convert it
    const converted = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    return converted.getHours() + converted.getMinutes() / 60;
  }
  return estDate.getHours() + estDate.getMinutes() / 60;
}

export function getStartOfWeekEST(date: Date = getCurrentEST()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Subtract days to get to Sunday
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export function getStartOfMonthEST(date: Date = getCurrentEST()): Date {
  const d = new Date(date);
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

export function getMonthDays(date: Date): Date[] {
  const startOfMonth = getStartOfMonthEST(date);
  const firstDayOfWeek = startOfMonth.getDay();
  const daysInMonth = getDaysInMonth(startOfMonth);
  const days: Date[] = [];
  
  // Add days from previous month
  const prevMonthEnd = new Date(startOfMonth);
  prevMonthEnd.setDate(0);
  const daysInPrevMonth = prevMonthEnd.getDate();
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = new Date(startOfMonth);
    day.setDate(-i);
    days.push(day);
  }
  
  // Add days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(startOfMonth);
    day.setDate(i);
    days.push(day);
  }
  
  // Add days from next month to fill the grid
  const remaining = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remaining; i++) {
    const day = new Date(startOfMonth);
    day.setMonth(startOfMonth.getMonth() + 1);
    day.setDate(i);
    days.push(day);
  }
  
  return days;
}

