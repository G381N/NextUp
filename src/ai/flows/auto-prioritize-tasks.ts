// src/ai/flows/auto-prioritize-tasks.ts
'use server';

/**
 * @fileOverview A flow for intelligently prioritizing tasks based on their descriptions.
 *
 * - autoPrioritizeTasks - A function that handles the intelligent task processing.
 * - AutoPrioritizeTasksInput - The input type for the autoPrioritizeTasks function.
 * - AutoPrioritizeTasksOutput - The return type for the autoPrioritizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task'),
  title: z.string().describe('Description of the task'),
  deadline: z.string().optional().describe('Optional deadline for the task (YYYY-MM-DD)'),
  priority: z.enum(['High', 'Medium', 'Low']).optional().describe('The priority of the task'),
});

export type Task = z.infer<typeof TaskSchema>;

const AutoPrioritizeTasksInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('Array of tasks to be prioritized'),
});

export type AutoPrioritizeTasksInput = z.infer<typeof AutoPrioritizeTasksInputSchema>;

const EnrichedTaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task'),
  title: z.string().describe('Description of the task'),
  estimatedTimeToComplete: z.number().describe('Estimated time to complete the task in minutes'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the task'),
  deadline: z.string().optional().describe('Optional deadline for the task (YYYY-MM-DD)'),
});

const AutoPrioritizeTasksOutputSchema = z.array(EnrichedTaskSchema).describe('Sorted and enriched array of tasks');

export type AutoPrioritizeTasksOutput = z.infer<typeof AutoPrioritizeTasksOutputSchema>;

export async function autoPrioritizeTasks(input: Task[]): Promise<AutoPrioritizeTasksOutput> {
  return prioritizeTasksFlow({tasks: input});
}

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: AutoPrioritizeTasksInputSchema},
  output: {schema: AutoPrioritizeTasksOutputSchema},
  prompt: `You are an expert in task management and productivity optimization. 
For each task provided, you must determine its priority (High, Medium, Low) and estimate the time to complete it in minutes.
Then, sort the full list of tasks in an order that minimizes overall turnaround time, prevents starvation and deadlocks, and reduces procrastination. 
Tasks that can be completed quicker should be prioritized to avoid procrastination, but deadlines are also important.
Quick wins (tasks under 15 minutes) should be prioritized first to build momentum.

Tasks:
{{#each tasks}}
- ID: {{this.id}}, Title: {{this.title}}{{#if this.deadline}}, Deadline: {{this.deadline}}{{/if}}, Current Priority: {{#if this.priority}}{{this.priority}}{{else}}Not set{{/if}}
{{/each}}

Return the enriched and sorted tasks as a JSON array. Each task object in the array must include the id, title, estimatedTimeToComplete, priority, and deadline if it was provided.
`,
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: AutoPrioritizeTasksInputSchema,
    outputSchema: AutoPrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prioritizeTasksPrompt(input);
    return output!;
  }
);

// Made by Gebin George. Check out my other work on gebin.net
