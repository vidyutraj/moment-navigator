import { LongTermGoal, CalendarEvent, Task } from '@/types/clarity';

export const placeholderGoals: LongTermGoal[] = [
  {
    id: 'goal-1',
    title: 'Become strong at systems design',
    description: 'Deep understanding of distributed systems and architecture patterns',
  },
  {
    id: 'goal-2',
    title: 'Build a meaningful side project',
    description: 'Something that helps others and brings joy',
  },
  {
    id: 'goal-3',
    title: 'Improve physical health',
    description: 'Consistent movement, better sleep, mindful eating',
  },
  {
    id: 'goal-4',
    title: 'Read more deeply',
    description: 'Fewer articles, more books. Depth over breadth.',
  },
];

export const placeholderEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Morning standup',
    startHour: 9,
    endHour: 9.5,
    type: 'fixed',
  },
  {
    id: 'event-2',
    title: 'Lunch break',
    startHour: 12,
    endHour: 13,
    type: 'fixed',
  },
  {
    id: 'event-3',
    title: 'Team sync',
    startHour: 15,
    endHour: 16,
    type: 'fixed',
  },
];

export const placeholderTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Read chapter 3 of Designing Data-Intensive Applications',
    estimatedMinutes: 45,
    deadline: 'by Friday',
    goalId: 'goal-1',
  },
  {
    id: 'task-2',
    title: 'Sketch wireframes for the dashboard',
    estimatedMinutes: 30,
    deadline: 'due tomorrow',
    goalId: 'goal-2',
  },
  {
    id: 'task-3',
    title: 'Go for a 20-minute walk',
    estimatedMinutes: 25,
    deadline: 'today if possible',
    goalId: 'goal-3',
  },
  {
    id: 'task-4',
    title: 'Review pull request from Alex',
    estimatedMinutes: 20,
    deadline: 'due tomorrow',
  },
  {
    id: 'task-5',
    title: 'Write notes on the last book chapter',
    estimatedMinutes: 35,
    deadline: 'this week',
    goalId: 'goal-4',
  },
  {
    id: 'task-6',
    title: 'Clean up email inbox',
    estimatedMinutes: 15,
    deadline: 'when you have time',
  },
];
