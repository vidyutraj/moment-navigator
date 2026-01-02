import { useState } from 'react';
import { CalendarEvent } from '@/types/clarity';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getCurrentEST,
  formatESTDate,
  getStartOfWeekEST,
  getStartOfMonthEST,
  addDays,
  addMonths,
  isSameDay,
  getWeekDays,
  getMonthDays,
  getESTHour,
} from '@/lib/timezone';
import { format } from 'date-fns';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentHour: number;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, startHour: number, endHour: number) => void;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const CALENDAR_START = 8;
const CALENDAR_END = 18;
const HOUR_HEIGHT = 60;

export function CalendarView({ events, currentHour, onEventClick, onTimeSlotClick }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(getCurrentEST());

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = formatESTDate(date);
    return events.filter(e => {
      const eventDate = e.date || formatESTDate(getCurrentEST());
      return eventDate === dateStr;
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, direction === 'next' ? 7 : -7));
    } else {
      setCurrentDate(addMonths(currentDate, direction === 'next' ? 1 : -1));
    }
  };

  const goToToday = () => {
    setCurrentDate(getCurrentEST());
  };

  const getViewTitle = (): string => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = getStartOfWeekEST(currentDate);
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) {
        return format(start, 'MMMM d') + ' - ' + format(end, 'd, yyyy');
      } else {
        return format(start, 'MMM d') + ' - ' + format(end, 'MMM d, yyyy');
      }
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: CALENDAR_END - CALENDAR_START }, (_, i) => CALENDAR_START + i);
    const isToday = isSameDay(currentDate, getCurrentEST());

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${(CALENDAR_END - CALENDAR_START) * HOUR_HEIGHT}px` }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/30"
              style={{ top: `${(hour - CALENDAR_START) * HOUR_HEIGHT}px` }}
            >
              <span className="absolute -top-2.5 left-0 text-xs text-muted-foreground bg-background pr-2">
                {formatHour(hour)}
              </span>
              {onTimeSlotClick && (
                <div
                  className="absolute left-12 right-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  style={{
                    top: '0px',
                    height: `${HOUR_HEIGHT}px`,
                  }}
                  onClick={() => onTimeSlotClick(currentDate, hour, hour + 1)}
                />
              )}
            </div>
          ))}

          {dayEvents.map((event) => {
            const top = (event.startHour - CALENDAR_START) * HOUR_HEIGHT;
            const height = (event.endHour - event.startHour) * HOUR_HEIGHT;
            return (
              <div
                key={event.id}
                className={cn(
                  "absolute left-12 right-2 rounded-lg px-3 py-2 cursor-pointer transition-all",
                  event.type === 'fixed'
                    ? "bg-fixed-event text-fixed-event-foreground"
                    : "bg-placed-task border-2 border-placed-task-border text-foreground"
                )}
                style={{ top: `${top}px`, height: `${height}px` }}
                onClick={() => onEventClick?.(event)}
              >
                <div className="font-medium text-sm truncate">{event.title}</div>
                <div className="text-xs opacity-75">
                  {formatHour(event.startHour)} – {formatHour(event.endHour)}
                </div>
              </div>
            );
          })}

          {isToday && (
            <div
              className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: `${(currentHour - CALENDAR_START) * HOUR_HEIGHT}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <div className="flex-1 h-0.5 bg-destructive" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = getStartOfWeekEST(currentDate);
    const weekDays = getWeekDays(weekStart);

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border/30 flex-shrink-0">
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, getCurrentEST());
            return (
              <div key={idx} className="border-r border-border/30 last:border-r-0">
                <div className={cn(
                  "p-2 text-center border-b border-border/30",
                  isToday && "bg-highlight/30"
                )}>
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg font-medium mt-1",
                    isToday && "text-highlight-border"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                  <div className="p-2 space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-2 rounded cursor-pointer truncate",
                          event.type === 'fixed'
                            ? "bg-fixed-event/80 text-fixed-event-foreground"
                            : "bg-placed-task/80 border border-placed-task-border text-foreground"
                        )}
                        onClick={() => onEventClick?.(event)}
                        title={`${formatHour(event.startHour)} - ${formatHour(event.endHour)}: ${event.title}`}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-75">
                          {formatHour(event.startHour)} - {formatHour(event.endHour)}
                        </div>
                      </div>
                    ))}
                    {onTimeSlotClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => onTimeSlotClick(day, 9, 10)}
                      >
                        + Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border/30 flex-shrink-0">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border/30 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {monthDays.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, getCurrentEST());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <div
                key={idx}
                className={cn(
                  "border-r border-b border-border/30 p-1 min-h-[100px]",
                  !isCurrentMonth && "bg-muted/20",
                  isToday && "bg-highlight/30 ring-2 ring-highlight-border/50"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isToday && "text-highlight-border",
                  !isCurrentMonth && "text-muted-foreground/50"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded cursor-pointer truncate",
                        event.type === 'fixed'
                          ? "bg-fixed-event/80 text-fixed-event-foreground"
                          : "bg-placed-task/80 border border-placed-task-border text-foreground"
                      )}
                      onClick={() => onEventClick?.(event)}
                      title={`${formatHour(event.startHour)} - ${formatHour(event.endHour)}: ${event.title}`}
                    >
                      {formatHour(event.startHour)} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold w-64 text-center">
              {getViewTitle()}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>
    </div>
  );
}

