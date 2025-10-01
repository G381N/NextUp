'use server';

import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';

// Helper to convert file to data URI
async function fileToDataURI(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function importTasksFromImage(formData: FormData) {
    const file = formData.get('image') as File;

    if (!file) return { success: false, error: 'No image file provided.' };
    
    try {
        const imageDataUri = await fileToDataURI(file);
        const taskTitles = await extractTextFromImage({ imageDataUri });

        if (!taskTitles || taskTitles.length === 0) {
            return { success: true, tasks: [], message: 'No text could be found in the image.' };
        }

        return { success: true, tasks: taskTitles };
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred during import.";
        console.error("Error importing from image:", message);
        return { success: false, error: message };
    }
}

// Made by Gebin George. Check out my other work on gebin.net
