import { useState, useEffect } from 'react';
import { Task, LongTermGoal, TaskType } from '@/types/clarity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  task?: Task;
  goals: LongTermGoal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: Omit<Task, 'id'>) => Promise<void>;
}

export function TaskForm({ task, goals, open, onOpenChange, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [estimatedMinutesInput, setEstimatedMinutesInput] = useState('30');
  const [deadline, setDeadline] = useState('');
  const [deadlineType, setDeadlineType] = useState<'preset' | 'custom'>('preset');
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [taskType, setTaskType] = useState<TaskType>('general');
  const [goalId, setGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title || '');
        const minutes = task.estimatedMinutes || 30;
        setEstimatedMinutes(minutes);
        setEstimatedMinutesInput(String(minutes));
        const taskDeadline = task.deadline || '';
        setDeadline(taskDeadline);
        
        // Check if deadline is a custom date (contains "due " followed by a date pattern)
        const customDateMatch = taskDeadline.match(/due\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
        
        if (customDateMatch) {
          setDeadlineType('custom');
          // Extract and parse the date (month, day, year)
          const [, month, day, year] = customDateMatch;
          const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(parsedDate.getTime())) {
            setCustomDate(parsedDate);
          } else {
            setDeadlineType('preset');
            setCustomDate(undefined);
          }
        } else {
          setDeadlineType('preset');
          setCustomDate(undefined);
        }
        
        setTaskType(task.taskType || 'general');
        setGoalId(task.goalId || '');
      } else {
        // Reset form for new task
        setTitle('');
        setEstimatedMinutes(30);
        setEstimatedMinutesInput('30');
        setDeadline('');
        setDeadlineType('preset');
        setCustomDate(undefined);
        setTaskType('general');
        setGoalId('');
      }
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse estimated minutes from input
    const parsedMinutes = parseInt(estimatedMinutesInput) || 1;
    if (parsedMinutes < 1) {
      return;
    }
    
    // Determine final deadline value
    let finalDeadline = deadline;
    
    if (deadlineType === 'custom' && customDate) {
      // Format custom date as "due MM/DD/YYYY"
      finalDeadline = `due ${format(customDate, 'M/d/yyyy')}`;
    }
    
    if (!title.trim() || !finalDeadline.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        estimatedMinutes: parsedMinutes,
        deadline: finalDeadline.trim(),
        taskType,
        goalId: goalId || undefined,
        completed: task?.completed || false,
      });
      // Reset form
      setTitle('');
      setEstimatedMinutes(30);
      setEstimatedMinutesInput('30');
      setDeadline('');
      setDeadlineType('preset');
      setCustomDate(undefined);
      setTaskType('general');
      setGoalId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlineOptions = [
    'today if possible',
    'due tomorrow',
    'by Friday',
    'this week',
    'when you have time',
    'reminder',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min="1"
                  value={estimatedMinutesInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string while typing
                    if (value === '' || /^\d+$/.test(value)) {
                      setEstimatedMinutesInput(value);
                      const parsed = parseInt(value);
                      if (!isNaN(parsed) && parsed >= 1) {
                        setEstimatedMinutes(parsed);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure a valid value on blur
                    const parsed = parseInt(e.target.value);
                    if (isNaN(parsed) || parsed < 1) {
                      setEstimatedMinutesInput('1');
                      setEstimatedMinutes(1);
                    } else {
                      setEstimatedMinutesInput(String(parsed));
                      setEstimatedMinutes(parsed);
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskType">Type</Label>
                <Select value={taskType} onValueChange={(value: TaskType) => setTaskType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-negotiable">Non-Negotiable</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Select 
                value={deadlineType === 'custom' ? 'custom' : deadline} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setDeadlineType('custom');
                    setDeadline('');
                    if (!customDate) {
                      // Default to tomorrow if no date selected
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setCustomDate(tomorrow);
                    }
                  } else {
                    setDeadlineType('preset');
                    setDeadline(value);
                    setCustomDate(undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select deadline" />
                </SelectTrigger>
                <SelectContent>
                  {deadlineOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom date...</SelectItem>
                </SelectContent>
              </Select>
              {deadlineType === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !customDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDate(date);
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {goals && goals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="goalId">Related Goal (optional)</Label>
                <Select value={goalId || "none"} onValueChange={(value) => setGoalId(value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

