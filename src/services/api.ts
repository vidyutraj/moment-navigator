/**
 * Backend API service layer
 * Provides CRUD operations for Goals and Tasks
 * Communicates with Express backend server
 */

import { LongTermGoal, Task } from '@/types/clarity';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'Network error';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch {
      if (response.status === 0) {
        errorMessage = 'Cannot connect to server. Make sure the backend is running on port 3001.';
      } else {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

class ClarityAPI {
  // ==================== GOALS ====================

  async getGoals(): Promise<LongTermGoal[]> {
    const response = await fetch(`${API_BASE_URL}/goals`);
    return handleResponse<LongTermGoal[]>(response);
  }

  async createGoal(goalData: Omit<LongTermGoal, 'id'>): Promise<LongTermGoal> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData),
    });
    return handleResponse<LongTermGoal>(response);
  }

  async updateGoal(id: string, updates: Partial<Omit<LongTermGoal, 'id'>>): Promise<LongTermGoal> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<LongTermGoal>(response);
  }

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  }

  // ==================== TASKS ====================

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    return handleResponse<Task[]>(response);
  }

  async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse<Task>(response);
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<Task>(response);
  }

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  }

  async completeTask(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/complete`, {
      method: 'PATCH',
    });
    return handleResponse<Task>(response);
  }
}

// Export singleton instance
export const api = new ClarityAPI();

