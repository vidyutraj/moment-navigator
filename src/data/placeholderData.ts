import { LongTermGoal, Task } from '@/types/clarity';

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

export const placeholderTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Read chapter 3 of Designing Data-Intensive Applications',
    estimatedMinutes: 45,
    deadline: 'by Friday',
    goalId: 'goal-1',
    taskType: 'growth',
  },
  {
    id: 'task-2',
    title: 'Complete assignment for CS 201',
    estimatedMinutes: 60,
    deadline: 'due tomorrow',
    taskType: 'non-negotiable',
  },
  {
    id: 'task-3',
    title: 'Go for a 20-minute walk',
    estimatedMinutes: 25,
    deadline: 'today if possible',
    goalId: 'goal-3',
    taskType: 'growth',
  },
  {
    id: 'task-4',
    title: 'Review pull request from Alex',
    estimatedMinutes: 20,
    deadline: 'due tomorrow',
    taskType: 'non-negotiable',
  },
  {
    id: 'task-5',
    title: 'Work through Linux course module',
    estimatedMinutes: 35,
    deadline: 'this week',
    goalId: 'goal-1',
    taskType: 'growth',
  },
  {
    id: 'task-6',
    title: 'Submit lab report for Physics',
    estimatedMinutes: 40,
    deadline: 'by Friday',
    taskType: 'non-negotiable',
  },
  {
    id: 'task-7',
    title: 'Clean up email inbox',
    estimatedMinutes: 15,
    deadline: 'when you have time',
    taskType: 'general',
  },
];
