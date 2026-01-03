/**
 * Express backend server for Clarity app
 * Handles API endpoints for Tasks and Goals
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const DATA_DIR = join(__dirname, 'data');
const TASKS_FILE = join(DATA_DIR, 'tasks.json');
const GOALS_FILE = join(DATA_DIR, 'goals.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Initialize data files with empty arrays if they don't exist
async function initializeDataFile(filePath, defaultValue = []) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

// Helper to read data
async function readData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Helper to write data
async function writeData(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// Generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize server data
async function initializeServer() {
  await ensureDataDir();
  await initializeDataFile(TASKS_FILE);
  await initializeDataFile(GOALS_FILE);
}

// ==================== GOALS ENDPOINTS ====================

app.get('/api/goals', async (req, res) => {
  try {
    const goals = await readData(GOALS_FILE);
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const goals = await readData(GOALS_FILE);
    const newGoal = {
      id: generateId(),
      title: title.trim(),
      description: description?.trim() || undefined,
    };

    goals.push(newGoal);
    await writeData(GOALS_FILE, goals);
    
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const goals = await readData(GOALS_FILE);
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goals[index] = {
      ...goals[index],
      title: title.trim(),
      description: description?.trim() || undefined,
    };

    await writeData(GOALS_FILE, goals);
    res.json(goals[index]);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const goals = await readData(GOALS_FILE);
    const tasks = await readData(TASKS_FILE);

    // Remove goal from tasks that reference it
    const updatedTasks = tasks.map(task => 
      task.goalId === id ? { ...task, goalId: undefined } : task
    );
    await writeData(TASKS_FILE, updatedTasks);

    const filteredGoals = goals.filter(g => g.id !== id);
    
    if (filteredGoals.length === goals.length) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await writeData(GOALS_FILE, filteredGoals);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// ==================== TASKS ENDPOINTS ====================

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await readData(TASKS_FILE);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, estimatedMinutes, deadline, taskType, goalId, completed } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!estimatedMinutes || estimatedMinutes <= 0) {
      return res.status(400).json({ error: 'Valid estimated minutes is required' });
    }
    if (!deadline || !deadline.trim()) {
      return res.status(400).json({ error: 'Deadline is required' });
    }
    if (!taskType || !['non-negotiable', 'growth', 'general'].includes(taskType)) {
      return res.status(400).json({ error: 'Valid task type is required' });
    }

    const tasks = await readData(TASKS_FILE);
    const newTask = {
      id: generateId(),
      title: title.trim(),
      estimatedMinutes: parseInt(estimatedMinutes),
      deadline: deadline.trim(),
      taskType,
      goalId: goalId || undefined,
      completed: completed || false,
    };

    tasks.push(newTask);
    await writeData(TASKS_FILE, tasks);
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, estimatedMinutes, deadline, taskType, goalId, completed } = req.body;

    const tasks = await readData(TASKS_FILE);
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = {
      ...tasks[index],
      ...(title !== undefined && { title: title.trim() }),
      ...(estimatedMinutes !== undefined && { estimatedMinutes: parseInt(estimatedMinutes) }),
      ...(deadline !== undefined && { deadline: deadline.trim() }),
      ...(taskType !== undefined && { taskType }),
      ...(goalId !== undefined && { goalId: goalId || undefined }),
      ...(completed !== undefined && { completed }),
    };

    // Validate required fields
    if (!updatedTask.title || !updatedTask.title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!updatedTask.estimatedMinutes || updatedTask.estimatedMinutes <= 0) {
      return res.status(400).json({ error: 'Valid estimated minutes is required' });
    }
    if (!updatedTask.deadline || !updatedTask.deadline.trim()) {
      return res.status(400).json({ error: 'Deadline is required' });
    }
    if (!updatedTask.taskType || !['non-negotiable', 'growth', 'general'].includes(updatedTask.taskType)) {
      return res.status(400).json({ error: 'Valid task type is required' });
    }

    tasks[index] = updatedTask;
    await writeData(TASKS_FILE, tasks);
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await readData(TASKS_FILE);
    const filteredTasks = tasks.filter(t => t.id !== id);

    if (filteredTasks.length === tasks.length) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await writeData(TASKS_FILE, filteredTasks);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await readData(TASKS_FILE);
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks[index].completed = true;
    await writeData(TASKS_FILE, tasks);
    
    res.json(tasks[index]);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await initializeServer();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

