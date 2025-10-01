'use server';

import { db } from '@/lib/firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Task } from '@/types';

export async function undoTask(task: Task, userId: string) {
    try {
        if (!userId) {
            throw new Error('User not authenticated');
        }
        
        const taskRef = doc(db, 'users', userId, 'tasks', task.id);
        
        // Firestore Timestamps need to be re-created when coming from the client
        const dataToRestore: any = { ...task };
        delete dataToRestore.id;
        if (dataToRestore.createdAt) {
            dataToRestore.createdAt = new Timestamp(dataToRestore.createdAt.seconds, dataToRestore.createdAt.nanoseconds);
        }
        if (dataToRestore.deadline) {
            dataToRestore.deadline = new Timestamp(dataToRestore.deadline.seconds, dataToRestore.deadline.nanoseconds);
        }


        await setDoc(taskRef, dataToRestore);

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error undoing task:", message);
        return { success: false, error: message };
    }
}

// Made by Gebin George. Check out my other work on gebin.net
