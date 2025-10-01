'use server';

import { autoPrioritizeTasks, type Task as AiTask } from '@/ai/flows/auto-prioritize-tasks';
import type { Task } from '@/types';

// The Task type passed from the client will have dates as ISO strings
type ClientTask = Omit<Task, 'createdAt' | 'deadline'> & {
  createdAt?: string;
  deadline?: string;
};

export async function runTaskPrioritization(tasks: ClientTask[]) {
  if (!tasks || tasks.length === 0) {
    return [];
  }
  try {
    const aiTasks: AiTask[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        deadline: task.deadline,
        priority: task.priority,
    }));

    const prioritizedTasks = await autoPrioritizeTasks(aiTasks);
    if (!prioritizedTasks) {
        throw new Error('AI prioritization returned no tasks.');
    }

    if (prioritizedTasks.length !== tasks.length) {
        throw new Error(`An unexpected response was received from the server. The AI returned a different number of tasks (${prioritizedTasks.length}) than it was given (${tasks.length}).`);
    }

    // Verify that all tasks returned by the AI have an ID
    const tasksMissingIds = prioritizedTasks.filter(task => !task.id);
    if (tasksMissingIds.length > 0) {
      throw new Error(`An unexpected response was received from the server. The AI returned ${tasksMissingIds.length} tasks without an ID.`);
    }

    // Verify that all original task IDs are present in the AI's response
    const originalTaskIds = new Set(tasks.map(t => t.id));
    const returnedTaskIds = new Set(prioritizedTasks.map(t => t.id));
    
    for (const id of originalTaskIds) {
        if (!returnedTaskIds.has(id)) {
            throw new Error(`An unexpected response was received from the server. The AI response is missing original task ID: ${id}`);
        }
    }
    
    return prioritizedTasks;
  } catch (error) {
    console.error('Error prioritizing tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(errorMessage);
  }
}

// Made by Gebin George. Check out my other work on gebin.net
