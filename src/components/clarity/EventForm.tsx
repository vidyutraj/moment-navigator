import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/clarity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventFormProps {
  event?: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function parseHour(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes = '0'] = time.split(':');
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour + parseInt(minutes) / 60;
}

const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour % 12 || 12;
      const period = hour >= 12 ? 'PM' : 'AM';
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m} ${period}`);
    }
  }
  return options;
};

export function EventForm({ event, open, onOpenChange, onSubmit }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [type, setType] = useState<'fixed' | 'placed'>(event?.type || 'fixed');
  const [startTime, setStartTime] = useState(event ? formatHour(event.startHour) : '9:00 AM');
  const [endTime, setEndTime] = useState(event ? formatHour(event.endHour) : '10:00 AM');
  const [date, setDate] = useState<Date>(event?.date ? new Date(event.date + 'T00:00:00') : new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when event prop changes
  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title || '');
        setType(event.type || 'fixed');
        setStartTime(event.startHour ? formatHour(event.startHour) : '9:00 AM');
        setEndTime(event.endHour ? formatHour(event.endHour) : '10:00 AM');
        setDate(event.date ? new Date(event.date + 'T00:00:00') : new Date());
      } else {
        setTitle('');
        setType('fixed');
        setStartTime('9:00 AM');
        setEndTime('10:00 AM');
        setDate(new Date());
      }
    }
  }, [event, open]);

  const timeOptions = generateTimeOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    const startHour = parseHour(startTime);
    const endHour = parseHour(endTime);

    if (endHour <= startHour) {
      alert('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        startHour,
        endHour,
        date: format(date, 'yyyy-MM-dd'),
      });
      // Reset form
      setTitle('');
      setType('fixed');
      setStartTime('9:00 AM');
      setEndTime('10:00 AM');
      setDate(new Date());
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: 'fixed' | 'placed') => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed (Obligation)</SelectItem>
                  <SelectItem value="placed">Placed (From Task)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : event ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

