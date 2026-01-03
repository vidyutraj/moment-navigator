import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Clock, Calendar } from 'lucide-react';
import { TimeWindow } from '@/types/clarity';

interface TimeConfirmationDialogProps {
  open: boolean;
  suggestedEndTime?: Date; // Optional calendar-suggested end time
  suggestedSource?: 'calendar-suggested' | 'system-default';
  eventName?: string; // Name of the calendar event if calendar-suggested
  onConfirm: (timeWindow: TimeWindow) => void;
  onCancel: () => void;
}

/**
 * TimeConfirmationDialog allows users to specify how much uninterrupted time they have.
 * 
 * DESIGN INVARIANT: User-provided time always wins over calendar-suggested time.
 * The source field tracks whether the user confirmed or we're using a default suggestion.
 * Calendar data is advisory only - user can always override.
 */
export function TimeConfirmationDialog({ 
  open, 
  suggestedEndTime,
  suggestedSource = 'system-default',
  eventName,
  onConfirm, 
  onCancel 
}: TimeConfirmationDialogProps) {
  const [endTime, setEndTime] = useState<Date>(() => {
    // Initial default: 45 minutes from now
    const now = new Date();
    return new Date(now.getTime() + 45 * 60 * 1000);
  });
  const [source, setSource] = useState<'user' | 'calendar-suggested' | 'system-default'>('system-default');
  const [validationMessage, setValidationMessage] = useState<string>('');

  // Reset when dialog opens
  // DESIGN INVARIANT: Use calendar-suggested time if provided, otherwise fall back to system default
  // User can always override either suggestion
  useEffect(() => {
    if (open) {
      const now = new Date(); // Always use current time
      
      if (suggestedEndTime) {
        // Check if suggested time is valid (must be in the future)
        if (suggestedEndTime > now) {
          // Use calendar-suggested time
          setEndTime(suggestedEndTime);
          setSource(suggestedSource);
          
          if (import.meta.env.DEV && suggestedSource === 'calendar-suggested') {
            const minutesUntil = Math.round((suggestedEndTime.getTime() - now.getTime()) / (60 * 1000));
            console.log('📅 Using calendar-suggested time:', {
              suggested: suggestedEndTime.toLocaleString(),
              minutesUntil,
              now: now.toLocaleString(),
            });
          }
        } else {
          // Suggested time is in the past - fall back to default
          console.warn('📅 Calendar suggested time is in the past, using default');
          const newDefault = new Date(now.getTime() + 45 * 60 * 1000);
          setEndTime(newDefault);
          setSource('system-default');
        }
      } else {
        // Fall back to system default (45 minutes)
        const newDefault = new Date(now.getTime() + 45 * 60 * 1000);
        setEndTime(newDefault);
        setSource('system-default');
      }
      
      setValidationMessage('');
    }
  }, [open, suggestedEndTime, suggestedSource]);

  // Format time for input (HH:MM)
  const formatTimeForInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Parse time from input (HH:MM)
  const parseTimeFromInput = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const currentNow = new Date(); // Use current time, not captured closure value
    const newDate = new Date(currentNow);
    newDate.setHours(hours, minutes, 0, 0);
    
    // If time is earlier than now, assume it's tomorrow
    if (newDate < currentNow) {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    return newDate;
  };

  const handleTimeChange = (timeString: string) => {
    const newEndTime = parseTimeFromInput(timeString);
    setEndTime(newEndTime);
    setSource('user'); // User editing means they're providing the time
    setValidationMessage('');
  };

  const handlePresetClick = (minutes: number) => {
    const currentNow = new Date(); // Use current time
    const newEndTime = new Date(currentNow.getTime() + minutes * 60 * 1000);
    setEndTime(newEndTime);
    setSource('user'); // Preset click counts as user-provided
    setValidationMessage('');
  };

  const handleConfirm = () => {
    // Recalculate now to ensure it's current
    const currentNow = new Date();
    const availableMinutes = Math.round((endTime.getTime() - currentNow.getTime()) / (60 * 1000));
    
    // Validation: must be at least 10 minutes
    if (availableMinutes < 10) {
      setValidationMessage('This may be a bit short to start something.');
      return;
    }

    // DESIGN INVARIANT: User-provided time always wins over calendar-suggested time
    // The source field is already set correctly by handleTimeChange and handlePresetClick
    const timeWindow: TimeWindow = {
      startTime: currentNow, // Always use current time when confirming
      endTime,
      source,
      eventName: source === 'calendar-suggested' ? eventName : undefined, // Only include event name if calendar-suggested
    };

    onConfirm(timeWindow);
  };

  const currentNow = new Date();
  const availableMinutes = Math.round((endTime.getTime() - currentNow.getTime()) / (60 * 1000));

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>How much uninterrupted time do you have right now?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Time picker */}
          <div className="space-y-2">
            <Label htmlFor="endTime" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Until
            </Label>
            <Input
              id="endTime"
              type="time"
              value={formatTimeForInput(endTime)}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="text-lg"
            />
            {source === 'calendar-suggested' && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Based on your calendar
                  </p>
                </div>
                {eventName && (
                  <p className="text-xs font-medium text-foreground ml-4">
                    Next: {eventName}
                  </p>
                )}
              </div>
            )}
            {source === 'system-default' && (
              <p className="text-xs text-muted-foreground">
                Default suggestion
              </p>
            )}
            {source === 'user' && (
              <p className="text-xs text-muted-foreground">
                You have about {availableMinutes} {availableMinutes === 1 ? 'minute' : 'minutes'}
              </p>
            )}
            {availableMinutes < 15 && source === 'calendar-suggested' && (
              <p className="text-xs text-muted-foreground italic">
                Your next event starts soon — you may only have a short window.
              </p>
            )}
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick presets</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(20)}
                className="flex-1"
              >
                20 min
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(40)}
                className="flex-1"
              >
                40 min
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(60)}
                className="flex-1"
              >
                1 hour
              </Button>
            </div>
          </div>

          {/* Validation message */}
          {validationMessage && (
            <p className="text-sm text-muted-foreground italic">
              {validationMessage}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

