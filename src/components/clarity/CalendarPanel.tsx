import { CalendarEvent } from '@/types/clarity';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarPanelProps {
  events: CalendarEvent[];
  currentHour: number;
  openTimeWindow: { start: number; end: number } | null;
  isHighlightingOpen: boolean;
}

const CALENDAR_START = 8;
const CALENDAR_END = 18;
const HOUR_HEIGHT = 60;

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function CalendarPanel({ 
  events, 
  currentHour, 
  openTimeWindow,
  isHighlightingOpen 
}: CalendarPanelProps) {
  const hours = Array.from(
    { length: CALENDAR_END - CALENDAR_START }, 
    (_, i) => CALENDAR_START + i
  );

  const getEventStyle = (event: CalendarEvent) => {
    const top = (event.startHour - CALENDAR_START) * HOUR_HEIGHT;
    const height = (event.endHour - event.startHour) * HOUR_HEIGHT;
    return { top: `${top}px`, height: `${height}px` };
  };

  const currentTimePosition = currentHour >= CALENDAR_START && currentHour <= CALENDAR_END
    ? (currentHour - CALENDAR_START) * HOUR_HEIGHT
    : null;

  const openWindowStyle = openTimeWindow && isHighlightingOpen
    ? {
        top: `${(openTimeWindow.start - CALENDAR_START) * HOUR_HEIGHT}px`,
        height: `${(openTimeWindow.end - openTimeWindow.start) * HOUR_HEIGHT}px`,
      }
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium text-foreground">Today</h2>
          <span className="text-sm text-muted-foreground ml-auto">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-1 italic">
          Constraints, not plans
        </p>
      </div>
      
      <div className="flex-1 relative overflow-y-auto">
        <div 
          className="relative"
          style={{ height: `${(CALENDAR_END - CALENDAR_START) * HOUR_HEIGHT}px` }}
        >
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/30"
              style={{ top: `${(hour - CALENDAR_START) * HOUR_HEIGHT}px` }}
            >
              <span className="absolute -top-2.5 left-0 text-xs text-muted-foreground bg-background pr-2">
                {formatHour(hour)}
              </span>
            </div>
          ))}

          {/* Open time window highlight */}
          {openWindowStyle && (
            <div
              className="absolute left-12 right-2 bg-highlight/60 border-2 border-dashed border-highlight-border rounded-lg animate-gentle-pulse z-10"
              style={openWindowStyle}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-highlight-border bg-background/80 px-3 py-1 rounded-full">
                  Open time
                </span>
              </div>
            </div>
          )}

          {/* Events */}
          {events.map((event) => (
            <div
              key={event.id}
              className={cn(
                "absolute left-12 right-2 rounded-lg px-3 py-2 overflow-hidden transition-all",
                event.type === 'fixed' 
                  ? "bg-fixed-event text-fixed-event-foreground"
                  : "bg-placed-task border-2 border-placed-task-border text-foreground animate-fade-scale"
              )}
              style={getEventStyle(event)}
            >
              <div className="font-medium text-sm truncate">{event.title}</div>
              <div className="text-xs opacity-75">
                {formatHour(event.startHour)} – {formatHour(event.endHour)}
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 flex items-center z-20"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <div className="flex-1 h-0.5 bg-destructive" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
