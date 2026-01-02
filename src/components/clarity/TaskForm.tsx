import { useState, useEffect } from 'react';
import { Task, LongTermGoal, TaskType } from '@/types/clarity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const [deadline, setDeadline] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('general');
  const [goalId, setGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title || '');
        setEstimatedMinutes(task.estimatedMinutes || 30);
        setDeadline(task.deadline || '');
        setTaskType(task.taskType || 'general');
        setGoalId(task.goalId || '');
      } else {
        // Reset form for new task
        setTitle('');
        setEstimatedMinutes(30);
        setDeadline('');
        setTaskType('general');
        setGoalId('');
      }
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !deadline.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        estimatedMinutes,
        deadline: deadline.trim(),
        taskType,
        goalId: goalId || undefined,
        completed: task?.completed || false,
      });
      // Reset form
      setTitle('');
      setEstimatedMinutes(30);
      setDeadline('');
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
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 1)}
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
              <Select value={deadline} onValueChange={setDeadline}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deadline" />
                </SelectTrigger>
                <SelectContent>
                  {deadlineOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {deadline === 'custom' && (
                <Input
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Enter custom deadline"
                  className="mt-2"
                />
              )}
            </div>

            {goals && goals.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="goalId">Related Goal (optional)</Label>
                <Select value={goalId} onValueChange={setGoalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {isSubmitting ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

