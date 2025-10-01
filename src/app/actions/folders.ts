'use server';

import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { iconNames } from '@/lib/icons';

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required.'),
  icon: z.string().refine((val) => iconNames.includes(val), 'Invalid icon.'),
});

export async function deleteFolder(folderId: string, userId: string) {
    try {
        if (!userId) {
            throw new Error('User not authenticated');
        }
        
        const folderRef = doc(db, 'users', userId, 'folders', folderId);
        await deleteDoc(folderRef);

        // Note: This should also delete all tasks within the folder.
        // This is a simplified version. A robust implementation would use a transaction or a cloud function.

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error deleting folder:", message);
        return { success: false, error: message };
    }
}

// Made by Gebin George. Check out my other work on gebin.net
