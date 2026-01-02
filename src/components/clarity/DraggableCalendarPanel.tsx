import { useState, useCallback } from 'react';
import { CalendarEvent } from '@/types/clarity';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CalendarPanelProps {
  events: CalendarEvent[];
  currentHour: number;
  openTimeWindow: { start: number; end: number } | null;
  isHighlightingOpen: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (eventId: string, newStartHour: number, newEndHour: number) => void;
  onTimeSlotClick?: (startHour: number, endHour: number) => void;
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

function hourFromPosition(y: number): number {
  return CALENDAR_START + (y / HOUR_HEIGHT);
}

function snapToQuarterHour(hour: number): number {
  return Math.round(hour * 4) / 4;
}

interface DraggableEventProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

function DraggableEvent({ event, onClick }: DraggableEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: event.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const getEventStyle = () => {
    const top = (event.startHour - CALENDAR_START) * HOUR_HEIGHT;
    const height = (event.endHour - event.startHour) * HOUR_HEIGHT;
    return { top: `${top}px`, height: `${height}px`, ...style };
  };

  return (
    <div
      ref={setNodeRef}
      style={getEventStyle()}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-12 right-2 rounded-lg px-3 py-2 overflow-hidden transition-all cursor-move",
        event.type === 'fixed' 
          ? "bg-fixed-event text-fixed-event-foreground"
          : "bg-placed-task border-2 border-placed-task-border text-foreground",
        isDragging && "opacity-50 z-50 shadow-lg"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      <div className="text-xs opacity-75">
        {formatHour(event.startHour)} – {formatHour(event.endHour)}
      </div>
    </div>
  );
}

export function DraggableCalendarPanel({ 
  events, 
  currentHour, 
  openTimeWindow,
  isHighlightingOpen,
  onEventClick,
  onEventDrop,
  onTimeSlotClick,
}: CalendarPanelProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const hours = Array.from(
    { length: CALENDAR_END - CALENDAR_START }, 
    (_, i) => CALENDAR_START + i
  );

  const currentTimePosition = currentHour >= CALENDAR_START && currentHour <= CALENDAR_END
    ? (currentHour - CALENDAR_START) * HOUR_HEIGHT
    : null;

  const openWindowStyle = openTimeWindow && isHighlightingOpen
    ? {
        top: `${(openTimeWindow.start - CALENDAR_START) * HOUR_HEIGHT}px`,
        height: `${(openTimeWindow.end - openTimeWindow.start) * HOUR_HEIGHT}px`,
      }
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const eventData = events.find(e => e.id === active.id);
    setDraggedEvent(eventData || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);
    setDraggedEvent(null);

    if (!delta.y) return;

    const eventData = events.find(e => e.id === active.id);
    if (!eventData || !onEventDrop) return;

    const deltaHours = delta.y / HOUR_HEIGHT;
    const newStartHour = snapToQuarterHour(eventData.startHour + deltaHours);
    const duration = eventData.endHour - eventData.startHour;
    const newEndHour = snapToQuarterHour(newStartHour + duration);

    // Validate bounds
    if (newStartHour >= CALENDAR_START && newEndHour <= CALENDAR_END && newStartHour < newEndHour) {
      onEventDrop(active.id as string, newStartHour, newEndHour);
    }
  };

  const handleTimeSlotClick = (hour: number) => {
    if (onTimeSlotClick) {
      const startHour = snapToQuarterHour(hour);
      const endHour = snapToQuarterHour(hour + 1); // Default 1 hour slot
      onTimeSlotClick(startHour, endHour);
    }
  };

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
          Constraints, not plans. Click time slot to create event, drag to move.
        </p>
      </div>
      
      <div className="flex-1 relative overflow-y-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
                  onClick={() => handleTimeSlotClick(hour)}
                >
                  <span className="absolute -top-2.5 left-0 text-xs text-muted-foreground bg-background pr-2">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}

              {/* Clickable time slots (for creating events) */}
              {onTimeSlotClick && hours.map((hour) => (
                <div
                  key={`slot-${hour}`}
                  className="absolute left-12 right-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  style={{
                    top: `${(hour - CALENDAR_START) * HOUR_HEIGHT}px`,
                    height: `${HOUR_HEIGHT}px`,
                  }}
                  onClick={() => handleTimeSlotClick(hour)}
                />
              ))}

              {/* Open time window highlight */}
              {openWindowStyle && (
                <div
                  className="absolute left-12 right-2 bg-highlight/60 border-2 border-dashed border-highlight-border rounded-lg animate-gentle-pulse z-10 pointer-events-none"
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
                <DraggableEvent
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                />
              ))}

              {/* Current time indicator */}
              {currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <div className="flex-1 h-0.5 bg-destructive" />
                </div>
              )}
            </div>
          
          <DragOverlay>
            {draggedEvent ? (
              <div
                className={cn(
                  "rounded-lg px-3 py-2 bg-card border-2 border-border shadow-lg",
                  draggedEvent.type === 'fixed' 
                    ? "bg-fixed-event text-fixed-event-foreground"
                    : "bg-placed-task border-placed-task-border text-foreground"
                )}
              >
                <div className="font-medium text-sm">{draggedEvent.title}</div>
                <div className="text-xs opacity-75">
                  {formatHour(draggedEvent.startHour)} – {formatHour(draggedEvent.endHour)}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

