/**
 * Seed script to populate the database with template data
 * Run with: node seed.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const TASKS_FILE = join(DATA_DIR, 'tasks.json');
const GOALS_FILE = join(DATA_DIR, 'goals.json');

const templateGoals = [
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
  {
    id: 'goal-5',
    title: 'Develop better communication skills',
    description: 'Clear writing, effective presentations, active listening',
  },
];

const templateTasks = [
  {
    id: 'task-1',
    title: 'Read chapter 3 of Designing Data-Intensive Applications',
    estimatedMinutes: 45,
    deadline: 'by Friday',
    goalId: 'goal-1',
    taskType: 'growth',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Complete assignment for CS 201',
    estimatedMinutes: 60,
    deadline: 'due tomorrow',
    taskType: 'non-negotiable',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Go for a 20-minute walk',
    estimatedMinutes: 25,
    deadline: 'today if possible',
    goalId: 'goal-3',
    taskType: 'growth',
    completed: false,
  },
  {
    id: 'task-4',
    title: 'Review pull request from Alex',
    estimatedMinutes: 20,
    deadline: 'due tomorrow',
    taskType: 'non-negotiable',
    completed: false,
  },
  {
    id: 'task-5',
    title: 'Work through Linux course module',
    estimatedMinutes: 35,
    deadline: 'this week',
    goalId: 'goal-1',
    taskType: 'growth',
    completed: false,
  },
  {
    id: 'task-6',
    title: 'Submit lab report for Physics',
    estimatedMinutes: 40,
    deadline: 'by Friday',
    taskType: 'non-negotiable',
    completed: false,
  },
  {
    id: 'task-7',
    title: 'Brainstorm side project ideas',
    estimatedMinutes: 30,
    deadline: 'this week',
    goalId: 'goal-2',
    taskType: 'growth',
    completed: false,
  },
  {
    id: 'task-8',
    title: 'Write first draft of project proposal',
    estimatedMinutes: 45,
    deadline: 'this week',
    goalId: 'goal-2',
    taskType: 'growth',
    completed: false,
  },
  {
    id: 'task-9',
    title: 'Schedule doctor appointment',
    estimatedMinutes: 15,
    deadline: 'this week',
    goalId: 'goal-3',
    taskType: 'non-negotiable',
    completed: false,
  },
  {
    id: 'task-10',
    title: 'Finish current book chapter',
    estimatedMinutes: 40,
    deadline: 'when you have time',
    goalId: 'goal-4',
    taskType: 'growth',
    completed: false,
  },
  {
    id: 'task-11',
    title: 'Practice presentation for team meeting',
    estimatedMinutes: 25,
    deadline: 'due tomorrow',
    goalId: 'goal-5',
    taskType: 'non-negotiable',
    completed: false,
  },
  {
    id: 'task-12',
    title: 'Update project documentation',
    estimatedMinutes: 30,
    deadline: 'this week',
    taskType: 'general',
    completed: false,
  },
];

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw error;
  }
}

async function seedData() {
  try {
    console.log('🌱 Seeding template data...\n');
    
    await ensureDataDir();

    // Seed goals - merge with existing
    console.log('📝 Adding template goals...');
    let existingGoals = [];
    try {
      const data = await fs.readFile(GOALS_FILE, 'utf-8');
      existingGoals = JSON.parse(data);
    } catch {
      // File doesn't exist or is empty, that's fine
    }
    
    // Only add goals that don't already exist (by id)
    const existingGoalIds = new Set(existingGoals.map(g => g.id));
    const newGoals = templateGoals.filter(g => !existingGoalIds.has(g.id));
    const allGoals = [...existingGoals, ...newGoals];
    
    await fs.writeFile(GOALS_FILE, JSON.stringify(allGoals, null, 2));
    console.log(`✅ Added ${newGoals.length} new goals (${allGoals.length} total)\n`);

    // Seed tasks - merge with existing
    console.log('📋 Adding template tasks...');
    let existingTasks = [];
    try {
      const data = await fs.readFile(TASKS_FILE, 'utf-8');
      existingTasks = JSON.parse(data);
    } catch {
      // File doesn't exist or is empty, that's fine
    }
    
    // Only add tasks that don't already exist (by id)
    const existingTaskIds = new Set(existingTasks.map(t => t.id));
    const newTasks = templateTasks.filter(t => !existingTaskIds.has(t.id));
    const allTasks = [...existingTasks, ...newTasks];
    
    await fs.writeFile(TASKS_FILE, JSON.stringify(allTasks, null, 2));
    console.log(`✅ Added ${newTasks.length} new tasks (${allTasks.length} total)\n`);

    console.log('🎉 Seeding complete!');
    console.log(`\nGoals file: ${GOALS_FILE}`);
    console.log(`Tasks file: ${TASKS_FILE}`);
    console.log('\nThe server will automatically reload to see the new data.');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();

